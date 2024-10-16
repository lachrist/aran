import {
  EMPTY,
  flatenTree,
  map,
  bindSequence,
  initSequence,
  liftSequenceX_,
  mapSequence,
  NULL_SEQUENCE,
  zeroSequence,
} from "../../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeReadExpression,
  makeWriteEffect,
  makeIntrinsicExpression,
  makeImportExpression,
  makeApplyExpression,
  makeClosureExpression,
  makeRoutineBlock,
  makeEffectStatement,
  listExpressionEffect,
} from "../../../node.mjs";
import {
  makeBinaryExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../error.mjs";
import {
  mangleBaseVariable,
  mangleConstantMetaVariable,
} from "../../../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../../cache.mjs";
import { AranExecError, AranTypeError } from "../../../../error.mjs";
import {
  makeBaseDeclarationPrelude,
  makeMetaDeclarationPrelude,
  makePrefixPrelude,
  incorporateEffect,
  initSyntaxErrorExpression,
} from "../../../prelude/index.mjs";
import {
  findVariableImport,
  listVariableExport,
} from "../../../query/index.mjs";
import { nextMeta } from "../../../meta.mjs";

/**
 * @type {(
 *   status: import(".").Status,
 *   closure: import("..").Closure,
 * ) => import(".").Status}
 */
const updateStatus = (status, closure) => {
  switch (status) {
    case "live": {
      return "live";
    }
    case "dead": {
      switch (closure) {
        case "internal": {
          return "dead";
        }
        case "external": {
          return "schrodinger";
        }
        default: {
          throw new AranTypeError(closure);
        }
      }
    }
    case "schrodinger": {
      return "schrodinger";
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};

/**
 * @type {(
 *   binding: import("../../../annotation/hoisting").Binding,
 * ) => "nope" | "away" | "near"}
 */
const caseSloppyFunction = ({ sloppy_function_away, sloppy_function_near }) => {
  if (sloppy_function_away === 0) {
    return "nope";
  } else {
    if (sloppy_function_away === sloppy_function_near) {
      return "near";
    } else {
      return "away";
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   binding: import("../../../annotation/hoisting").Binding,
 * ) => import("../../../../util/sequence").Sequence<
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   null | import(".").SloppyFunction,
 * >}
 */
const initSaveSloppyFunction = (hash, meta, binding) => {
  const sloppy_function = caseSloppyFunction(binding);
  switch (sloppy_function) {
    case "nope": {
      return NULL_SEQUENCE;
    }
    case "near": {
      return zeroSequence({ save: null });
    }
    case "away": {
      const save = mangleConstantMetaVariable((meta = nextMeta(meta)));
      return initSequence(
        [
          makeMetaDeclarationPrelude([save, "aran.deadzone"]),
          makePrefixPrelude(
            makeWriteEffect(
              save,
              makeClosureExpression(
                "arrow",
                false,
                makeRoutineBlock(
                  EMPTY,
                  null,
                  [
                    makeEffectStatement(
                      makeWriteEffect(
                        mangleBaseVariable(binding.variable),
                        makeApplyExpression(
                          makeIntrinsicExpression("aran.get", hash),
                          makeIntrinsicExpression("undefined", hash),
                          [
                            makeReadExpression("function.arguments", hash),
                            makePrimitiveExpression(0, hash),
                          ],
                          hash,
                        ),
                        hash,
                      ),
                      hash,
                    ),
                  ],
                  makePrimitiveExpression(true, hash),
                  hash,
                ),
                hash,
              ),
              hash,
            ),
          ),
        ],
        { save },
      );
    }
    default: {
      throw new AranTypeError(sloppy_function);
    }
  }
};

/**
 * @type {{
 *   [key in import("../../../annotation/hoisting").Initial]: null | {
 *     intrinsic: import("../../../../lang/syntax").Intrinsic,
 *     status: "live" | "dead",
 *   }
 * }}
 */
const INITIAL_RECORD = {
  "undefined": {
    intrinsic: "undefined",
    status: "live",
  },
  "deadzone": {
    intrinsic: "aran.deadzone",
    status: "dead",
  },
  "arguments": {
    intrinsic: "undefined",
    status: "live",
  },
  "import": null,
  "self-class": null,
  "self-function": null,
};

/**
 * @type {(
 *   status: "live" | "dead",
 *   schrodinger: boolean,
 * ) => "live" | "dead" | "schrodinger"}
 */
const updateInitialStatus = (status, schrodinger) => {
  switch (status) {
    case "dead": {
      return schrodinger ? "schrodinger" : "dead";
    }
    case "live": {
      return "live";
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   binding: import("../../../annotation/hoisting").Binding,
 *   options: {
 *     schrodinger: boolean,
 *     links: import("../../../query/link").Link[],
 *   },
 * ) => import("../../../../util/sequence").Sequence<
 *   (
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").BaseDeclarationPrelude
 *     | import("../../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").Binding,
 * >}
 */
export const setupBinding = (hash, meta, binding, { schrodinger, links }) => {
  const import_ = findVariableImport(links, binding.variable);
  if (import_ !== null) {
    return zeroSequence({
      variable: binding.variable,
      duplicable: false,
      status: "live",
      write: "report",
      import: import_,
      export: [],
      sloppy_function: null,
    });
  } else {
    const initial = INITIAL_RECORD[binding.initial];
    if (initial === null) {
      throw new AranExecError("unexpected initial value", { hash, binding });
    } else {
      return bindSequence(
        initSaveSloppyFunction(hash, meta, binding),
        (sloppy_function) =>
          initSequence(
            [
              makeBaseDeclarationPrelude([
                mangleBaseVariable(binding.variable),
                initial.intrinsic,
              ]),
            ],
            {
              variable: binding.variable,
              status: updateInitialStatus(initial.status, schrodinger),
              duplicable: binding.duplicable,
              write: binding.write,
              export: listVariableExport(links, binding.variable),
              import: null,
              sloppy_function,
            },
          ),
      );
    }
  }
};

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").Binding,
 *   import("..").LateDeclareVariableOperation,
 *   import("../../../prelude").SyntaxErrorPrelude,
 * >}
 */
export const listBindingLateDeclareEffect = (
  hash,
  _meta,
  binding,
  operation,
) => {
  if (binding.duplicable) {
    return NULL_SEQUENCE;
  } else {
    switch (operation.conflict) {
      case "report": {
        return liftSequenceX_(
          makeExpressionEffect,
          initSyntaxErrorExpression(
            `Duplicate variable '${operation.variable}'`,
            hash,
          ),
          hash,
        );
      }
      case "ignore": {
        return NULL_SEQUENCE;
      }
      default: {
        throw new AranTypeError(operation.conflict);
      }
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   binding: {
 *     write: import("../../../annotation/hoisting").Write,
 *     export: (
 *       | import("estree-sentry").SpecifierName
 *       | import("estree-sentry").SpecifierValue
 *     )[],
 *   },
 *   operation: {
 *     variable: import("estree-sentry").VariableName,
 *     right: import("../../../atom").Expression,
 *   },
 * ) => import("../../../../util/tree").Tree<import("../../../atom").Effect>}
 */
const listLiveWriteEffect = (hash, binding, operation) => {
  switch (binding.write) {
    case "perform": {
      return [
        makeWriteEffect(
          mangleBaseVariable(operation.variable),
          operation.right,
          hash,
        ),
        map(binding.export, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadExpression(mangleBaseVariable(operation.variable), hash),
            hash,
          ),
        ),
      ];
    }
    case "ignore": {
      return listExpressionEffect(operation.right, hash);
    }
    case "report": {
      return [
        listExpressionEffect(operation.right, hash),
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, hash),
          hash,
        ),
      ];
    }
    default: {
      throw new AranTypeError(binding.write);
    }
  }
};

/**
 * @type {import("../../api").PerformEffect<
 *   import(".").Binding,
 *   import("..").WriteVariableOperation,
 *   import("../../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listBindingWriteEffect = (hash, meta, binding, operation) => {
  const status = updateStatus(binding.status, operation.closure);
  switch (status) {
    case "schrodinger": {
      return incorporateEffect(
        mapSequence(cacheConstant(meta, operation.right, hash), (right) => [
          makeConditionalEffect(
            makeBinaryExpression(
              "===",
              makeReadExpression(mangleBaseVariable(operation.variable), hash),
              makeIntrinsicExpression("aran.deadzone", hash),
              hash,
            ),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(operation.variable, hash),
                hash,
              ),
            ],
            flatenTree(
              listLiveWriteEffect(hash, binding, {
                variable: operation.variable,
                right: makeReadCacheExpression(right, hash),
              }),
            ),
            hash,
          ),
        ]),
        hash,
      );
    }
    case "live": {
      return zeroSequence(listLiveWriteEffect(hash, binding, operation));
    }
    case "dead": {
      return zeroSequence([
        listExpressionEffect(operation.right, hash),
        makeExpressionEffect(
          makeThrowDeadzoneExpression(operation.variable, hash),
          hash,
        ),
      ]);
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};

/**
 * @type {(
 *   binding: import(".").Binding,
 * ) => import(".").Binding}
 */
const initializeBinding = (binding) => {
  switch (binding.status) {
    case "schrodinger": {
      return binding;
    }
    case "live": {
      throw new AranExecError("duplicate initialization", { binding });
    }
    case "dead": {
      return { ...binding, status: "live" };
    }
    default: {
      throw new AranTypeError(binding);
    }
  }
};

/**
 * @type {import("../../api").Perform<
 *   import(".").Binding,
 *   import("..").InitializeVariableOperation,
 *   never,
 *   [
 *     import("../../../../util/tree").Tree<import("../../../atom").Effect>,
 *     import(".").Binding,
 *   ],
 * >}
 */
export const listBindingInitializeEffect = (hash, _meta, binding, operation) =>
  zeroSequence([
    [
      makeWriteEffect(
        mangleBaseVariable(operation.variable),
        operation.right,
        hash,
      ),
      map(binding.export, (specifier) =>
        makeExportEffect(
          specifier,
          makeReadExpression(mangleBaseVariable(operation.variable), hash),
          hash,
        ),
      ),
    ],
    initializeBinding(binding),
  ]);

/**
 * @type {import("../../api").PerformMaybeEffect<
 *   import(".").Binding,
 *   import("..").WriteSloppyFunctionVariableOperation,
 *   never,
 * >}
 */
export const listBindingWriteSloppyFunctionEffect = (
  hash,
  _meta,
  binding,
  operation,
) => {
  if (binding.sloppy_function === null) {
    if (binding.duplicable) {
      return null;
    } else {
      return zeroSequence(listExpressionEffect(operation.right, hash));
    }
  } else {
    if (binding.sloppy_function.save === null) {
      return zeroSequence(listExpressionEffect(operation.right, hash));
    } else {
      return zeroSequence(
        makeExpressionEffect(
          makeApplyExpression(
            makeReadExpression(binding.sloppy_function.save, hash),
            makeIntrinsicExpression("undefined", hash),
            [operation.right],
            hash,
          ),
          hash,
        ),
      );
    }
  }
};

/**
 * @type {import("../../api").PerformExpression<
 *   import(".").Binding,
 *   import("..").VariableOperation,
 *   never,
 * >}
 */
export const makeBindingDiscardExpression = (hash, _meta, _binding) =>
  zeroSequence(makePrimitiveExpression(false, hash));

/**
 * @type {import("../../api").PerformExpression<
 *   import(".").Binding,
 *   import("..").VariableOperation,
 *   never,
 * >}
 */
export const makeBindingReadAmbientThisExpression = (hash, _meta, _binding) =>
  zeroSequence(makeIntrinsicExpression("undefined", hash));

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   variable: import("estree-sentry").VariableName,
 *   import_: null | import(".").Import,
 * ) => import("../../../atom").Expression}
 */
export const makeLoadExpression = (hash, variable, import_) =>
  import_ === null
    ? makeReadExpression(mangleBaseVariable(variable), hash)
    : makeImportExpression(import_.source, import_.specifier, hash);

/**
 * @type {(
 *   wrap: (
 *     node: import("../../../atom").Expression,
 *     hash: import("../../../../hash").Hash,
 *   ) => import("../../../atom").Expression,
 * ) => import("../../api").PerformExpression<
 *   import(".").Binding,
 *   import("..").VariableOperation,
 *   never,
 * >}
 */
export const compile = (wrap) => (hash, _meta, binding, operation) => {
  const status = updateStatus(binding.status, operation.closure);
  switch (status) {
    case "schrodinger": {
      return zeroSequence(
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeLoadExpression(hash, operation.variable, binding.import),
            makeIntrinsicExpression("aran.deadzone", hash),
            hash,
          ),
          makeThrowDeadzoneExpression(operation.variable, hash),
          wrap(
            makeLoadExpression(hash, operation.variable, binding.import),
            hash,
          ),
          hash,
        ),
      );
    }
    case "live": {
      return zeroSequence(
        wrap(
          makeLoadExpression(hash, operation.variable, binding.import),
          hash,
        ),
      );
    }
    case "dead": {
      return zeroSequence(
        makeThrowDeadzoneExpression(operation.variable, hash),
      );
    }
    default: {
      throw new AranTypeError(status);
    }
  }
};

export const makeBindingReadExpression = compile((node, _hash) => node);

export const makeBindingTypeofExpression = compile((node, hash) =>
  makeUnaryExpression("typeof", node, hash),
);

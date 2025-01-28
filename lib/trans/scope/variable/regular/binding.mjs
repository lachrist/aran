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
  some,
  includes,
  count,
  isRepeat,
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
 *   kind: import("../../../annotation/hoisting").Kind[],
 * ) => "nope" | "away" | "near"}
 */
const caseSloppyFunction = (kinds) => {
  if (includes(kinds, "function-sloppy-away")) {
    if (
      count(kinds, "function-sloppy-away") ===
      count(kinds, "function-sloppy-near")
    ) {
      return "near";
    } else {
      return "away";
    }
  } else {
    return "nope";
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   variable: import("estree-sentry").VariableName,
 *   kinds: import("../../../annotation/hoisting").Kind[],
 * ) => import("../../../../util/sequence").Sequence<
 *   (
 *     | import("../../../prelude").MetaDeclarationPrelude
 *     | import("../../../prelude").PrefixPrelude
 *   ),
 *   null | import(".").SloppyFunction,
 * >}
 */
const initSaveSloppyFunction = (hash, meta, variable, kinds) => {
  const sloppy_function = caseSloppyFunction(kinds);
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
          makeMetaDeclarationPrelude([save, "aran.deadzone_symbol"]),
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
                        mangleBaseVariable(variable),
                        makeApplyExpression(
                          makeIntrinsicExpression(
                            "aran.getValueProperty",
                            hash,
                          ),
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
 * @type {(
 *   kind: import("../../../annotation/hoisting").Kind,
 * ) => boolean}
 */
const isDeadzoneKind = (kind) =>
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "error-complex" ||
  kind === "param-complex" ||
  // error-simple does not need deadzone
  // But it will be optimized away and it avoid scope caller
  // to test for simple parametrization to avoid duplicate
  // initialization.
  kind === "error-simple";

/**
 * @type {(
 *   kind: import("../../../annotation/hoisting").Kind[],
 * ) => import(".").Write}
 */
const getWrite = (kinds) => {
  if (
    includes(kinds, "const") ||
    includes(kinds, "class-self") ||
    includes(kinds, "import")
  ) {
    return "report";
  } else if (includes(kinds, "function-self-strict")) {
    return "ignore";
  } else {
    return "perform";
  }
};

/**
 * @type {(
 *   kind: import("../../../annotation/hoisting").Kind,
 * ) => boolean}
 */
const isNotDuplicable = (kind) =>
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "import" ||
  kind === "error-complex" ||
  kind === "param-complex" ||
  kind === "class-self" ||
  kind === "function-self-strict";

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   binding: [
 *     import("estree-sentry").VariableName,
 *     import("../../../annotation/hoisting").Kind[],
 *   ],
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
export const setupBinding = (
  hash,
  meta,
  { 0: variable, 1: kinds },
  { schrodinger, links },
) => {
  const import_ = findVariableImport(links, variable);
  if (import_ !== null) {
    return zeroSequence({
      variable,
      duplicable: false,
      status: "live",
      write: "report",
      import: import_,
      export: [],
      sloppy_function: null,
    });
  } else {
    return bindSequence(
      initSaveSloppyFunction(hash, meta, variable, kinds),
      (sloppy_function) => {
        const deadzone = some(kinds, isDeadzoneKind);
        return initSequence(
          [
            makeBaseDeclarationPrelude([
              mangleBaseVariable(variable),
              deadzone ? "aran.deadzone_symbol" : "undefined",
            ]),
          ],
          {
            variable,
            status: deadzone ? (schrodinger ? "schrodinger" : "dead") : "live",
            duplicable: !some(kinds, isNotDuplicable),
            write: getWrite(kinds),
            export: listVariableExport(links, variable),
            import: null,
            sloppy_function,
          },
        );
      },
    );
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
  { duplicable },
  { variable, kinds },
) => {
  if (duplicable || isRepeat(kinds, "function-sloppy-away")) {
    return NULL_SEQUENCE;
  } else {
    return liftSequenceX_(
      makeExpressionEffect,
      initSyntaxErrorExpression(`Duplicate variable '${variable}'`, hash),
      hash,
    );
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: {
 *     write: import(".").Write,
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
              makeIntrinsicExpression("aran.deadzone_symbol", hash),
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
 *   hash: import("../../../hash").Hash,
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
 *     hash: import("../../../hash").Hash,
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
            makeIntrinsicExpression("aran.deadzone_symbol", hash),
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

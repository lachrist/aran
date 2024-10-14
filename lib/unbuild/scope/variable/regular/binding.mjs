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
 *   binding: import(".").Binding,
 * ) => boolean}
 */
const getDuplicable = (binding) => {
  switch (binding.type) {
    case "import": {
      return false;
    }
    case "regular": {
      return binding.duplicable;
    }
    default: {
      throw new AranTypeError(binding);
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
 *   null | import("../../../variable").ConstantMetaVariable,
 * >}
 */
const initSaveSloppyFunction = (hash, meta, binding) => {
  if (binding.sloppy_function_away > binding.sloppy_function_near) {
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
      save,
    );
  } else {
    return NULL_SEQUENCE;
  }
};

/**
 * @type {(
 *   hash: import("../../../../hash").Hash,
 *   meta: import("../../../meta").Meta,
 *   binding: import("../../../annotation/hoisting").Binding,
 *   links: import("../../../query/link").Link[],
 * ) => import("../../../../util/sequence").Sequence<
 *   (
 *     | import("../../../prelude").PrefixPrelude
 *     | import("../../../prelude").BaseDeclarationPrelude
 *     | import("../../../prelude").MetaDeclarationPrelude
 *   ),
 *   import(".").Binding,
 * >}
 */
export const setupBinding = (hash, meta, binding, links) => {
  const import_ = findVariableImport(links, binding.variable);
  if (import_ !== null) {
    return zeroSequence({
      type: "import",
      variable: binding.variable,
      source: import_.source,
      specifier: import_.specifier,
    });
  } else {
    return bindSequence(
      initSaveSloppyFunction(hash, meta, binding),
      (save_sloppy_function) =>
        initSequence(
          [
            makeBaseDeclarationPrelude([
              mangleBaseVariable(binding.variable),
              binding.initial === "undefined" ? "undefined" : "aran.deadzone",
            ]),
          ],
          {
            type: "regular",
            variable: binding.variable,
            status: binding.initial === "undefined" ? "live" : "dead",
            duplicable: binding.duplicable,
            write: binding.write,
            export: listVariableExport(links, binding.variable),
            save_sloppy_function,
          },
        ),
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
  binding,
  operation,
) => {
  if (getDuplicable(binding)) {
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
  switch (binding.type) {
    case "import": {
      return zeroSequence([
        listExpressionEffect(operation.right, hash),
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, hash),
          hash,
        ),
      ]);
    }
    case "regular": {
      const status = updateStatus(binding.status, operation.closure);
      switch (status) {
        case "schrodinger": {
          return incorporateEffect(
            mapSequence(cacheConstant(meta, operation.right, hash), (right) => [
              makeConditionalEffect(
                makeBinaryExpression(
                  "===",
                  makeReadExpression(
                    mangleBaseVariable(operation.variable),
                    hash,
                  ),
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
export const listBindingInitializeEffect = (hash, meta, binding, operation) => {
  switch (binding.type) {
    case "import": {
      throw new AranExecError("initialize clash with import binding", {
        hash,
        meta,
        binding,
        operation,
      });
    }
    case "regular": {
      if (binding.status !== "dead") {
        throw new AranExecError("duplicate initialization", {
          hash,
          binding,
          operation,
        });
      }
      return zeroSequence([
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
        {
          ...binding,
          status: "live",
        },
      ]);
    }
    default: {
      throw new AranTypeError(binding);
    }
  }
};

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
  switch (binding.type) {
    case "import": {
      return null;
    }
    case "regular": {
      if (binding.save_sloppy_function === null) {
        return null;
      } else {
        return zeroSequence(
          makeExpressionEffect(
            makeApplyExpression(
              makeReadExpression(binding.save_sloppy_function, hash),
              makeIntrinsicExpression("undefined", hash),
              [operation.right],
              hash,
            ),
            hash,
          ),
        );
      }
    }
    default: {
      throw new AranTypeError(binding);
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
  switch (binding.type) {
    case "import": {
      return zeroSequence(
        wrap(
          makeImportExpression(binding.source, binding.specifier, hash),
          hash,
        ),
      );
    }
    case "regular": {
      const status = updateStatus(binding.status, operation.closure);
      switch (status) {
        case "schrodinger": {
          return zeroSequence(
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadExpression(
                  mangleBaseVariable(operation.variable),
                  hash,
                ),
                makeIntrinsicExpression("aran.deadzone", hash),
                hash,
              ),
              makeThrowDeadzoneExpression(operation.variable, hash),
              wrap(
                makeReadExpression(
                  mangleBaseVariable(operation.variable),
                  hash,
                ),
                hash,
              ),
              hash,
            ),
          );
        }
        case "live": {
          return zeroSequence(
            wrap(
              makeReadExpression(mangleBaseVariable(operation.variable), hash),
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
    }
    default: {
      throw new AranTypeError(binding);
    }
  }
};

export const makeBindingReadExpression = compile((node, _hash) => node);

export const makeBindingTypeofExpression = compile((node, hash) =>
  makeUnaryExpression("typeof", node, hash),
);

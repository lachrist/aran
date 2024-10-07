import {
  EMPTY,
  concatXX,
  concat_,
  concat_X,
  concat_XX,
  map,
} from "../../../util/index.mjs";
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
} from "../../node.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../error.mjs";
import {
  mangleBaseVariable,
  mangleConstantMetaVariable,
} from "../../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { AranExecError, AranTypeError } from "../../../report.mjs";
import {
  bindSequence,
  EMPTY_SEQUENCE,
  initSequence,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  makeBaseDeclarationPrelude,
  makeMetaDeclarationPrelude,
  makePrefixPrelude,
  incorporateEffect,
  initSyntaxErrorExpression,
} from "../../prelude/index.mjs";
import { findVariableImport, listVariableExport } from "../../query/index.mjs";
import { nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   baseline: "live" | "dead",
 * ) => import("../../../lang").Intrinsic}
 */
const getInitialIntrinsic = (baseline) => {
  switch (baseline) {
    case "live": {
      return "undefined";
    }
    case "dead": {
      return "aran.deadzone";
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: import("../../annotation/hoisting").Binding,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").SloppyFunction,
 * >}
 */
const initSloppyFunction = (hash, meta, binding) => {
  if (binding.sloppy_function === "nope") {
    return zeroSequence(null);
  } else {
    const self =
      binding.sloppy_function === "near" || binding.sloppy_function === "both"
        ? mangleConstantMetaVariable((meta = nextMeta(meta)))
        : null;
    const save =
      binding.sloppy_function === "away" || binding.sloppy_function === "both"
        ? mangleConstantMetaVariable((meta = nextMeta(meta)))
        : null;
    return initSequence(
      concatXX(
        self === null
          ? EMPTY
          : [makeMetaDeclarationPrelude([self, "aran.deadzone"])],
        save === null
          ? EMPTY
          : [
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
      ),
      { self, save },
    );
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: import("../../annotation/hoisting").Binding,
 *   links: import("../../query/link").Link[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   [
 *     import("estree-sentry").VariableName,
 *     import(".").Binding,
 *   ],
 * >}
 */
export const setupBinding = (hash, meta, binding, links) => {
  const import_ = findVariableImport(links, binding.variable);
  if (import_ !== null) {
    return zeroSequence([
      binding.variable,
      {
        type: "import",
        source: import_.source,
        specifier: import_.specifier,
      },
    ]);
  } else {
    return bindSequence(
      initSloppyFunction(hash, meta, binding),
      (sloppy_function) =>
        initSequence(
          [
            makeBaseDeclarationPrelude([
              mangleBaseVariable(binding.variable),
              getInitialIntrinsic(binding.baseline),
            ]),
          ],
          [
            binding.variable,
            {
              type: "regular",
              baseline: binding.baseline,
              write: binding.write,
              export: listVariableExport(links, binding.variable),
              sloppy_function,
            },
          ],
        ),
    );
  }
};

/**
 * @type {(
 *   mode: "sloppy" | "strict",
 *   write: "report" | "ignore",
 * ) => "report" | "ignore"}
 */
const getSkip = (mode, write) => {
  switch (mode) {
    case "sloppy": {
      return write;
    }
    case "strict": {
      return "report";
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {(
 *   skip: "report" | "ignore",
 *   variable: import("estree-sentry").VariableName,
 *   hash: import("../../../hash").Hash,
 * ) => import("../../atom").Effect[]}
 */
const listSkipEffect = (skip, variable, hash) => {
  switch (skip) {
    case "report": {
      return [
        makeExpressionEffect(makeThrowConstantExpression(variable, hash), hash),
      ];
    }
    case "ignore": {
      return EMPTY;
    }
    default: {
      throw new AranTypeError(skip);
    }
  }
};

/**
 * @type {<C>(
 *   hash: import("../../../hash").Hash,
 *   meta: import("../../meta").Meta,
 *   binding: import(".").Binding,
 *   operation: import("../operation").VariableSaveOperation,
 *   listAlternateEffect: import("../operation").ListScopeEffect<C>,
 *   context: C,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const listBindingSaveEffect = (
  hash,
  meta,
  binding,
  operation,
  listAlternateEffect,
  context,
) => {
  switch (operation.type) {
    case "late-declare": {
      switch (binding.type) {
        case "import": {
          throw new AranExecError("late-declare clash with import binding", {
            hash,
            meta,
            binding,
            operation,
          });
        }
        case "regular": {
          switch (binding.baseline) {
            case "dead": {
              switch (operation.conflict) {
                case "report": {
                  return liftSequenceX(
                    concat_,
                    liftSequenceX_(
                      makeExpressionEffect,
                      initSyntaxErrorExpression(
                        `Duplicate variable '${operation.variable}'`,
                        hash,
                      ),
                      hash,
                    ),
                  );
                }
                case "ignore": {
                  return EMPTY_SEQUENCE;
                }
                default: {
                  throw new AranTypeError(operation.conflict);
                }
              }
            }
            case "live": {
              return EMPTY_SEQUENCE;
            }
            default: {
              throw new AranTypeError(binding.baseline);
            }
          }
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "initialize": {
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
          if (operation.right === null) {
            switch (binding.baseline) {
              case "dead": {
                return zeroSequence([
                  makeWriteEffect(
                    mangleBaseVariable(operation.variable),
                    makeIntrinsicExpression("undefined", hash),
                    hash,
                  ),
                ]);
              }
              case "live": {
                return EMPTY_SEQUENCE;
              }
              default: {
                throw new AranTypeError(binding.baseline);
              }
            }
          } else {
            return zeroSequence(
              concat_XX(
                makeWriteEffect(
                  mangleBaseVariable(operation.variable),
                  operation.right,
                  hash,
                ),
                map(binding.export, (specifier) =>
                  makeExportEffect(
                    specifier,
                    makeReadExpression(
                      mangleBaseVariable(operation.variable),
                      hash,
                    ),
                    hash,
                  ),
                ),
                binding.sloppy_function !== null &&
                  binding.sloppy_function.self !== null
                  ? [
                      makeWriteEffect(
                        binding.sloppy_function.self,
                        makeReadExpression(
                          mangleBaseVariable(operation.variable),
                          hash,
                        ),
                        hash,
                      ),
                    ]
                  : EMPTY,
              ),
            );
          }
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "write": {
      switch (binding.type) {
        case "import": {
          return zeroSequence([
            makeExpressionEffect(operation.right, hash),
            makeExpressionEffect(
              makeThrowConstantExpression(operation.variable, hash),
              hash,
            ),
          ]);
        }
        case "regular": {
          switch (binding.baseline) {
            case "dead": {
              if (binding.write === "perform") {
                return incorporateEffect(
                  mapSequence(
                    cacheConstant(meta, operation.right, hash),
                    (right) => [
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
                            makeThrowDeadzoneExpression(
                              operation.variable,
                              hash,
                            ),
                            hash,
                          ),
                        ],
                        [
                          makeWriteEffect(
                            mangleBaseVariable(operation.variable),
                            makeReadCacheExpression(right, hash),
                            hash,
                          ),
                          ...map(binding.export, (specifier) =>
                            makeExportEffect(
                              specifier,
                              makeReadExpression(
                                mangleBaseVariable(operation.variable),
                                hash,
                              ),
                              hash,
                            ),
                          ),
                        ],
                        hash,
                      ),
                    ],
                  ),
                  hash,
                );
              } else if (
                binding.write === "report" ||
                binding.write === "ignore"
              ) {
                return zeroSequence([
                  makeExpressionEffect(operation.right, hash),
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
                    listSkipEffect(
                      getSkip(operation.mode, binding.write),
                      operation.variable,
                      hash,
                    ),
                    hash,
                  ),
                ]);
              } else {
                throw new AranTypeError(binding.write);
              }
            }
            case "live": {
              if (binding.write === "perform") {
                return zeroSequence([
                  makeWriteEffect(
                    mangleBaseVariable(operation.variable),
                    operation.right,
                    hash,
                  ),
                  ...map(binding.export, (specifier) =>
                    makeExportEffect(
                      specifier,
                      makeReadExpression(
                        mangleBaseVariable(operation.variable),
                        hash,
                      ),
                      hash,
                    ),
                  ),
                ]);
              } else if (
                binding.write === "report" ||
                binding.write === "ignore"
              ) {
                return zeroSequence(
                  concat_X(
                    makeExpressionEffect(operation.right, hash),
                    listSkipEffect(
                      getSkip(operation.mode, binding.write),
                      operation.variable,
                      hash,
                    ),
                  ),
                );
              } else {
                throw new AranTypeError(binding.write);
              }
            }
            default: {
              throw new AranTypeError(binding.baseline);
            }
          }
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "write-sloppy-function": {
      switch (binding.type) {
        case "import": {
          return listAlternateEffect(hash, meta, context, operation);
        }
        case "regular": {
          if (binding.sloppy_function === null) {
            if (operation.right === null) {
              return EMPTY_SEQUENCE;
            } else {
              return listAlternateEffect(hash, meta, context, operation);
            }
          } else {
            const self = operation.right ?? binding.sloppy_function.self;
            if (binding.sloppy_function.save === null) {
              return listAlternateEffect(
                hash,
                meta,
                context,
                self === operation.right
                  ? operation
                  : { ...operation, right: self },
              );
            } else {
              if (self === null) {
                return EMPTY_SEQUENCE;
              } else {
                return zeroSequence([
                  makeExpressionEffect(
                    makeApplyExpression(
                      makeReadExpression(binding.sloppy_function.save, hash),
                      makeIntrinsicExpression("undefined", hash),
                      [makeReadExpression(self, hash)],
                      hash,
                    ),
                    hash,
                  ),
                ]);
              }
            }
          }
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import(".").Binding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Expression,
 * >}
 */
export const makeBindingLoadExpression = (hash, binding, operation) => {
  switch (operation.type) {
    case "read": {
      switch (binding.type) {
        case "import": {
          return zeroSequence(
            makeImportExpression(binding.source, binding.specifier, hash),
          );
        }
        case "regular": {
          switch (binding.baseline) {
            case "dead": {
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
                  makeReadExpression(
                    mangleBaseVariable(operation.variable),
                    hash,
                  ),
                  hash,
                ),
              );
            }
            case "live": {
              return zeroSequence(
                makeReadExpression(
                  mangleBaseVariable(operation.variable),
                  hash,
                ),
              );
            }
            default: {
              throw new AranTypeError(binding.baseline);
            }
          }
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "typeof": {
      switch (binding.type) {
        case "import": {
          return zeroSequence(
            makeUnaryExpression(
              "typeof",
              makeImportExpression(binding.source, binding.specifier, hash),
              hash,
            ),
          );
        }
        case "regular": {
          switch (binding.baseline) {
            case "dead": {
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
                  makeUnaryExpression(
                    "typeof",
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
                makeUnaryExpression(
                  "typeof",
                  makeReadExpression(
                    mangleBaseVariable(operation.variable),
                    hash,
                  ),
                  hash,
                ),
              );
            }
            default: {
              throw new AranTypeError(binding.baseline);
            }
          }
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "discard": {
      return zeroSequence(makePrimitiveExpression(false, hash));
    }
    case "read-ambient-this": {
      return zeroSequence(makeIntrinsicExpression("undefined", hash));
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

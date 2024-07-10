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
import { AranError, AranTypeError } from "../../../error.mjs";
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
} from "../../prelude.mjs";
import {
  makeStaticDuplicateEarlyError,
  makeEarlyErrorExpression,
} from "../../early-error.mjs";
import { incorporateEffect } from "../../incorporate.mjs";
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
 *   site: import("../../site").LeafSite,
 *   binding: import("../../query/hoist-public").Binding,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").SloppyFunction,
 * >}
 */
const initSloppyFunction = ({ path, meta }, binding) => {
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
                              makeIntrinsicExpression("aran.get", path),
                              makeIntrinsicExpression("undefined", path),
                              [
                                makeReadExpression("function.arguments", path),
                                makePrimitiveExpression(0, path),
                              ],
                              path,
                            ),
                            path,
                          ),
                          path,
                        ),
                      ],
                      makePrimitiveExpression(true, path),
                      path,
                    ),
                    path,
                  ),
                  path,
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
 *   site: import("../../site").LeafSite,
 *   binding: import("../../query/hoist-public").Binding,
 *   links: import("../../query/link").Link[],
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").PrefixPrelude
 *     | import("../../prelude").BaseDeclarationPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   [
 *     import("../../../estree").Variable,
 *     import(".").Binding,
 *   ],
 * >}
 */
export const setupBinding = (site, binding, links) => {
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
    return bindSequence(initSloppyFunction(site, binding), (sloppy_function) =>
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
 *   variable: import("../../../estree").Variable,
 *   path: import("../../../path").Path,
 * ) => import("../../atom").Effect[]}
 */
const listSkipEffect = (skip, variable, path) => {
  switch (skip) {
    case "report": {
      return [
        makeExpressionEffect(makeThrowConstantExpression(variable, path), path),
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
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: import(".").Binding,
 *   operation: Exclude<
 *     import("../operation").VariableSaveOperation,
 *     import("../operation").WriteSloppyFunctionOperation
 *   >,
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   import("../../atom").Effect[],
 * >}
 */
export const listBindingSaveEffect = ({ path, meta }, binding, operation) => {
  switch (operation.type) {
    case "late-declare": {
      switch (binding.type) {
        case "import": {
          throw new AranError("late-declare clash with import binding", {
            path,
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
                      makeEarlyErrorExpression(
                        makeStaticDuplicateEarlyError(operation.variable, path),
                      ),
                      path,
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
          throw new AranError("initialize clash with import binding", {
            path,
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
                    makeIntrinsicExpression("undefined", path),
                    path,
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
                  path,
                ),
                map(binding.export, (specifier) =>
                  makeExportEffect(
                    specifier,
                    makeReadExpression(
                      mangleBaseVariable(operation.variable),
                      path,
                    ),
                    path,
                  ),
                ),
                binding.sloppy_function !== null &&
                  binding.sloppy_function.self !== null
                  ? [
                      makeWriteEffect(
                        binding.sloppy_function.self,
                        makeReadExpression(
                          mangleBaseVariable(operation.variable),
                          path,
                        ),
                        path,
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
            makeExpressionEffect(operation.right, path),
            makeExpressionEffect(
              makeThrowConstantExpression(operation.variable, path),
              path,
            ),
          ]);
        }
        case "regular": {
          switch (binding.baseline) {
            case "dead": {
              if (binding.write === "perform") {
                return incorporateEffect(
                  mapSequence(
                    cacheConstant(meta, operation.right, path),
                    (right) => [
                      makeConditionalEffect(
                        makeBinaryExpression(
                          "===",
                          makeReadExpression(
                            mangleBaseVariable(operation.variable),
                            path,
                          ),
                          makeIntrinsicExpression("aran.deadzone", path),
                          path,
                        ),
                        [
                          makeExpressionEffect(
                            makeThrowDeadzoneExpression(
                              operation.variable,
                              path,
                            ),
                            path,
                          ),
                        ],
                        [
                          makeWriteEffect(
                            mangleBaseVariable(operation.variable),
                            makeReadCacheExpression(right, path),
                            path,
                          ),
                          ...map(binding.export, (specifier) =>
                            makeExportEffect(
                              specifier,
                              makeReadExpression(
                                mangleBaseVariable(operation.variable),
                                path,
                              ),
                              path,
                            ),
                          ),
                        ],
                        path,
                      ),
                    ],
                  ),
                  path,
                );
              } else if (
                binding.write === "report" ||
                binding.write === "ignore"
              ) {
                return zeroSequence([
                  makeExpressionEffect(operation.right, path),
                  makeConditionalEffect(
                    makeBinaryExpression(
                      "===",
                      makeReadExpression(
                        mangleBaseVariable(operation.variable),
                        path,
                      ),
                      makeIntrinsicExpression("aran.deadzone", path),
                      path,
                    ),
                    [
                      makeExpressionEffect(
                        makeThrowDeadzoneExpression(operation.variable, path),
                        path,
                      ),
                    ],
                    listSkipEffect(
                      getSkip(operation.mode, binding.write),
                      operation.variable,
                      path,
                    ),
                    path,
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
                    path,
                  ),
                  ...map(binding.export, (specifier) =>
                    makeExportEffect(
                      specifier,
                      makeReadExpression(
                        mangleBaseVariable(operation.variable),
                        path,
                      ),
                      path,
                    ),
                  ),
                ]);
              } else if (
                binding.write === "report" ||
                binding.write === "ignore"
              ) {
                return zeroSequence(
                  concat_X(
                    makeExpressionEffect(operation.right, path),
                    listSkipEffect(
                      getSkip(operation.mode, binding.write),
                      operation.variable,
                      path,
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
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").Binding,
 *   operation: import("../operation").VariableLoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   never,
 *   import("../../atom").Expression,
 * >}
 */
export const makeBindingLoadExpression = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "read": {
      switch (binding.type) {
        case "import": {
          return zeroSequence(
            makeImportExpression(binding.source, binding.specifier, path),
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
                      path,
                    ),
                    makeIntrinsicExpression("aran.deadzone", path),
                    path,
                  ),
                  makeThrowDeadzoneExpression(operation.variable, path),
                  makeReadExpression(
                    mangleBaseVariable(operation.variable),
                    path,
                  ),
                  path,
                ),
              );
            }
            case "live": {
              return zeroSequence(
                makeReadExpression(
                  mangleBaseVariable(operation.variable),
                  path,
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
              makeImportExpression(binding.source, binding.specifier, path),
              path,
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
                      path,
                    ),
                    makeIntrinsicExpression("aran.deadzone", path),
                    path,
                  ),
                  makeThrowDeadzoneExpression(operation.variable, path),
                  makeUnaryExpression(
                    "typeof",
                    makeReadExpression(
                      mangleBaseVariable(operation.variable),
                      path,
                    ),
                    path,
                  ),
                  path,
                ),
              );
            }
            case "live": {
              return zeroSequence(
                makeUnaryExpression(
                  "typeof",
                  makeReadExpression(
                    mangleBaseVariable(operation.variable),
                    path,
                  ),
                  path,
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
      return zeroSequence(makePrimitiveExpression(false, path));
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").Binding,
 *   operation: import("../operation").WriteSloppyFunctionOperation,
 *   makeAlternate: (
 *     operation: import("../operation").WriteSloppyFunctionOperation,
 *   ) => import("../../../sequence").Sequence<
 *     import("../../prelude").BodyPrelude,
 *     import("../../atom").Effect[],
 *   >,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").BodyPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const listBindingWriteFunctionEffect = (
  { path },
  binding,
  operation,
  makeAlternate,
) => {
  switch (binding.type) {
    case "import": {
      return makeAlternate(operation);
    }
    case "regular": {
      if (binding.sloppy_function === null) {
        if (operation.right === null) {
          return EMPTY_SEQUENCE;
        } else {
          return makeAlternate(operation);
        }
      } else {
        const self = operation.right ?? binding.sloppy_function.self;
        if (binding.sloppy_function.save === null) {
          return makeAlternate(
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
                  makeReadExpression(binding.sloppy_function.save, path),
                  makeIntrinsicExpression("undefined", path),
                  [makeReadExpression(self, path)],
                  path,
                ),
                path,
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
};

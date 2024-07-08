import {
  EMPTY,
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
import { incorporatePrefixEffect } from "../../prefix.mjs";
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
export const setupBinding = ({ path, meta }, binding, links) => {
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
    const base = mangleBaseVariable(binding.variable);
    const sloppy_function_self =
      binding.sloppy_function === "nearby" || binding.sloppy_function === "both"
        ? mangleConstantMetaVariable((meta = nextMeta(meta)))
        : null;
    const sloppy_function_write =
      binding.sloppy_function === "distant" ||
      binding.sloppy_function === "both"
        ? mangleConstantMetaVariable((meta = nextMeta(meta)))
        : null;
    return initSequence(
      concat_XX(
        makeBaseDeclarationPrelude([
          base,
          getInitialIntrinsic(binding.baseline),
        ]),
        sloppy_function_self === null
          ? EMPTY
          : [
              makeMetaDeclarationPrelude([
                sloppy_function_self,
                "aran.deadzone",
              ]),
            ],
        sloppy_function_write === null
          ? EMPTY
          : [
              makeMetaDeclarationPrelude([
                sloppy_function_write,
                "aran.deadzone",
              ]),
              makePrefixPrelude(
                makeWriteEffect(
                  sloppy_function_write,
                  makeClosureExpression(
                    "arrow",
                    false,
                    makeRoutineBlock(
                      EMPTY,
                      EMPTY,
                      [
                        makeEffectStatement(
                          makeWriteEffect(
                            base,
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
      [
        binding.variable,
        {
          type: "regular",
          baseline: binding.baseline,
          write: binding.write,
          export: listVariableExport(links, binding.variable),
          sloppy_function_self: null,
          sloppy_function_write: null,
        },
      ],
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
                binding.sloppy_function_self === null
                  ? EMPTY
                  : [
                      makeWriteEffect(
                        binding.sloppy_function_self,
                        makeReadExpression(
                          mangleBaseVariable(operation.variable),
                          path,
                        ),
                        path,
                      ),
                    ],
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
                return incorporatePrefixEffect(
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
      const right = operation.right ?? binding.sloppy_function_write;
      if (binding.sloppy_function_write === null) {
        return makeAlternate(
          right === operation.right ? operation : { ...operation, right },
        );
      } else {
        if (right === null) {
          throw new AranError(
            "missing value when writing to sloppy function at closure location",
            {
              path,
              binding,
              operation,
            },
          );
        } else {
          return zeroSequence([
            makeExpressionEffect(
              makeApplyExpression(
                makeReadExpression(binding.sloppy_function_write, path),
                makeIntrinsicExpression("undefined", path),
                [makeReadExpression(right, path)],
                path,
              ),
              path,
            ),
          ]);
        }
      }
    }
    default: {
      throw new AranTypeError(binding);
    }
  }
};

import { EMPTY, concat_, concat_X, map } from "../../../util/index.mjs";
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
} from "../../node.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  reportDuplicate,
} from "../error.mjs";
import { mangleBaseVariable } from "../../mangle.mjs";
import { cacheConstant, makeReadCacheExpression } from "../../cache.mjs";
import { AranError, AranTypeError } from "../../../error.mjs";
import {
  EMPTY_SEQUENCE,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import { makeBaseDeclarationPrelude } from "../../prelude.mjs";
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../../early-error.mjs";
import { incorporatePrefixEffect } from "../../prefix.mjs";

/**
 * @type {(
 *   baseline: import("./index").Baseline,
 * ) => import("../../../lang").Intrinsic}
 */
const getBaselineIntrinsic = (baseline) => {
  switch (baseline) {
    case "undefined": {
      return "undefined";
    }
    case "deadzone": {
      return "aran.deadzone";
    }
    default: {
      throw new AranTypeError(baseline);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     variable: import("../../../estree").Variable,
 *     kind: import(".").RegularBinding,
 *   ],
 * ) => import("../../prelude").BaseDeclarationPrelude[]}
 */
export const setupBinding = (_site, [variable, binding]) => {
  switch (binding.type) {
    case "external": {
      return [];
    }
    case "internal": {
      return [
        makeBaseDeclarationPrelude([
          mangleBaseVariable(variable),
          getBaselineIntrinsic(binding.baseline),
        ]),
      ];
    }
    default: {
      throw new AranTypeError(binding);
    }
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
 *   binding: import(".").RegularBinding,
 *   operation: import("../operation").VariableSaveOperation,
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
    case "declare": {
      switch (binding.type) {
        case "internal": {
          switch (binding.baseline) {
            case "deadzone": {
              return liftSequenceX(
                concat_,
                liftSequenceX_(
                  makeExpressionEffect,
                  makeEarlyErrorExpression(
                    makeRegularEarlyError(
                      reportDuplicate(operation.variable),
                      path,
                    ),
                  ),
                  path,
                ),
              );
            }
            case "undefined": {
              return EMPTY_SEQUENCE;
            }
            default: {
              throw new AranTypeError(binding.baseline);
            }
          }
        }
        case "external": {
          throw new AranError(
            "late declaration should never occur on external binding",
            {
              binding,
              operation,
            },
          );
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "initialize": {
      switch (binding.type) {
        case "internal": {
          if (operation.right === null) {
            switch (binding.baseline) {
              case "deadzone": {
                return zeroSequence([
                  makeWriteEffect(
                    mangleBaseVariable(operation.variable),
                    makeIntrinsicExpression("undefined", path),
                    path,
                  ),
                ]);
              }
              case "undefined": {
                return EMPTY_SEQUENCE;
              }
              default: {
                throw new AranTypeError(binding.baseline);
              }
            }
          } else {
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
          }
        }
        case "external": {
          throw new AranError("external binding should not be initialized", {
            binding,
            operation,
          });
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "write": {
      switch (binding.type) {
        case "internal": {
          switch (binding.baseline) {
            case "deadzone": {
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
            case "undefined": {
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
        case "external": {
          return zeroSequence([
            makeExpressionEffect(operation.right, path),
            makeExpressionEffect(
              makeThrowConstantExpression(operation.variable, path),
              path,
            ),
          ]);
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
 *   binding: import(".").RegularBinding,
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
        case "external": {
          return zeroSequence(
            makeImportExpression(binding.source, binding.specifier, path),
          );
        }
        case "internal": {
          const perform = makeReadExpression(
            mangleBaseVariable(operation.variable),
            path,
          );
          switch (binding.baseline) {
            case "deadzone": {
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
                  perform,
                  path,
                ),
              );
            }
            case "undefined": {
              return zeroSequence(perform);
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
        case "external": {
          return zeroSequence(
            makeUnaryExpression(
              "typeof",
              makeImportExpression(binding.source, binding.specifier, path),
              path,
            ),
          );
        }
        case "internal": {
          const perform = makeUnaryExpression(
            "typeof",
            makeReadExpression(mangleBaseVariable(operation.variable), path),
            path,
          );
          switch (binding.baseline) {
            case "deadzone": {
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
                  perform,
                  path,
                ),
              );
            }
            case "undefined": {
              return zeroSequence(perform);
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

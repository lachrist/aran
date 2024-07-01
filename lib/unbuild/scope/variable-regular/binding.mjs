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
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     variable: import("../../../estree").Variable,
 *     binding: import(".").Binding,
 *   ],
 * ) => import("../../prelude").BaseDeclarationPrelude[]}
 */
export const setupBinding = (_site, [variable, binding]) => {
  switch (binding.baseline) {
    case "import": {
      return [];
    }
    case "undefined": {
      return [
        makeBaseDeclarationPrelude([mangleBaseVariable(variable), "undefined"]),
      ];
    }
    case "deadzone": {
      return [
        makeBaseDeclarationPrelude([
          mangleBaseVariable(variable),
          "aran.deadzone",
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
 *   binding: import(".").Binding,
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
    case "late-declare": {
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
        case "import": {
          throw new AranError(
            "import binding should never clash with late declaration",
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
      if (operation.right === null) {
        switch (binding.baseline) {
          case "import": {
            throw new AranError("import binding should not be initialized", {
              binding,
              operation,
            });
          }
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
            throw new AranTypeError(binding);
          }
        }
      } else {
        if (binding.baseline === "import") {
          throw new AranError("import binding should not be initialized", {
            binding,
            operation,
          });
        } else if (
          binding.baseline === "deadzone" ||
          binding.baseline === "undefined"
        ) {
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
        } else {
          throw new AranTypeError(binding.baseline);
        }
      }
    }
    case "write": {
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
                        makeThrowDeadzoneExpression(operation.variable, path),
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
          } else if (binding.write === "report" || binding.write === "ignore") {
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
          } else if (binding.write === "report" || binding.write === "ignore") {
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
        case "import": {
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
      switch (binding.baseline) {
        case "import": {
          return zeroSequence(
            makeImportExpression(
              binding.import.source,
              binding.import.specifier,
              path,
            ),
          );
        }
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
              makeReadExpression(mangleBaseVariable(operation.variable), path),
              path,
            ),
          );
        }
        case "undefined": {
          return zeroSequence(
            makeReadExpression(mangleBaseVariable(operation.variable), path),
          );
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "typeof": {
      switch (binding.baseline) {
        case "import": {
          return zeroSequence(
            makeUnaryExpression(
              "typeof",
              makeImportExpression(
                binding.import.source,
                binding.import.specifier,
                path,
              ),
              path,
            ),
          );
        }
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
        case "undefined": {
          return zeroSequence(
            makeUnaryExpression(
              "typeof",
              makeReadExpression(mangleBaseVariable(operation.variable), path),
              path,
            ),
          );
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

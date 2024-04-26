import { concat_, map } from "../../../util/index.mjs";
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
} from "../../sequence.mjs";
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
 *     variable: estree.Variable,
 *     kind: import(".").RegularBinding,
 *   ],
 * ) => import("../../prelude").BaseDeclarationPrelude[]}
 */
export const setupBinding = (_site, [variable, binding]) => {
  switch (binding.kind) {
    case "external": {
      return [];
    }
    case "internal": {
      return [
        makeBaseDeclarationPrelude([
          mangleBaseVariable(variable),
          binding.deadzone
            ? {
                type: "intrinsic",
                intrinsic: "aran.deadzone",
              }
            : {
                type: "primitive",
                primitive: { undefined: null },
              },
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
 *   site: import("../../site").LeafSite,
 *   binding: import(".").RegularBinding,
 *   operation: import("../operation").VariableSaveOperation,
 * ) => import("../../sequence").Sequence<
 *   (
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").MetaDeclarationPrelude
 *   ),
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listBindingSaveEffect = ({ path, meta }, binding, operation) => {
  switch (operation.type) {
    case "declare": {
      switch (binding.kind) {
        case "internal": {
          if (binding.deadzone) {
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
          } else {
            return EMPTY_SEQUENCE;
          }
        }
        case "external": {
          throw new AranError("invalid declare operation on external binding", {
            binding,
            operation,
          });
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "initialize": {
      switch (binding.kind) {
        case "internal": {
          if (binding.deadzone) {
            if (operation.kind === "let" || operation.kind === "const") {
              if (operation.right === null) {
                return zeroSequence([
                  makeWriteEffect(
                    mangleBaseVariable(operation.variable),
                    makePrimitiveExpression({ undefined: null }, path),
                    path,
                  ),
                ]);
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
            } else if (operation.kind === "val" || operation.kind === "var") {
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
            } else {
              throw new AranTypeError(operation.kind);
            }
          } else {
            if (operation.kind === "var" || operation.kind === "val") {
              if (operation.right === null) {
                return EMPTY_SEQUENCE;
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
            } else if (operation.kind === "let" || operation.kind === "const") {
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
            } else {
              throw new AranTypeError(operation.kind);
            }
          }
        }
        case "external": {
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
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "write": {
      if (binding.deadzone) {
        if (binding.writable) {
          return incorporatePrefixEffect(
            mapSequence(cacheConstant(meta, operation.right, path), (right) => [
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
            ]),
            path,
          );
        } else {
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
              [
                makeExpressionEffect(
                  makeThrowConstantExpression(operation.variable, path),
                  path,
                ),
              ],
              path,
            ),
          ]);
        }
      } else {
        if (binding.writable) {
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
          if (operation.mode === "sloppy") {
            return EMPTY_SEQUENCE;
          } else if (operation.mode === "strict") {
            return zeroSequence([
              makeExpressionEffect(
                makeThrowConstantExpression(operation.variable, path),
                path,
              ),
            ]);
          } else {
            throw new AranTypeError(operation.mode);
          }
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
 * ) => import("../../sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeBindingLoadExpression = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "read": {
      switch (binding.kind) {
        case "external": {
          return zeroSequence(
            makeImportExpression(
              binding.import.source,
              binding.import.specifier,
              path,
            ),
          );
        }
        case "internal": {
          const perform = makeReadExpression(
            mangleBaseVariable(operation.variable),
            path,
          );
          if (binding.deadzone) {
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
          } else {
            return zeroSequence(perform);
          }
        }
        default: {
          throw new AranTypeError(binding);
        }
      }
    }
    case "typeof": {
      switch (binding.kind) {
        case "external": {
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
        case "internal": {
          const perform = makeUnaryExpression(
            "typeof",
            makeReadExpression(mangleBaseVariable(operation.variable), path),
            path,
          );
          if (binding.deadzone) {
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
          } else {
            return zeroSequence(perform);
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

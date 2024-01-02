import { hasOwn, map, pairup } from "../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeReadBaseExpression,
  makeWriteBaseEffect,
  makeIntrinsicExpression,
} from "../../node.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
  reportDuplicate,
} from "../error.mjs";
import { mangleBaseVariable } from "../../mangle.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import { AranTypeError } from "../../../error.mjs";
import { initSequence } from "../../sequence.mjs";
import { makeEffectPrelude, makeDeclarationPrelude } from "../../prelude.mjs";
import { makeEarlyErrorExpression } from "../../early-error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entry: [
 *     variable: estree.Variable,
 *     kind: import(".").DeadzoneKind,
 *   ],
 *   link: null | {
 *      export: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../sequence.js").PreludeSequence<[
 *   estree.Variable,
 *   import(".").BlockBinding,
 * ]>}
 */
export const setupDeadzoneBinding = ({ path }, [variable, kind], link) =>
  initSequence(
    [
      makeDeclarationPrelude(mangleBaseVariable(variable)),
      makeEffectPrelude(
        makeWriteBaseEffect(
          mangleBaseVariable(variable),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
      ),
    ],
    pairup(variable, {
      kind,
      export:
        link !== null && hasOwn(link.export, variable)
          ? link.export[variable]
          : [],
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeadzoneSaveEffect = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "initialize": {
      if (binding.kind === operation.kind) {
        if (operation.right === null) {
          return [
            makeWriteBaseEffect(
              mangleBaseVariable(operation.variable),
              makePrimitiveExpression({ undefined: null }, path),
              path,
            ),
          ];
        } else {
          return [
            makeWriteBaseEffect(
              mangleBaseVariable(operation.variable),
              makeReadCacheExpression(operation.right, path),
              path,
            ),
            ...map(binding.export, (specifier) =>
              makeExportEffect(
                specifier,
                makeReadBaseExpression(
                  mangleBaseVariable(operation.variable),
                  path,
                ),
                path,
              ),
            ),
          ];
        }
      } else {
        return [
          makeExpressionEffect(
            makeEarlyErrorExpression(reportDuplicate(operation.variable), path),
            path,
          ),
        ];
      }
    }
    case "write": {
      if (binding.kind === "const") {
        return [
          makeConditionalEffect(
            makeBinaryExpression(
              "===",
              makeReadBaseExpression(
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
        ];
      } else if (binding.kind === "let" || binding.kind === "class") {
        return [
          makeConditionalEffect(
            makeBinaryExpression(
              "===",
              makeReadBaseExpression(
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
              makeWriteBaseEffect(
                mangleBaseVariable(operation.variable),
                makeReadCacheExpression(operation.right, path),
                path,
              ),
              ...map(binding.export, (specifier) =>
                makeExportEffect(
                  specifier,
                  makeReadBaseExpression(
                    mangleBaseVariable(operation.variable),
                    path,
                  ),
                  path,
                ),
              ),
            ],
            path,
          ),
        ];
      } else {
        throw new AranTypeError(binding.kind);
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").DeadzoneBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeadzoneLoadExpression = ({ path }, _binding, operation) => {
  switch (operation.type) {
    case "read": {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadBaseExpression(mangleBaseVariable(operation.variable), path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(operation.variable, path),
        makeReadBaseExpression(mangleBaseVariable(operation.variable), path),
        path,
      );
    }
    case "typeof": {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadBaseExpression(mangleBaseVariable(operation.variable), path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(operation.variable, path),
        makeUnaryExpression(
          "typeof",
          makeReadBaseExpression(mangleBaseVariable(operation.variable), path),
          path,
        ),
        path,
      );
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

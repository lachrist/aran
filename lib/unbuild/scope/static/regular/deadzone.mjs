import { hasOwn, map } from "../../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeReadBaseExpression,
  makeWriteBaseEffect,
  makeIntrinsicExpression,
  makeEffectStatement,
} from "../../../node.mjs";
import {
  makeBinaryExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../../error.mjs";
import { mangleBaseVariable } from "../../../mangle.mjs";
import { makeReadCacheExpression } from "../../../cache.mjs";
import { AranTypeError } from "../../../../error.mjs";
import { initSequence } from "../../../sequence.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *      kind: import(".").DeadzoneRegularKind,
 *      variable: estree.Variable,
 *      exports: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").DeadzoneRegularBinding
 * >}
 */
export const bindDeadzoneRegular = (
  { path },
  _context,
  { kind, variable, exports },
) =>
  initSequence(
    [
      {
        type: "variable",
        data: mangleBaseVariable(variable),
      },
      {
        type: "body",
        data: makeEffectStatement(
          makeWriteBaseEffect(
            mangleBaseVariable(variable),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          path,
        ),
      },
    ],
    {
      kind,
      export: hasOwn(exports, variable) ? exports[variable] : [],
    },
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import(".").DeadzoneRegularBinding,
 *     variable: estree.Variable,
 *     right: import("../../../cache.js").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeadzoneRegularSaveEffect = (
  { path },
  _context,
  { operation, binding, variable, right },
) => {
  switch (operation) {
    case "initialize": {
      if (right === null) {
        return [
          makeWriteBaseEffect(
            mangleBaseVariable(variable),
            makePrimitiveExpression({ undefined: null }, path),
            path,
          ),
        ];
      } else {
        return [
          makeWriteBaseEffect(
            mangleBaseVariable(variable),
            makeReadCacheExpression(right, path),
            path,
          ),
          ...map(binding.export, (specifier) =>
            makeExportEffect(
              specifier,
              makeReadBaseExpression(mangleBaseVariable(variable), path),
              path,
            ),
          ),
        ];
      }
    }
    case "write": {
      if (right === null) {
        return [];
      } else {
        if (binding.kind === "const") {
          return [
            makeConditionalEffect(
              makeBinaryExpression(
                "===",
                makeReadBaseExpression(mangleBaseVariable(variable), path),
                makeIntrinsicExpression("aran.deadzone", path),
                path,
              ),
              [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(variable, path),
                  path,
                ),
              ],
              [
                makeExpressionEffect(
                  makeThrowConstantExpression(variable, path),
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
                makeReadBaseExpression(mangleBaseVariable(variable), path),
                makeIntrinsicExpression("aran.deadzone", path),
                path,
              ),
              [
                makeExpressionEffect(
                  makeThrowDeadzoneExpression(variable, path),
                  path,
                ),
              ],
              [
                makeWriteBaseEffect(
                  mangleBaseVariable(variable),
                  makeReadCacheExpression(right, path),
                  path,
                ),
                ...map(binding.export, (specifier) =>
                  makeExportEffect(
                    specifier,
                    makeReadBaseExpression(mangleBaseVariable(variable), path),
                    path,
                  ),
                ),
              ],
              path,
            ),
          ];
        } else {
          throw new AranTypeError("invalid binding kind", binding.kind);
        }
      }
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     binding: import(".").DeadzoneRegularBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeadzoneRegularLoadExpression = (
  { path },
  _context,
  { operation, variable },
) => {
  switch (operation) {
    case "read": {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadBaseExpression(mangleBaseVariable(variable), path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(variable, path),
        makeReadBaseExpression(mangleBaseVariable(variable), path),
        path,
      );
    }
    case "typeof": {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadBaseExpression(mangleBaseVariable(variable), path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(variable, path),
        makeUnaryExpression(
          "typeof",
          makeReadBaseExpression(mangleBaseVariable(variable), path),
          path,
        ),
        path,
      );
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError("invalid load operation", operation);
    }
  }
};

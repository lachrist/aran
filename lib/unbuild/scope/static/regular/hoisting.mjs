import { hasOwn, map } from "../../../../util/index.mjs";
import {
  makeExportEffect,
  makePrimitiveExpression,
  makeReadBaseExpression,
  makeWriteBaseEffect,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../../node.mjs";
import { makeUnaryExpression } from "../../../intrinsic.mjs";
import { mangleBaseVariable } from "../../../mangle.mjs";
import { makeReadCacheExpression } from "../../../cache.mjs";
import { AranTypeError } from "../../../../error.mjs";
import { initSequence } from "../../../sequence.mjs";
import { makeThrowConstantExpression } from "../../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *      kind: import(".").HoistingRegularKind,
 *      variable: estree.Variable,
 *      exports: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").HoistingRegularBinding
 * >}
 */
export const bindHoistingRegular = (
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
            makePrimitiveExpression({ undefined: null }, path),
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
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import(".").HoistingRegularBinding,
 *     variable: estree.Variable,
 *     right: import("../../../cache.js").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listHoistingRegularSaveEffect = (
  { path },
  context,
  { operation, binding, variable, right },
) => {
  if (right === null) {
    return [];
  } else {
    if (binding.kind === "callee" && operation === "write") {
      switch (context.mode) {
        case "strict": {
          return [
            makeExpressionEffect(
              makeThrowConstantExpression(variable, path),
              path,
            ),
          ];
        }
        case "sloppy": {
          return [];
        }
        default: {
          throw new AranTypeError("invalid context mode", context.mode);
        }
      }
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
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     binding: import(".").HoistingRegularBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHoistingRegularLoadExpression = (
  { path },
  _context,
  { operation, variable },
) => {
  switch (operation) {
    case "read": {
      return makeReadBaseExpression(mangleBaseVariable(variable), path);
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeReadBaseExpression(mangleBaseVariable(variable), path),
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

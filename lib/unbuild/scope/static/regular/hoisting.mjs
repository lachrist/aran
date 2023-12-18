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
 *   kind: import(".").HoistingRegularKind,
 *   options: {
 *      variable: estree.Variable,
 *      exports: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").HoistingRegularBinding
 * >}
 */
export const bindHoistingRegular = ({ path }, kind, { variable, exports }) =>
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
 *   binding: import(".").HoistingRegularBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listHoistingRegularSaveEffect = ({ path }, binding, operation) => {
  if (operation.right === null) {
    return [];
  } else {
    if (binding.kind === "callee" && operation.type === "write") {
      switch (operation.mode) {
        case "strict": {
          return [
            makeExpressionEffect(
              makeThrowConstantExpression(operation.variable, path),
              path,
            ),
          ];
        }
        case "sloppy": {
          return [];
        }
        default: {
          throw new AranTypeError("invalid context mode", operation.mode);
        }
      }
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
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").HoistingRegularBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeHoistingRegularLoadExpression = (
  { path },
  _binding,
  operation,
) => {
  switch (operation.type) {
    case "read": {
      return makeReadBaseExpression(
        mangleBaseVariable(operation.variable),
        path,
      );
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeReadBaseExpression(mangleBaseVariable(operation.variable), path),
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

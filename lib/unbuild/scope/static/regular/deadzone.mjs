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
import {
  makeEffectPrelude,
  makeDeclarationPrelude,
} from "../../../prelude.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   kind: import(".").DeadzoneRegularKind,
 *   options: {
 *      variable: estree.Variable,
 *      exports: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").DeadzoneRegularBinding
 * >}
 */
export const bindDeadzoneRegular = ({ path }, kind, { variable, exports }) =>
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
 *   binding: import(".").DeadzoneRegularBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeadzoneRegularSaveEffect = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "initialize": {
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
        throw new AranTypeError("invalid binding kind", binding.kind);
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
 *   binding: import(".").DeadzoneRegularBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeadzoneRegularLoadExpression = (
  { path },
  _binding,
  operation,
) => {
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
      throw new AranTypeError("invalid load operation", operation);
    }
  }
};

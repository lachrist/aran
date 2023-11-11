import { map } from "../../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeEffectStatement,
  makeReadBaseExpression,
  makeWriteBaseEffect,
} from "../../../node.mjs";
import { makeUnaryExpression } from "../../../intrinsic.mjs";
import {
  makeThrowDeadzoneExpression,
  makeThrowConstantExpression,
} from "../error.mjs";
import {
  mangleBaseDeadzoneVariable,
  mangleBaseOriginalVariable,
} from "../../../mangle.mjs";
import { listImpureEffect } from "../../../cache.mjs";

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").RegularBinding,
 * ) => unbuild.Variable[]}
 */
export const listRegularBindingVariable = (_context, { kind, variable }) =>
  kind === "var"
    ? [mangleBaseOriginalVariable(variable)]
    : [
        mangleBaseDeadzoneVariable(variable),
        mangleBaseOriginalVariable(variable),
      ];

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").RegularBinding,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingDeclareStatement = (
  _context,
  { kind, variable },
  path,
) =>
  kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteBaseEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(true, path),
            path,
          ),
          path,
        ),
      ];

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").RegularBinding,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingInitializeStatement = (
  _context,
  { kind, exports, variable },
  right,
  path,
) => [
  makeEffectStatement(
    makeWriteBaseEffect(mangleBaseOriginalVariable(variable), right, path),
    path,
  ),
  ...(kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteBaseEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(false, path),
            path,
          ),
          path,
        ),
      ]),
  ...map(exports, (specifier) =>
    makeEffectStatement(
      makeExportEffect(
        specifier,
        makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
        path,
      ),
      path,
    ),
  ),
];

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").RegularBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingReadExpression = (
  _context,
  { kind, variable },
  path,
) =>
  kind === "var"
    ? makeReadBaseExpression(mangleBaseOriginalVariable(variable), path)
    : makeConditionalExpression(
        makeReadBaseExpression(mangleBaseDeadzoneVariable(variable), path),
        makeThrowDeadzoneExpression(variable, path),
        makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
        path,
      );

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").RegularBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingTypeofExpression = (
  _context,
  { kind, variable },
  path,
) =>
  kind === "var"
    ? makeUnaryExpression(
        "typeof",
        makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
        path,
      )
    : makeConditionalExpression(
        makeReadBaseExpression(mangleBaseDeadzoneVariable(variable), path),
        makeThrowDeadzoneExpression(variable, path),
        makeUnaryExpression(
          "typeof",
          makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
          path,
        ),
        path,
      );

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").RegularBinding,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingDiscardExpression = (_context, _binding, path) =>
  makePrimitiveExpression(false, path);

/**
 * @type {(
 *   context: {},
 *   binding: import("./binding.d.ts").RegularBinding,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularBindingWriteEffect = (
  _context,
  { kind, exports, variable },
  right,
  path,
) =>
  kind === "const"
    ? [
        ...listImpureEffect(right, path),
        makeExpressionEffect(makeThrowConstantExpression(variable, path), path),
      ]
    : [
        makeWriteBaseEffect(mangleBaseOriginalVariable(variable), right, path),
        ...(kind === "var"
          ? []
          : [
              makeConditionalEffect(
                makeReadBaseExpression(
                  mangleBaseDeadzoneVariable(variable),
                  path,
                ),
                [
                  makeExpressionEffect(
                    makeThrowDeadzoneExpression(variable, path),
                    path,
                  ),
                ],
                [],
                path,
              ),
            ]),
        ...map(exports, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadBaseExpression(mangleBaseOriginalVariable(variable), path),
            path,
          ),
        ),
      ];

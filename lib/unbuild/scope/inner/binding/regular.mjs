import { guard, map } from "../../../../util/index.mjs";
import {
  makeExportEffect,
  makeExpressionEffect,
  makeConditionalExpression,
  makeConditionalEffect,
  makePrimitiveExpression,
  makeEffectStatement,
  makeReadExpression,
  makeWriteEffect,
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
import { logEnclaveLimitation } from "../../../report.mjs";
import { listImpureEffect } from "../../../cache.mjs";

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").RegularBinding,
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listRegularBindingVariable = (_strict, { kind }, variable) =>
  kind === "var"
    ? [mangleBaseOriginalVariable(variable)]
    : [
        mangleBaseDeadzoneVariable(variable),
        mangleBaseOriginalVariable(variable),
      ];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").RegularBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingDeclareStatement = (
  _strict,
  { kind },
  variable,
  path,
) =>
  kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(true, path),
            false,
            path,
          ),
          path,
        ),
      ];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").RegularBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingInitializeStatement = (
  _strict,
  { kind, exports, internalized },
  variable,
  right,
  path,
) => [
  makeEffectStatement(
    guard(
      internalized,
      (effect) =>
        logEnclaveLimitation(
          effect,
          `internalizing external variable ${variable}`,
        ),
      makeWriteEffect(mangleBaseOriginalVariable(variable), right, false, path),
    ),
    path,
  ),
  ...(kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(false, path),
            false,
            path,
          ),
          path,
        ),
      ]),
  ...map(exports, (specifier) =>
    makeEffectStatement(
      makeExportEffect(
        specifier,
        makeReadExpression(mangleBaseOriginalVariable(variable), path),
        path,
      ),
      path,
    ),
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").RegularBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingReadExpression = (
  _strict,
  { kind },
  variable,
  path,
) =>
  kind === "var"
    ? makeReadExpression(mangleBaseOriginalVariable(variable), path)
    : makeConditionalExpression(
        makeReadExpression(mangleBaseDeadzoneVariable(variable), path),
        makeThrowDeadzoneExpression(variable, path),
        makeReadExpression(mangleBaseOriginalVariable(variable), path),
        path,
      );

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").RegularBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingTypeofExpression = (
  _strict,
  { kind },
  variable,
  path,
) =>
  kind === "var"
    ? makeUnaryExpression(
        "typeof",
        makeReadExpression(mangleBaseOriginalVariable(variable), path),
        path,
      )
    : makeConditionalExpression(
        makeReadExpression(mangleBaseDeadzoneVariable(variable), path),
        makeThrowDeadzoneExpression(variable, path),
        makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseOriginalVariable(variable), path),
          path,
        ),
        path,
      );

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").RegularBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingDiscardExpression = (
  _strict,
  _binding,
  _variable,
  path,
) => makePrimitiveExpression(false, path);

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").RegularBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularBindingWriteEffect = (
  _strict,
  { kind, exports },
  variable,
  right,
  path,
) =>
  kind === "const"
    ? [
        ...listImpureEffect(right, path),
        makeExpressionEffect(makeThrowConstantExpression(variable, path), path),
      ]
    : [
        makeWriteEffect(
          mangleBaseOriginalVariable(variable),
          right,
          false,
          path,
        ),
        ...(kind === "var"
          ? []
          : [
              makeConditionalEffect(
                makeReadExpression(mangleBaseDeadzoneVariable(variable), path),
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
            makeReadExpression(mangleBaseOriginalVariable(variable), path),
            path,
          ),
        ),
      ];

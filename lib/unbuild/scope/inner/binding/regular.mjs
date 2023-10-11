import { map } from "../../../../util/index.mjs";

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

/**
 * @typedef {{
 *   kind: "let" | "const" | "var";
 *   exports: estree.Specifier[];
 * }} Binding
 */

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listLiveWriteEffect = (
  _strict,
  { kind, exports },
  variable,
  right,
  path,
) =>
  kind === "const"
    ? [makeExpressionEffect(makeThrowConstantExpression(variable, path), path)]
    : [
        makeWriteEffect(
          mangleBaseOriginalVariable(variable),
          makeReadExpression(right, path),
          false,
          path,
        ),
        ...map(exports, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadExpression(mangleBaseDeadzoneVariable(variable), path),
            path,
          ),
        ),
      ];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
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
 *   binding: Binding,
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
 *   binding: Binding & { kind: "let" | "var" | "const" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingInitializeStatement = (
  strict,
  { kind, exports },
  variable,
  right,
  path,
) => [
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
  ...map(
    listLiveWriteEffect(
      strict,
      { kind: "let", exports },
      variable,
      right,
      path,
    ),
    (effect) => makeEffectStatement(effect, path),
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
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
 *   binding: Binding,
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
 *   binding: Binding,
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
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularBindingWriteEffect = (
  strict,
  { kind, exports },
  variable,
  right,
  path,
) =>
  kind === "var"
    ? listLiveWriteEffect(strict, { kind, exports }, variable, right, path)
    : [
        makeConditionalEffect(
          makeReadExpression(mangleBaseDeadzoneVariable(variable), path),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(variable, path),
              path,
            ),
          ],
          listLiveWriteEffect(strict, { kind, exports }, variable, right, path),
          path,
        ),
      ];

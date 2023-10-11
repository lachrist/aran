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
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listLiveWriteEffect = (
  _strict,
  { kind, exports },
  variable,
  right,
  origin,
) =>
  kind === "const"
    ? [
        makeExpressionEffect(
          makeThrowConstantExpression(variable, origin),
          origin,
        ),
      ]
    : [
        makeWriteEffect(
          mangleBaseOriginalVariable(variable),
          makeReadExpression(right, origin),
          false,
          origin,
        ),
        ...map(exports, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadExpression(mangleBaseDeadzoneVariable(variable), origin),
            origin,
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
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingDeclareStatement = (
  _strict,
  { kind },
  variable,
  origin,
) =>
  kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(true, origin),
            false,
            origin,
          ),
          origin,
        ),
      ];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "var" | "const" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingInitializeStatement = (
  strict,
  { kind, exports },
  variable,
  right,
  origin,
) => [
  ...(kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(false, origin),
            false,
            origin,
          ),
          origin,
        ),
      ]),
  ...map(
    listLiveWriteEffect(
      strict,
      { kind: "let", exports },
      variable,
      right,
      origin,
    ),
    (effect) => makeEffectStatement(effect, origin),
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingReadExpression = (
  _strict,
  { kind },
  variable,
  origin,
) =>
  kind === "var"
    ? makeReadExpression(mangleBaseOriginalVariable(variable), origin)
    : makeConditionalExpression(
        makeReadExpression(mangleBaseDeadzoneVariable(variable), origin),
        makeThrowDeadzoneExpression(variable, origin),
        makeReadExpression(mangleBaseOriginalVariable(variable), origin),
        origin,
      );

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingTypeofExpression = (
  _strict,
  { kind },
  variable,
  origin,
) =>
  kind === "var"
    ? makeUnaryExpression(
        "typeof",
        makeReadExpression(mangleBaseOriginalVariable(variable), origin),
        origin,
      )
    : makeConditionalExpression(
        makeReadExpression(mangleBaseDeadzoneVariable(variable), origin),
        makeThrowDeadzoneExpression(variable, origin),
        makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseOriginalVariable(variable), origin),
          origin,
        ),
        origin,
      );

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingDiscardExpression = (
  _strict,
  _binding,
  _variable,
  origin,
) => makePrimitiveExpression(false, origin);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularBindingWriteEffect = (
  strict,
  { kind, exports },
  variable,
  right,
  origin,
) =>
  kind === "var"
    ? listLiveWriteEffect(strict, { kind, exports }, variable, right, origin)
    : [
        makeConditionalEffect(
          makeReadExpression(mangleBaseDeadzoneVariable(variable), origin),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(variable, origin),
              origin,
            ),
          ],
          listLiveWriteEffect(
            strict,
            { kind, exports },
            variable,
            right,
            origin,
          ),
          origin,
        ),
      ];

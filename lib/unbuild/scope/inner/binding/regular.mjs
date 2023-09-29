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
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
const listLiveWriteEffect = (
  _strict,
  { kind, exports },
  variable,
  right,
  serial,
) =>
  kind === "const"
    ? [
        makeExpressionEffect(
          makeThrowConstantExpression(variable, serial),
          serial,
        ),
      ]
    : [
        makeWriteEffect(
          mangleBaseOriginalVariable(variable),
          makeReadExpression(right, serial),
          serial,
          false,
        ),
        ...map(exports, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadExpression(mangleBaseDeadzoneVariable(variable), serial),
            serial,
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
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listRegularBindingDeclareStatement = (
  _strict,
  { kind },
  variable,
  serial,
) =>
  kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(true, serial),
            serial,
            false,
          ),
          serial,
        ),
      ];

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "var" | "const" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listRegularBindingInitializeStatement = (
  strict,
  { kind, exports },
  variable,
  right,
  serial,
) => [
  ...(kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(false, serial),
            serial,
            false,
          ),
          serial,
        ),
      ]),
  ...map(
    listLiveWriteEffect(
      strict,
      { kind: "let", exports },
      variable,
      right,
      serial,
    ),
    (effect) => makeEffectStatement(effect, serial),
  ),
];

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeRegularBindingReadExpression = (
  _strict,
  { kind },
  variable,
  serial,
) =>
  kind === "var"
    ? makeReadExpression(mangleBaseOriginalVariable(variable), serial)
    : makeConditionalExpression(
        makeReadExpression(mangleBaseDeadzoneVariable(variable), serial),
        makeThrowDeadzoneExpression(variable, serial),
        makeReadExpression(mangleBaseOriginalVariable(variable), serial),
        serial,
      );

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeRegularBindingTypeofExpression = (
  _strict,
  { kind },
  variable,
  serial,
) =>
  kind === "var"
    ? makeUnaryExpression(
        "typeof",
        makeReadExpression(mangleBaseOriginalVariable(variable), serial),
        serial,
      )
    : makeConditionalExpression(
        makeReadExpression(mangleBaseDeadzoneVariable(variable), serial),
        makeThrowDeadzoneExpression(variable, serial),
        makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseOriginalVariable(variable), serial),
          serial,
        ),
        serial,
      );

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeRegularBindingDiscardExpression = (
  _strict,
  _binding,
  _variable,
  serial,
) => makePrimitiveExpression(false, serial);

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listRegularBindingWriteEffect = (
  strict,
  { kind, exports },
  variable,
  right,
  serial,
) =>
  kind === "var"
    ? listLiveWriteEffect(strict, { kind, exports }, variable, right, serial)
    : [
        makeConditionalEffect(
          makeReadExpression(mangleBaseDeadzoneVariable(variable), serial),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(variable, serial),
              serial,
            ),
          ],
          listLiveWriteEffect(
            strict,
            { kind, exports },
            variable,
            right,
            serial,
          ),
          serial,
        ),
      ];

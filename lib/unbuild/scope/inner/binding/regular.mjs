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
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listLiveWriteEffect = (_strict, { kind, exports }, variable, right) =>
  kind === "const"
    ? [makeExpressionEffect(makeThrowConstantExpression(variable))]
    : [
        makeWriteEffect(
          mangleBaseOriginalVariable(variable),
          makeReadExpression(right),
          false,
        ),
        ...map(exports, (specifier) =>
          makeExportEffect(
            specifier,
            makeReadExpression(mangleBaseDeadzoneVariable(variable)),
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
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingDeclareStatement = (
  _strict,
  { kind },
  variable,
) =>
  kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(true),
            false,
          ),
        ),
      ];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "var" | "const" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listRegularBindingInitializeStatement = (
  strict,
  { kind, exports },
  variable,
  right,
) => [
  ...(kind === "var"
    ? []
    : [
        makeEffectStatement(
          makeWriteEffect(
            mangleBaseDeadzoneVariable(variable),
            makePrimitiveExpression(false),
            false,
          ),
        ),
      ]),
  ...map(
    listLiveWriteEffect(strict, { kind: "let", exports }, variable, right),
    (effect) => makeEffectStatement(effect),
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingReadExpression = (
  _strict,
  { kind },
  variable,
) =>
  kind === "var"
    ? makeReadExpression(mangleBaseOriginalVariable(variable))
    : makeConditionalExpression(
        makeReadExpression(mangleBaseDeadzoneVariable(variable)),
        makeThrowDeadzoneExpression(variable),
        makeReadExpression(mangleBaseOriginalVariable(variable)),
      );

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingTypeofExpression = (
  _strict,
  { kind },
  variable,
) =>
  kind === "var"
    ? makeUnaryExpression(
        "typeof",
        makeReadExpression(mangleBaseOriginalVariable(variable)),
      )
    : makeConditionalExpression(
        makeReadExpression(mangleBaseDeadzoneVariable(variable)),
        makeThrowDeadzoneExpression(variable),
        makeUnaryExpression(
          "typeof",
          makeReadExpression(mangleBaseOriginalVariable(variable)),
        ),
      );

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularBindingDiscardExpression = (
  _strict,
  _binding,
  _variable,
) => makePrimitiveExpression(false);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularBindingWriteEffect = (
  strict,
  { kind, exports },
  variable,
  right,
) =>
  kind === "var"
    ? listLiveWriteEffect(strict, { kind, exports }, variable, right)
    : [
        makeConditionalEffect(
          makeReadExpression(mangleBaseDeadzoneVariable(variable)),
          [makeExpressionEffect(makeThrowDeadzoneExpression(variable))],
          listLiveWriteEffect(strict, { kind, exports }, variable, right),
        ),
      ];

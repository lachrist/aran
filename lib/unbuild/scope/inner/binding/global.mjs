import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeApplyExpression,
  makeReadExpression,
} from "../../../node.mjs";
import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDataDescriptorExpression,
  makeDeleteExpression,
} from "../../../intrinsic.mjs";
import {
  makeThrowDuplicateExpression,
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowMissingExpression,
} from "../error.mjs";

/** @typedef {{ kind: "let" | "const" | "var" | "missing" }} Binding */

/**
 * @type {<S>(
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeHiddenReadExpression = (variable, serial) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, serial),
      makeIntrinsicExpression("aran.record.values", serial),
      serial,
    ),
    makeGetExpression(
      makeIntrinsicExpression("aran.record.values", serial),
      makePrimitiveExpression(variable, serial),
      serial,
    ),
    makeThrowDeadzoneExpression(variable, serial),
    serial,
  );

/**
 * @type {<S>(
 *   writable: true | false | null,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeHiddenWriteExpression = (writable, variable, right, serial) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, serial),
      makeIntrinsicExpression("aran.record.values", serial),
      serial,
    ),
    writable === null
      ? makeConditionalExpression(
          makeGetExpression(
            makeIntrinsicExpression("aran.record.variables", serial),
            makePrimitiveExpression(variable, serial),
            serial,
          ),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values", serial),
            makePrimitiveExpression(variable, serial),
            makeReadExpression(right, serial),
            serial,
          ),
          makeThrowConstantExpression(variable, serial),
          serial,
        )
      : writable
      ? makeSetExpression(
          true,
          makeIntrinsicExpression("aran.record.values", serial),
          makePrimitiveExpression(variable, serial),
          makeReadExpression(right, serial),
          serial,
        )
      : makeThrowConstantExpression(variable, serial),
    makeThrowDeadzoneExpression(variable, serial),
    serial,
  );

/***
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { kind: aran.VariableKind },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listGlobalBindingVariable = (_strict, _binding, _variable) => [];

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listGlobalBindingDeclareStatement = (
  _strict,
  { kind },
  variable,
  serial,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, serial),
          makeIntrinsicExpression("aran.record.variables", serial),
          serial,
        ),
        makeThrowDuplicateExpression(variable, serial),
        kind === "var"
          ? makePrimitiveExpression({ undefined: null }, serial)
          : makeSetExpression(
              true,
              makeIntrinsicExpression("aran.record.variables", serial),
              makePrimitiveExpression(variable, serial),
              makePrimitiveExpression(kind !== "const", serial),
              serial,
            ),
        serial,
      ),
      serial,
    ),
    serial,
  ),
];

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const listGlobalBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
  serial,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      kind === "var"
        ? makeConditionalExpression(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", serial),
              makePrimitiveExpression({ undefined: null }, serial),
              [
                makeIntrinsicExpression("globalThis", serial),
                makePrimitiveExpression(variable, serial),
                makeDataDescriptorExpression(
                  makeReadExpression(right, serial),
                  makePrimitiveExpression(true, serial),
                  makePrimitiveExpression(true, serial),
                  makePrimitiveExpression(false, serial),
                  serial,
                ),
              ],
              serial,
            ),
            makePrimitiveExpression({ undefined: null }, serial),
            makeThrowConstantExpression(variable, serial),
            serial,
          )
        : makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values", serial),
            makePrimitiveExpression(variable, serial),
            makeReadExpression(right, serial),
            serial,
          ),
      serial,
    ),
    serial,
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
export const makeGlobalBindingReadExpression = (
  _strict,
  { kind },
  variable,
  serial,
) =>
  kind === "var" || kind === "missing"
    ? makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, serial),
          makeIntrinsicExpression("aran.record.variables", serial),
          serial,
        ),
        makeHiddenReadExpression(variable, serial),
        kind === "missing"
          ? makeConditionalExpression(
              makeBinaryExpression(
                "in",
                makePrimitiveExpression(variable, serial),
                makeIntrinsicExpression("globalThis", serial),
                serial,
              ),
              makeGetExpression(
                makeIntrinsicExpression("globalThis", serial),
                makePrimitiveExpression(variable, serial),
                serial,
              ),
              makeThrowMissingExpression(variable, serial),
              serial,
            )
          : makeGetExpression(
              makeIntrinsicExpression("globalThis", serial),
              makePrimitiveExpression(variable, serial),
              serial,
            ),
        serial,
      )
    : makeHiddenReadExpression(variable, serial);

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGlobalBindingTypeofExpression = (
  _strict,
  { kind },
  variable,
  serial,
) =>
  makeUnaryExpression(
    "typeof",
    kind === "var" || kind === "missing"
      ? makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, serial),
            makeIntrinsicExpression("aran.record.variables", serial),
            serial,
          ),
          makeHiddenReadExpression(variable, serial),
          makeGetExpression(
            makeIntrinsicExpression("globalThis", serial),
            makePrimitiveExpression(variable, serial),
            serial,
          ),
          serial,
        )
      : makeHiddenReadExpression(variable, serial),
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
export const makeGlobalBindingDiscardExpression = (
  strict,
  { kind },
  variable,
  serial,
) =>
  kind === "missing"
    ? makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, serial),
          makeIntrinsicExpression("aran.record.variables", serial),
          serial,
        ),
        makePrimitiveExpression(false, serial),
        makeDeleteExpression(
          strict,
          makeIntrinsicExpression("globalThis", serial),
          makePrimitiveExpression(variable, serial),
          serial,
        ),
        serial,
      )
    : makePrimitiveExpression(false, serial);

/**
 * @type {<S>(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   serial: S,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const listGlobalBindingWriteEffect = (
  strict,
  { kind },
  variable,
  right,
  serial,
) => [
  makeExpressionEffect(
    kind === "var" || kind === "missing"
      ? makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, serial),
            makeIntrinsicExpression("aran.record.variables", serial),
            serial,
          ),
          makeHiddenWriteExpression(null, variable, right, serial),
          kind === "missing" && strict
            ? makeConditionalExpression(
                makeBinaryExpression(
                  "in",
                  makePrimitiveExpression(variable, serial),
                  makeIntrinsicExpression("globalThis", serial),
                  serial,
                ),
                makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.record.values", serial),
                  makePrimitiveExpression(variable, serial),
                  makeReadExpression(right, serial),
                  serial,
                ),
                makeThrowMissingExpression(variable, serial),
                serial,
              )
            : makeSetExpression(
                true,
                makeIntrinsicExpression("aran.record.values", serial),
                makePrimitiveExpression(variable, serial),
                makeReadExpression(right, serial),
                serial,
              ),
          serial,
        )
      : makeHiddenWriteExpression(kind !== "const", variable, right, serial),
    serial,
  ),
];

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
 * @type {(
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeHiddenReadExpression = (variable, origin) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, origin),
      makeIntrinsicExpression("aran.record.values", origin),
      origin,
    ),
    makeGetExpression(
      makeIntrinsicExpression("aran.record.values", origin),
      makePrimitiveExpression(variable, origin),
      origin,
    ),
    makeThrowDeadzoneExpression(variable, origin),
    origin,
  );

/**
 * @type {(
 *   writable: true | false | null,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeHiddenWriteExpression = (writable, variable, right, origin) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, origin),
      makeIntrinsicExpression("aran.record.values", origin),
      origin,
    ),
    writable === null
      ? makeConditionalExpression(
          makeGetExpression(
            makeIntrinsicExpression("aran.record.variables", origin),
            makePrimitiveExpression(variable, origin),
            origin,
          ),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values", origin),
            makePrimitiveExpression(variable, origin),
            makeReadExpression(right, origin),
            origin,
          ),
          makeThrowConstantExpression(variable, origin),
          origin,
        )
      : writable
      ? makeSetExpression(
          true,
          makeIntrinsicExpression("aran.record.values", origin),
          makePrimitiveExpression(variable, origin),
          makeReadExpression(right, origin),
          origin,
        )
      : makeThrowConstantExpression(variable, origin),
    makeThrowDeadzoneExpression(variable, origin),
    origin,
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
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listGlobalBindingDeclareStatement = (
  _strict,
  { kind },
  variable,
  origin,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, origin),
          makeIntrinsicExpression("aran.record.variables", origin),
          origin,
        ),
        makeThrowDuplicateExpression(variable, origin),
        kind === "var"
          ? makePrimitiveExpression({ undefined: null }, origin)
          : makeSetExpression(
              true,
              makeIntrinsicExpression("aran.record.variables", origin),
              makePrimitiveExpression(variable, origin),
              makePrimitiveExpression(kind !== "const", origin),
              origin,
            ),
        origin,
      ),
      origin,
    ),
    origin,
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listGlobalBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
  origin,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      kind === "var"
        ? makeConditionalExpression(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", origin),
              makePrimitiveExpression({ undefined: null }, origin),
              [
                makeIntrinsicExpression("globalThis", origin),
                makePrimitiveExpression(variable, origin),
                makeDataDescriptorExpression(
                  makeReadExpression(right, origin),
                  makePrimitiveExpression(true, origin),
                  makePrimitiveExpression(true, origin),
                  makePrimitiveExpression(false, origin),
                  origin,
                ),
              ],
              origin,
            ),
            makePrimitiveExpression({ undefined: null }, origin),
            makeThrowConstantExpression(variable, origin),
            origin,
          )
        : makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values", origin),
            makePrimitiveExpression(variable, origin),
            makeReadExpression(right, origin),
            origin,
          ),
      origin,
    ),
    origin,
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
export const makeGlobalBindingReadExpression = (
  _strict,
  { kind },
  variable,
  origin,
) =>
  kind === "var" || kind === "missing"
    ? makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, origin),
          makeIntrinsicExpression("aran.record.variables", origin),
          origin,
        ),
        makeHiddenReadExpression(variable, origin),
        kind === "missing"
          ? makeConditionalExpression(
              makeBinaryExpression(
                "in",
                makePrimitiveExpression(variable, origin),
                makeIntrinsicExpression("globalThis", origin),
                origin,
              ),
              makeGetExpression(
                makeIntrinsicExpression("globalThis", origin),
                makePrimitiveExpression(variable, origin),
                origin,
              ),
              makeThrowMissingExpression(variable, origin),
              origin,
            )
          : makeGetExpression(
              makeIntrinsicExpression("globalThis", origin),
              makePrimitiveExpression(variable, origin),
              origin,
            ),
        origin,
      )
    : makeHiddenReadExpression(variable, origin);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalBindingTypeofExpression = (
  _strict,
  { kind },
  variable,
  origin,
) =>
  makeUnaryExpression(
    "typeof",
    kind === "var" || kind === "missing"
      ? makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, origin),
            makeIntrinsicExpression("aran.record.variables", origin),
            origin,
          ),
          makeHiddenReadExpression(variable, origin),
          makeGetExpression(
            makeIntrinsicExpression("globalThis", origin),
            makePrimitiveExpression(variable, origin),
            origin,
          ),
          origin,
        )
      : makeHiddenReadExpression(variable, origin),
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
export const makeGlobalBindingDiscardExpression = (
  strict,
  { kind },
  variable,
  origin,
) =>
  kind === "missing"
    ? makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, origin),
          makeIntrinsicExpression("aran.record.variables", origin),
          origin,
        ),
        makePrimitiveExpression(false, origin),
        makeDeleteExpression(
          strict,
          makeIntrinsicExpression("globalThis", origin),
          makePrimitiveExpression(variable, origin),
          origin,
        ),
        origin,
      )
    : makePrimitiveExpression(false, origin);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalBindingWriteEffect = (
  strict,
  { kind },
  variable,
  right,
  origin,
) => [
  makeExpressionEffect(
    kind === "var" || kind === "missing"
      ? makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, origin),
            makeIntrinsicExpression("aran.record.variables", origin),
            origin,
          ),
          makeHiddenWriteExpression(null, variable, right, origin),
          kind === "missing" && strict
            ? makeConditionalExpression(
                makeBinaryExpression(
                  "in",
                  makePrimitiveExpression(variable, origin),
                  makeIntrinsicExpression("globalThis", origin),
                  origin,
                ),
                makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.record.values", origin),
                  makePrimitiveExpression(variable, origin),
                  makeReadExpression(right, origin),
                  origin,
                ),
                makeThrowMissingExpression(variable, origin),
                origin,
              )
            : makeSetExpression(
                true,
                makeIntrinsicExpression("aran.record.values", origin),
                makePrimitiveExpression(variable, origin),
                makeReadExpression(right, origin),
                origin,
              ),
          origin,
        )
      : makeHiddenWriteExpression(kind !== "const", variable, right, origin),
    origin,
  ),
];

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
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeHiddenReadExpression = (variable) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable),
      makeIntrinsicExpression("aran.record.values"),
    ),
    makeGetExpression(
      makeIntrinsicExpression("aran.record.values"),
      makePrimitiveExpression(variable),
    ),
    makeThrowDeadzoneExpression(variable),
  );

/**
 * @type {(
 *   writable: true | false | null,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeHiddenWriteExpression = (writable, variable, right) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable),
      makeIntrinsicExpression("aran.record.values"),
    ),
    writable === null
      ? makeConditionalExpression(
          makeGetExpression(
            makeIntrinsicExpression("aran.record.variables"),
            makePrimitiveExpression(variable),
          ),
          makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values"),
            makePrimitiveExpression(variable),
            makeReadExpression(right),
          ),
          makeThrowConstantExpression(variable),
        )
      : writable
      ? makeSetExpression(
          true,
          makeIntrinsicExpression("aran.record.values"),
          makePrimitiveExpression(variable),
          makeReadExpression(right),
        )
      : makeThrowConstantExpression(variable),
    makeThrowDeadzoneExpression(variable),
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
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listGlobalBindingDeclareStatement = (
  _strict,
  { kind },
  variable,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable),
          makeIntrinsicExpression("aran.record.variables"),
        ),
        makeThrowDuplicateExpression(variable),
        kind === "var"
          ? makePrimitiveExpression({ undefined: null })
          : makeSetExpression(
              true,
              makeIntrinsicExpression("aran.record.variables"),
              makePrimitiveExpression(variable),
              makePrimitiveExpression(kind !== "const"),
            ),
      ),
    ),
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listGlobalBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      kind === "var"
        ? makeConditionalExpression(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty"),
              makePrimitiveExpression({ undefined: null }),
              [
                makeIntrinsicExpression("globalThis"),
                makePrimitiveExpression(variable),
                makeDataDescriptorExpression(
                  makeReadExpression(right),
                  makePrimitiveExpression(true),
                  makePrimitiveExpression(true),
                  makePrimitiveExpression(false),
                ),
              ],
            ),
            makePrimitiveExpression({ undefined: null }),
            makeThrowConstantExpression(variable),
          )
        : makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values"),
            makePrimitiveExpression(variable),
            makeReadExpression(right),
          ),
    ),
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalBindingReadExpression = (_strict, { kind }, variable) =>
  kind === "var" || kind === "missing"
    ? makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable),
          makeIntrinsicExpression("aran.record.variables"),
        ),
        makeHiddenReadExpression(variable),
        kind === "missing"
          ? makeConditionalExpression(
              makeBinaryExpression(
                "in",
                makePrimitiveExpression(variable),
                makeIntrinsicExpression("globalThis"),
              ),
              makeGetExpression(
                makeIntrinsicExpression("globalThis"),
                makePrimitiveExpression(variable),
              ),
              makeThrowMissingExpression(variable),
            )
          : makeGetExpression(
              makeIntrinsicExpression("globalThis"),
              makePrimitiveExpression(variable),
            ),
      )
    : makeHiddenReadExpression(variable);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalBindingTypeofExpression = (
  _strict,
  { kind },
  variable,
) =>
  makeUnaryExpression(
    "typeof",
    kind === "var" || kind === "missing"
      ? makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable),
            makeIntrinsicExpression("aran.record.variables"),
          ),
          makeHiddenReadExpression(variable),
          makeGetExpression(
            makeIntrinsicExpression("globalThis"),
            makePrimitiveExpression(variable),
          ),
        )
      : makeHiddenReadExpression(variable),
  );

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalBindingDiscardExpression = (
  strict,
  { kind },
  variable,
) =>
  kind === "missing"
    ? makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable),
          makeIntrinsicExpression("aran.record.variables"),
        ),
        makePrimitiveExpression(false),
        makeDeleteExpression(
          strict,
          makeIntrinsicExpression("globalThis"),
          makePrimitiveExpression(variable),
        ),
      )
    : makePrimitiveExpression(false);

/**
 * @type {(
 *   strict: boolean,
 *   binding: Binding,
 *   variable: estree.Variable,
 *   right: aran.Parameter | unbuild.Variable,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalBindingWriteEffect = (
  strict,
  { kind },
  variable,
  right,
) => [
  makeExpressionEffect(
    kind === "var" || kind === "missing"
      ? makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable),
            makeIntrinsicExpression("aran.record.variables"),
          ),
          makeHiddenWriteExpression(null, variable, right),
          kind === "missing" && strict
            ? makeConditionalExpression(
                makeBinaryExpression(
                  "in",
                  makePrimitiveExpression(variable),
                  makeIntrinsicExpression("globalThis"),
                ),
                makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.record.values"),
                  makePrimitiveExpression(variable),
                  makeReadExpression(right),
                ),
                makeThrowMissingExpression(variable),
              )
            : makeSetExpression(
                true,
                makeIntrinsicExpression("aran.record.values"),
                makePrimitiveExpression(variable),
                makeReadExpression(right),
              ),
        )
      : makeHiddenWriteExpression(kind !== "const", variable, right),
  ),
];

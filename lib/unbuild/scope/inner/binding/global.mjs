import {
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makePrimitiveExpression,
  makeIntrinsicExpression,
  makeApplyExpression,
} from "../../../node.mjs";
import {
  makeUnaryExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeDataDescriptorExpression,
  makeDeleteExpression,
  makeLongSequenceExpression,
} from "../../../intrinsic.mjs";
import {
  makeThrowDuplicateExpression,
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
  makeThrowMissingExpression,
} from "../error.mjs";
import { listImpureEffect, makeCacheExpression } from "../../../cache.mjs";
import { forkMeta, mangleMetaVariable } from "../../../mangle.mjs";

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeHiddenReadExpression = (variable, path) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.values", path),
      path,
    ),
    makeGetExpression(
      makeIntrinsicExpression("aran.record.values", path),
      makePrimitiveExpression(variable, path),
      path,
    ),
    makeThrowDeadzoneExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   writable: true | false | null,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.RootMeta,
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeHiddenWriteExpression = (writable, variable, right, path, meta) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "in",
      makePrimitiveExpression(variable, path),
      makeIntrinsicExpression("aran.record.values", path),
      path,
    ),
    writable === null
      ? makeCacheExpression(right, path, mangleMetaVariable(meta), (right) =>
          makeConditionalExpression(
            makeGetExpression(
              makeIntrinsicExpression("aran.record.variables", path),
              makePrimitiveExpression(variable, path),
              path,
            ),
            makeSetExpression(
              true,
              makeIntrinsicExpression("aran.record.values", path),
              makePrimitiveExpression(variable, path),
              right,
              path,
            ),
            makeThrowConstantExpression(variable, path),
            path,
          ),
        )
      : writable
      ? makeSetExpression(
          true,
          makeIntrinsicExpression("aran.record.values", path),
          makePrimitiveExpression(variable, path),
          right,
          path,
        )
      : makeLongSequenceExpression(
          listImpureEffect(right, path),
          makeThrowConstantExpression(variable, path),
          path,
        ),
    makeThrowDeadzoneExpression(variable, path),
    path,
  );

/***
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").GlobalBinding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 * ) => unbuild.Variable[]}
 */
export const listGlobalBindingVariable = (_strict, _binding, _variable) => [];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").GlobalBinding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listGlobalBindingDeclareStatement = (
  _strict,
  { kind },
  variable,
  path,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, path),
          makeIntrinsicExpression("aran.record.variables", path),
          path,
        ),
        makeThrowDuplicateExpression(variable, path),
        kind === "var"
          ? makePrimitiveExpression({ undefined: null }, path)
          : makeSetExpression(
              true,
              makeIntrinsicExpression("aran.record.variables", path),
              makePrimitiveExpression(variable, path),
              makePrimitiveExpression(kind !== "const", path),
              path,
            ),
        path,
      ),
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").GlobalBinding & { kind: "let" | "const" | "var" },
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const listGlobalBindingInitializeStatement = (
  _strict,
  { kind },
  variable,
  right,
  path,
) => [
  makeEffectStatement(
    makeExpressionEffect(
      kind === "var"
        ? makeConditionalExpression(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.defineProperty", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeIntrinsicExpression("aran.global", path),
                makePrimitiveExpression(variable, path),
                makeDataDescriptorExpression(
                  {
                    value: right,
                    writable: true,
                    enumerable: true,
                    configurable: false,
                  },
                  path,
                ),
              ],
              path,
            ),
            makePrimitiveExpression({ undefined: null }, path),
            makeThrowConstantExpression(variable, path),
            path,
          )
        : makeSetExpression(
            true,
            makeIntrinsicExpression("aran.record.values", path),
            makePrimitiveExpression(variable, path),
            right,
            path,
          ),
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").GlobalBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalBindingReadExpression = (
  _strict,
  { kind },
  variable,
  path,
) =>
  kind === "var" || kind === "missing"
    ? makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, path),
          makeIntrinsicExpression("aran.record.variables", path),
          path,
        ),
        makeHiddenReadExpression(variable, path),
        kind === "missing"
          ? makeConditionalExpression(
              makeBinaryExpression(
                "in",
                makePrimitiveExpression(variable, path),
                makeIntrinsicExpression("aran.global", path),
                path,
              ),
              makeGetExpression(
                makeIntrinsicExpression("aran.global", path),
                makePrimitiveExpression(variable, path),
                path,
              ),
              makeThrowMissingExpression(variable, path),
              path,
            )
          : makeGetExpression(
              makeIntrinsicExpression("aran.global", path),
              makePrimitiveExpression(variable, path),
              path,
            ),
        path,
      )
    : makeHiddenReadExpression(variable, path);

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").GlobalBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalBindingTypeofExpression = (
  _strict,
  { kind },
  variable,
  path,
) =>
  makeUnaryExpression(
    "typeof",
    kind === "var" || kind === "missing"
      ? makeConditionalExpression(
          makeBinaryExpression(
            "in",
            makePrimitiveExpression(variable, path),
            makeIntrinsicExpression("aran.record.variables", path),
            path,
          ),
          makeHiddenReadExpression(variable, path),
          makeGetExpression(
            makeIntrinsicExpression("aran.global", path),
            makePrimitiveExpression(variable, path),
            path,
          ),
          path,
        )
      : makeHiddenReadExpression(variable, path),
    path,
  );

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").GlobalBinding,
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGlobalBindingDiscardExpression = (
  strict,
  { kind },
  variable,
  path,
) =>
  kind === "missing"
    ? makeConditionalExpression(
        makeBinaryExpression(
          "in",
          makePrimitiveExpression(variable, path),
          makeIntrinsicExpression("aran.record.variables", path),
          path,
        ),
        makePrimitiveExpression(false, path),
        makeDeleteExpression(
          strict,
          makeIntrinsicExpression("aran.global", path),
          makePrimitiveExpression(variable, path),
          path,
        ),
        path,
      )
    : makePrimitiveExpression(false, path);

/**
 * @type {(
 *   strict: boolean,
 *   binding: import("./binding.d.ts").GlobalBinding,
 *   variable: estree.Variable,
 *   right: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.RootMeta,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listGlobalBindingWriteEffect = (
  strict,
  { kind },
  variable,
  right,
  path,
  meta,
) => [
  makeExpressionEffect(
    kind === "var" || kind === "missing"
      ? makeCacheExpression(right, path, mangleMetaVariable(meta), (right) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "in",
              makePrimitiveExpression(variable, path),
              makeIntrinsicExpression("aran.record.variables", path),
              path,
            ),
            makeHiddenWriteExpression(
              null,
              variable,
              right,
              path,
              forkMeta(meta),
            ),
            kind === "missing" && strict
              ? makeConditionalExpression(
                  makeBinaryExpression(
                    "in",
                    makePrimitiveExpression(variable, path),
                    makeIntrinsicExpression("aran.global", path),
                    path,
                  ),
                  makeSetExpression(
                    true,
                    makeIntrinsicExpression("aran.record.values", path),
                    makePrimitiveExpression(variable, path),
                    right,
                    path,
                  ),
                  makeThrowMissingExpression(variable, path),
                  path,
                )
              : makeSetExpression(
                  true,
                  makeIntrinsicExpression("aran.record.values", path),
                  makePrimitiveExpression(variable, path),
                  right,
                  path,
                ),
            path,
          ),
        )
      : makeHiddenWriteExpression(
          kind !== "const",
          variable,
          right,
          path,
          meta,
        ),
    path,
  ),
];

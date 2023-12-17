import { AranTypeError } from "../../../../error.mjs";
import { guard } from "../../../../util/index.mjs";
import {
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../../cache.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../../../node.mjs";
import {
  makeBodyPrelude,
  makeHeaderPrelude,
  makeLogPrelude,
} from "../../../prelude.mjs";
import {
  mapSequence,
  passSequence,
  tellSequence,
  thenSequence,
} from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     kind: import(".").DeadzoneExternalKind,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").DeadzoneExternalBinding,
 * >}
 */
export const bindDeadzoneExternal = (
  { path, meta },
  context,
  { kind, variable },
) =>
  thenSequence(
    tellSequence([
      makeLogPrelude({
        name: "ExternalDeadzone",
        message: `Outside sources will not honor the deadzone of external variable '${variable}'`,
        path,
      }),
      ...(kind === "const"
        ? [
            makeLogPrelude({
              name: "ExternalConstant",
              message: `Outside sources will not honor the immutability of external variable '${variable}'`,
              path,
            }),
          ]
        : []),
      makeHeaderPrelude({
        type: "declaration",
        mode: context.mode,
        kind: "let",
        variable,
      }),
      makeHeaderPrelude({
        type: "lookup",
        mode: context.mode,
        variable,
      }),
      ...(context.mode === "sloppy"
        ? [
            makeHeaderPrelude({
              type: /** @type {"lookup"} */ ("lookup"),
              mode: /** @type {"strict"} */ ("strict"),
              variable,
            }),
          ]
        : []),
    ]),
    mapSequence(
      passSequence(
        cacheWritable(meta, makePrimitiveExpression(true, path), path),
        (node) => makeBodyPrelude(makeEffectStatement(node, path)),
      ),
      (deadzone) => ({ kind, deadzone }),
    ),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     binding: import(".").DeadzoneExternalBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDeadzoneExternalLoadExpression = (
  { path },
  context,
  { operation, binding, variable },
) =>
  guard(
    operation === "read" || operation === "typeof",
    (node) =>
      makeConditionalExpression(
        makeReadCacheExpression(binding.deadzone, path),
        makeThrowDeadzoneExpression(variable, path),
        node,
        path,
      ),
    makeApplyExpression(
      makeReadParameterExpression(`${operation}.${context.mode}`, path),
      makePrimitiveExpression({ undefined: null }, path),
      [makePrimitiveExpression(variable, path)],
      path,
    ),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "write",
 *     variable: estree.Variable,
 *     right: import("../../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listSaveEffect = ({ path }, context, { operation, variable, right }) =>
  right === null
    ? []
    : [
        makeExpressionEffect(
          makeApplyExpression(
            makeReadParameterExpression(`${operation}.${context.mode}`, path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makePrimitiveExpression(variable, path),
              makeReadCacheExpression(right, path),
            ],
            path,
          ),
          path,
        ),
      ];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import(".").DeadzoneExternalBinding,
 *     variable: estree.Variable,
 *     right: import("../../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeadzoneExternalSaveEffect = (
  { path },
  context,
  { operation, binding, variable, right },
) => {
  switch (operation) {
    case "initialize": {
      return [
        ...listSaveEffect({ path }, context, {
          operation: "write",
          variable,
          right,
        }),
        ...listWriteCacheEffect(
          binding.deadzone,
          makePrimitiveExpression(false, path),
          path,
        ),
      ];
    }
    case "write": {
      if (binding.kind === "let" || binding.kind === "class") {
        return [
          makeConditionalEffect(
            makeReadCacheExpression(binding.deadzone, path),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(variable, path),
                path,
              ),
            ],
            listSaveEffect({ path }, context, {
              operation,
              variable,
              right,
            }),
            path,
          ),
        ];
      } else if (binding.kind === "const") {
        return [
          makeConditionalEffect(
            makeReadCacheExpression(binding.deadzone, path),
            [
              makeExpressionEffect(
                makeThrowDeadzoneExpression(variable, path),
                path,
              ),
            ],
            [
              makeExpressionEffect(
                makeThrowConstantExpression(variable, path),
                path,
              ),
            ],
            path,
          ),
        ];
      } else {
        throw new AranTypeError("invalid binding kind", binding.kind);
      }
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
    }
  }
};

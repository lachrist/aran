import { AranTypeError } from "../../../error.mjs";
import { guard, pairup } from "../../../util/index.mjs";
import {
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import {
  EMPTY_EFFECT,
  concatEffect,
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
  makeReadExpression,
} from "../../node.mjs";
import { makeHeaderPrelude, makeWarningPrelude } from "../../prelude.mjs";
import { mapSequence, tellSequence, thenSequence } from "../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   hoist: import("../../query/hoist").BlockHoist,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").DeadzoneExternalBinding,
 *   ],
 * >}
 */
export const bindDeadzoneExternal = (
  { path, meta },
  { variable, kind },
  { mode },
) =>
  thenSequence(
    tellSequence([
      makeWarningPrelude({
        name: "ExternalDeadzone",
        message: `Outside sources will not honor the deadzone of external variable '${variable}'`,
        path,
      }),
      ...(kind === "const"
        ? [
            makeWarningPrelude({
              name: "ExternalConstant",
              message: `Outside sources will not honor the immutability of external variable '${variable}'`,
              path,
            }),
          ]
        : []),
      makeHeaderPrelude({
        type: "declare.let",
        mode,
        variable,
      }),
      makeHeaderPrelude({
        type: "lookup.static",
        mode,
        variable,
      }),
      ...(mode === "sloppy"
        ? [
            makeHeaderPrelude({
              type: "lookup.static",
              mode: "sloppy",
              variable,
            }),
          ]
        : []),
    ]),
    mapSequence(
      cacheWritable(meta, makePrimitiveExpression(true, path), path),
      (deadzone) => pairup(variable, { kind, deadzone }),
    ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneExternalBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeDeadzoneExternalLoadExpression = (
  { path },
  binding,
  operation,
) =>
  guard(
    operation.type === "read" || operation.type === "typeof",
    (node) =>
      makeConditionalExpression(
        makeReadCacheExpression(binding.deadzone, path),
        makeThrowDeadzoneExpression(operation.variable, path),
        node,
        path,
      ),
    makeApplyExpression(
      makeReadExpression(`${operation.type}.${operation.mode}`, path),
      makePrimitiveExpression({ undefined: null }, path),
      [makePrimitiveExpression(operation.variable, path)],
      path,
    ),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneExternalBinding,
 *   operation: import("..").WriteOperation,
 * ) => import("../../sequence").EffectSequence}
 */
const listSaveEffect = ({ path }, _binding, operation) =>
  makeExpressionEffect(
    makeApplyExpression(
      makeReadExpression(`${operation.type}.${operation.mode}`, path),
      makePrimitiveExpression({ undefined: null }, path),
      [
        makePrimitiveExpression(operation.variable, path),
        makeReadCacheExpression(operation.right, path),
      ],
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").DeadzoneExternalBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listDeadzoneExternalSaveEffect = (
  { path },
  binding,
  operation,
) => {
  if (operation.type === "initialize") {
    return concatEffect([
      operation.right === null
        ? EMPTY_EFFECT
        : listSaveEffect({ path }, binding, {
            type: "write",
            mode: operation.mode,
            variable: operation.variable,
            right: operation.right,
          }),
      listWriteCacheEffect(
        binding.deadzone,
        makePrimitiveExpression(false, path),
        path,
      ),
    ]);
  } else if (operation.type === "write") {
    if (binding.kind === "let") {
      return makeConditionalEffect(
        makeReadCacheExpression(binding.deadzone, path),
        makeExpressionEffect(
          makeThrowDeadzoneExpression(operation.variable, path),
          path,
        ),
        listSaveEffect({ path }, binding, operation),
        path,
      );
    } else if (binding.kind === "const") {
      return makeConditionalEffect(
        makeReadCacheExpression(binding.deadzone, path),
        makeExpressionEffect(
          makeThrowDeadzoneExpression(operation.variable, path),
          path,
        ),
        makeExpressionEffect(
          makeThrowConstantExpression(operation.variable, path),
          path,
        ),
        path,
      );
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else {
    throw new AranTypeError(operation);
  }
};

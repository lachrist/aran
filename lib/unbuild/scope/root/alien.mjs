import { AranTypeError } from "../../../error.mjs";
import {
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";
import {
  EMPTY_EFFECT,
  concatEffect,
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeHeaderPrelude } from "../../prelude.mjs";
import { bindSequence, initSequence } from "../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";
import { makeLookupParameterExpression } from "./parameter.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   operation: import(".").Declare,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").AlienBinding,
 *   ],
 * >}
 */
export const setupAlienEntry = ({ path, meta }, { mode, kind, variable }) => {
  if (kind === "var") {
    return initSequence(
      [
        makeHeaderPrelude({
          type: "declare",
          mode,
          kind: "var",
          variable,
        }),
      ],
      [variable, { kind, deadzone: null }],
    );
  } else if (kind === "let" || kind === "const") {
    return bindSequence(
      cacheWritable(meta, makePrimitiveExpression(true, path), path),
      (deadzone) =>
        initSequence(
          [
            makeHeaderPrelude({
              type: "declare",
              mode,
              kind: "let",
              variable,
            }),
          ],
          [variable, { kind, deadzone }],
        ),
    );
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const makeAlienSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "declare") {
    if (operation.mode === "strict") {
      return listEarlyErrorEffect(
        "Illegal late variable declaration in strict mode",
        path,
      );
    } else if (operation.mode === "sloppy") {
      return initSequence(
        [
          makeHeaderPrelude({
            type: "declare",
            mode: operation.mode,
            kind: operation.kind,
            variable: operation.variable,
          }),
        ],
        [],
      );
    } else {
      throw new AranTypeError(operation.mode);
    }
  } else if (operation.type === "initialize") {
    return concatEffect([
      binding !== null && binding.deadzone !== null
        ? listWriteCacheEffect(
            binding.deadzone,
            makePrimitiveExpression(false, path),
            path,
          )
        : EMPTY_EFFECT,
      operation.right !== null
        ? makeExpressionEffect(
            makeApplyExpression(
              makeLookupParameterExpression(
                operation.mode,
                "write",
                operation.variable,
                path,
              ),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makePrimitiveExpression(operation.variable, path),
                makeReadCacheExpression(operation.right, path),
              ],
              path,
            ),
            path,
          )
        : EMPTY_EFFECT,
    ]);
  } else if (operation.type === "write") {
    const node =
      binding !== null && binding.kind === "const"
        ? makeThrowConstantExpression(operation.variable, path)
        : makeApplyExpression(
            makeLookupParameterExpression(
              operation.mode,
              "write",
              operation.variable,
              path,
            ),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makePrimitiveExpression(operation.variable, path),
              makeReadCacheExpression(operation.right, path),
            ],
            path,
          );
    if (binding !== null && binding.deadzone !== null) {
      return makeConditionalEffect(
        makeReadCacheExpression(binding.deadzone, path),
        makeExpressionEffect(
          makeThrowDeadzoneExpression(operation.variable, path),
          path,
        ),
        makeExpressionEffect(node, path),
        path,
      );
    } else {
      return makeExpressionEffect(node, path);
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: null | import(".").AlienBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeAlienLoadExpression = ({ path }, binding, operation) => {
  const node = makeApplyExpression(
    makeLookupParameterExpression(
      operation.mode,
      operation.type,
      operation.variable,
      path,
    ),
    makePrimitiveExpression({ undefined: null }, path),
    [makePrimitiveExpression(operation.variable, path)],
    path,
  );
  if (
    (operation.type === "read" || operation.type === "typeof") &&
    binding !== null &&
    binding.deadzone !== null
  ) {
    return makeConditionalExpression(
      makeReadCacheExpression(binding.deadzone, path),
      makeThrowDeadzoneExpression(operation.variable, path),
      node,
      path,
    );
  } else {
    return node;
  }
};

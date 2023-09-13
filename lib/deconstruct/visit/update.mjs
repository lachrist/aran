import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../intrinsic.mjs";
import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../../node.mjs";
import { DynamicError, reduceReverse } from "../../util/index.mjs";
import { listMemoScopeWriteEffect, memoize } from "../memoize.mjs";
import {
  listScopeWriteEffect,
  makeScopeReadExpression,
} from "../scope/index.mjs";
import { deconstructExpression } from "./expression.mjs";
import { deconstructKey } from "./key.mjs";

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.js").Context<S>,
 *   site: {
 *     prefix: boolean,
 *     operator: "++" | "--",
 *   },
 * ) => Expression<S>}
 */
export const deconstructUpdateExpression = (
  node,
  context,
  { prefix, operator },
) => {
  const serial = context.serialize(node);
  switch (node.type) {
    case "MemberExpression":
      /* c8 ignore next 3 */
      if (node.optional) {
        throw new DynamicError("invalid optional chaning", node);
      }
      if (node.object.type === "Super") {
        return "TODO";
      } else {
        const memo1 = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "update_expression", "object"),
          deconstructExpression(node.object, context, null),
          serial,
        );
        const memo2 = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "update_expression", "key"),
          deconstructKey(node.property, context, node.computed),
          serial,
        );
        if (prefix) {
          return reduceReverse(
            [...memo1.save, ...memo2.save],
            (expression, effect) =>
              makeSequenceExpression(effect, expression, serial),
            makeSetExpression(
              context.strict,
              memo1.load,
              memo2.load,
              makeBinaryExpression(
                /** @type {("+" | "-")} */ (operator[0]),
                makeGetExpression(memo1.load, memo2.load, serial),
                makePrimitiveExpression(1, serial),
                serial,
              ),
              serial,
            ),
          );
        } else {
          const memo3 = memoize(
            context.strict,
            context.scope,
            context.mangle(node, "update_expression", "value"),
            makeGetExpression(memo1.load, memo2.load, serial),
            serial,
          );
          return makeSequenceExpression(
            makeExpressionEffect(
              reduceReverse(
                [...memo1.save, ...memo2.save, ...memo3.save],
                (expression, effect) =>
                  makeSequenceExpression(effect, expression, serial),
                makeSetExpression(
                  context.strict,
                  memo1.load,
                  memo2.load,
                  makeBinaryExpression(
                    /** @type {("+" | "-")} */ (operator[0]),
                    memo3.load,
                    makePrimitiveExpression(1, serial),
                    serial,
                  ),
                  serial,
                ),
              ),
              serial,
            ),
            memo3.load,
            serial,
          );
        }
      }
    case "Identifier":
      if (prefix) {
        const read = makeScopeReadExpression(
          context.strict,
          context.scope,
          /** @type {Variable} */ (node.name),
          serial,
        );
        if (read.type === "ReadExpression") {
          return reduceReverse(
            listScopeWriteEffect(
              context.strict,
              context.scope,
              /** @type {Variable} */ (node.name),
              makeBinaryExpression(
                /** @type {("+" | "-")} */ (operator[0]),
                read,
                makePrimitiveExpression(1, serial),
                serial,
              ),
              serial,
            ),
            (expression, effect) =>
              makeSequenceExpression(effect, expression, serial),
            /** @type {Expression<any>} */ (read),
          );
        } else {
          const memo = memoize(
            context.strict,
            context.scope,
            context.mangle(node, "update_effect", "result"),
            read,
            serial,
          );
          return reduceReverse(
            [
              ...memo.save,
              ...listMemoScopeWriteEffect(
                context.strict,
                context.scope,
                {},
                /** @type {Variable} */ (node.name),
                makeBinaryExpression(
                  /** @type {("+" | "-")} */ (operator[0]),
                  memo.load,
                  makePrimitiveExpression(1, serial),
                  serial,
                ),
                serial,
              ),
            ],
            (expression, effect) =>
              makeSequenceExpression(effect, expression, serial),
            memo.load,
          );
        }
      } else {
        return "TODO";
      }
    default:
      throw new DynamicError("invalid update pattern", node);
  }
};

/**
 * @type {<S>(
 *   node: estree.Pattern,
 *   context: import("./context.d.ts").Context<S>,
 *   site: {
 *     operator: "++" | "--",
 *   }
 * ) => Effect<S>[]}
 */
export const deconstructUpdateEffect = (node, context, { operator }) => {
  const serial = context.serialize(node);
  switch (node.type) {
    case "MemberExpression":
      /* c8 ignore next 3 */
      if (node.optional) {
        throw new DynamicError("invalid optional chaning", node);
      }
      if (node.object.type === "Super") {
        const memo = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "update_effect", "key"),
          deconstructKey(node.property, context, node.computed),
          serial,
        );
        const right = makeBinaryExpression(
          /** @type {("+" | "-")} */ (operator[0]),
          makeApplyExpression(
            makeParameterExpression("super.get", serial),
            makePrimitiveExpression({ undefined: null }, serial),
            [memo.load],
            serial,
          ),
          makePrimitiveExpression(1, serial),
          serial,
        );
        if (context.super === null) {
          return [
            ...memo.save,
            makeExpressionEffect(
              makeApplyExpression(
                makeParameterExpression("super.set", serial),
                makePrimitiveExpression({ undefined: null }, serial),
                [memo.load, right],
                serial,
              ),
              serial,
            ),
          ];
        } else {
          return [
            ...memo.save,
            makeExpressionEffect(
              makeSetExpression(
                context.strict,
                makeScopeLoadExpression(
                  context.strict,
                  context.scope,
                  context.super,
                  serial,
                ),
                memo.load,
                right,
                serial,
              ),
              serial,
            ),
          ];
        }
      } else {
        const memo1 = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "update_effect", "object"),
          deconstructExpression(node.object, context, null),
          serial,
        );
        const memo2 = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "update_effect", "key"),
          deconstructKey(node.property, context, node.computed),
          serial,
        );
        return [
          ...memo1.save,
          ...memo2.save,
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              memo1.load,
              memo2.load,
              makeBinaryExpression(
                /** @type {("+" | "-")} */ (operator[0]),
                makeGetExpression(memo1.load, memo2.load, serial),
                makePrimitiveExpression(1, serial),
                serial,
              ),
              serial,
            ),
            serial,
          ),
        ];
      }
    case "Identifier": {
      const memo = memoize(
        context.strict,
        context.scope,
        context.mangle(node, "update_effect", "variable"),
        makeScopeReadExpression(
          context.strict,
          context.scope,
          /** @type {Variable} */ (node.name),
          serial,
        ),
        serial,
      );
      return [
        ...memo.save,
        ...listMemoScopeWriteEffect(
          context.strict,
          context.scope,
          {
            base: /** @type {Variable} */ (node.name),
            meta: context.mangle(node, "update_effect", "variable"),
          },
          makeBinaryExpression(
            /** @type {("+" | "-")} */ (operator[0]),
            memo.load,
            makePrimitiveExpression(1, serial),
            serial,
          ),
          serial,
        ),
      ];
    }
    default:
      throw new DynamicError("invalid update pattern", node);
  }
};

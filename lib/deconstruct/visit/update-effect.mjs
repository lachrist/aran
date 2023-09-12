import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
} from "../../intrinsic.mjs";
import { makeExpressionEffect, makePrimitiveExpression } from "../../node.mjs";
import { DynamicError } from "../../util/index.mjs";
import { listMemoScopeWriteEffect, memoize } from "../memoize.mjs";
import { makeScopeReadExpression } from "../scope/index.mjs";
import { deconstructExpression } from "./expression.mjs";
import { deconstructKey } from "./key.mjs";

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
        return "TODO";
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

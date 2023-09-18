import {
  makeDeleteExpression,
  makeThrowErrorExpression,
} from "../../intrinsic.mjs";
import {
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../../node.mjs";
import { reduceReverse } from "../../util/index.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyEffect, unbuildKeyExpression } from "./key.mjs";

/**
 * @type {<S>(
 *   node: estree.Expression,
 *   context: import("./context.js").Context<S>,
 * ) => Expression<S>}
 */
export const unbuildDeleteExpression = (node, context) => {};

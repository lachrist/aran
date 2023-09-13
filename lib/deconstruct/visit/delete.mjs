import {
  makeDeleteExpression,
  makeThrowErrorExpression,
} from "../../intrinsic.mjs";
import {
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../../node.mjs";
import { reduceReverse } from "../../util/index.mjs";
import { deconstructEffect } from "./effect.mjs";
import { deconstructExpression } from "./expression.mjs";
import { deconstructKeyEffect, deconstructKeyExpression } from "./key.mjs";

/**
 * @type {<S>(
 *   node: estree.Expression,
 *   context: import("./context.d.ts").Context<S>,
 * ) => Expression<S>}
 */
export const deconstructDeleteExpression = (node, context) => {};

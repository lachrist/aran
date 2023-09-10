import { flatMap } from "../../util/index.mjs";

import {
  makeWriteEffect,
  makeReadExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";

import { listChild } from "../../query.mjs";

import { makeGetExpression, makeSetExpression } from "../../intrinsic.mjs";

import { isMetaVariable, mangleMetaVariable } from "./variable.mjs";

/** @type {<T>(node: Node<T>) => string[]} */
export const listMetaVariable = (node) => {
  switch (node.type) {
    case "ControlBlock":
      return [];
    case "ClosureBlock":
      return [];
    case "WriteEffect":
      return [
        ...(isMetaVariable(node.variable) ? [node.variable] : []),
        ...listMetaVariable(node.right),
      ];
    default:
      return flatMap(listChild(node), listMetaVariable);
  }
};

/**
 * @type {<T>(
 *   strict: boolean,
 *   script: boolean,
 *   variable: Variable,
 *   expression: Expression<T>,
 *   tag: T,
 * ) => Effect<T>}
 */
export const makeMetaSaveEffect = (
  _strict,
  script,
  variable,
  expression,
  tag,
) =>
  script
    ? makeExpressionEffect(
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.cache", tag),
          makePrimitiveExpression(variable, tag),
          expression,
          tag,
        ),
        tag,
      )
    : makeWriteEffect(mangleMetaVariable(variable), expression, tag);

/**
 * @type {<T>(
 *   strict: boolean,
 *   script: boolean,
 *   variable: Variable,
 *   tag: T,
 * ) => Expression<T>}
 */
export const makeMetaLoadExpression = (_strict, script, variable, tag) =>
  script
    ? makeGetExpression(
        makeIntrinsicExpression("aran.cache", tag),
        makePrimitiveExpression(mangleMetaVariable(variable), tag),
        tag,
      )
    : makeReadExpression(variable, tag);

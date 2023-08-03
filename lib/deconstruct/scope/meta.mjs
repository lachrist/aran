import { flatMap } from "../../util/index.mjs";

import {
  makeWriteEffect,
  makeReadExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../syntax.mjs";

import { listChild } from "../../query.mjs";

import { makeGetExpression, makeSetExpression } from "../../intrinsic.mjs";

import { isMetaVariable, mangleMetaVariable } from "../../variable.mjs";

/** @type {<T>(node: Node<T>) => string[]} */
export const listMetaVariable = (node) => {
  switch (node.type) {
    case "BlockStatement":
      return [];
    case "WriteEffect":
      return [
        ...(isMetaVariable(node.variable) ? [node.variable] : []),
        ...listMetaVariable(node.value),
      ];
    default:
      return flatMap(listChild(node), listMetaVariable);
  }
};

/**
 * @type {<T>(
 *   strict: boolean,
 *   script: boolean,
 *   variable: string,
 *   expression: Expression<T>,
 * ) => Effect<T>}
 */
export const makeMetaSaveEffect = (_strict, script, variable, expression) =>
  script
    ? makeExpressionEffect(
        makeSetExpression(
          true,
          makeIntrinsicExpression("aran.global.cache"),
          makePrimitiveExpression(variable),
          expression,
        ),
      )
    : makeWriteEffect(mangleMetaVariable(variable), expression);

/**
 * @type {<T>(
 *   strict: boolean,
 *   script: boolean,
 *   variable: string,
 * ) => Expression<T>}
 */
export const makeMetaLoadExpression = (_strict, script, variable) =>
  script
    ? makeGetExpression(
        makeIntrinsicExpression("aran.global.cache"),
        makePrimitiveExpression(mangleMetaVariable(variable)),
      )
    : makeReadExpression(variable);

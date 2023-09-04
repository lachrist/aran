/* eslint-disable no-use-before-define */

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./syntax.mjs";

import { StaticError, flat, map } from "../util/index.mjs";

const {
  Array: { isArray },
  Object: { entries: listEntry },
} = globalThis;

/** @type {(expression1: Expression<Variable[]>, expression2: Expression<Variable[]>) => Expression<Variable[]>} */
export const makeGetExpression = (expression1, expression2) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get"),
    makePrimitiveExpression({ undefined: null }),
    [expression1, expression2],
  );

/** @type {(expression1: Expression<Variable[]>[]) => Expression<Variable[]>} */
export const makeArrayExpression = (expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makePrimitiveExpression({ undefined: null }),
    expressions,
  );

/**
 * @type {(
 *   expression: Expression<Variable[]>,
 *   entries: [Expression<Variable[]>, Expression<Variable[]>][],
 * ) => Expression<Variable[]>}
 */
export const makeObjectExpression = (expression, entries) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makePrimitiveExpression({ undefined: null }),
    [expression, ...flat(entries)],
  );

/** @type {(entry: [string, Json]) => [Expression<Variable[]>, Expression<Variable[]>]} */
const makeJsonEntry = ([key, val]) => [
  makePrimitiveExpression(key),
  makeJsonExpression(val),
];

/**
 * @template X
 * @param {Json} json
 * @return {Expression<Variable[]>}
 */
export const makeJsonExpression = (json) => {
  if (
    json === null ||
    typeof json === "boolean" ||
    typeof json === "number" ||
    typeof json === "string"
  ) {
    return makePrimitiveExpression(json);
  } else if (isArray(json)) {
    return makeArrayExpression(
      /** @type {Expression<Variable[]>[]} */ (map(json, makeJsonExpression)),
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype"),
      /** @type {[Expression<Variable[]>, Expression<Variable[]>][]} */ (
        map(listEntry(json), makeJsonEntry)
      ),
    );
  } else {
    throw new StaticError("invalid json", json);
  }
};

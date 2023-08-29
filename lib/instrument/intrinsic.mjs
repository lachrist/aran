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

/**
 * @template X
 * @typedef {Record<String, X>} Scope<X>
 */

/** @type {<X>(expression1: Expression<Scope<X>>, expression2: Expression<Scope<X>>) => Expression<Scope<X>>} */
export const makeGetExpression = (expression1, expression2) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get"),
    makePrimitiveExpression({ undefined: null }),
    [expression1, expression2],
  );

/** @type {<X>(expression1: Expression<Scope<X>>[]) => Expression<Scope<X>>} */
export const makeArrayExpression = (expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makePrimitiveExpression({ undefined: null }),
    expressions,
  );

/**
 * @type {<X>(
 *   expression: Expression<Scope<X>>,
 *   entries: [Expression<Scope<X>>, Expression<Scope<X>>][],
 * ) => Expression<Scope<X>>}
 */
export const makeObjectExpression = (expression, entries) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makePrimitiveExpression({ undefined: null }),
    [expression, ...flat(entries)],
  );

/** @type {<X>(entry: [string, Json]) => [Expression<Scope<X>>, Expression<Scope<X>>]} */
const makeJsonEntry = ([key, val]) => [
  makePrimitiveExpression(key),
  makeJsonExpression(val),
];

/**
 * @template X
 * @param {Json} json
 * @return {Expression<Scope<X>>}
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
      /** @type {Expression<Scope<X>>[]} */ (map(json, makeJsonExpression)),
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype"),
      /** @type {[Expression<Scope<X>>, Expression<Scope<X>>][]} */ (
        map(listEntry(json), makeJsonEntry)
      ),
    );
  } else {
    throw new StaticError("invalid json", json);
  }
};

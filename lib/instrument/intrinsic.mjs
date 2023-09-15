/* eslint-disable no-use-before-define */

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";

import { StaticError, flat, map } from "../util/index.mjs";

const {
  Array: { isArray },
  Object: { entries: listEntry },
} = globalThis;

/**
 * @type {(
 *   expression1: weave.Expression,
 *   expression2: weave.Expression,
 * ) => weave.Expression}
 */
export const makeGetExpression = (expression1, expression2) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get"),
    makePrimitiveExpression({ undefined: null }),
    [expression1, expression2],
  );

/**
 * @type {(
 *   expression1: weave.Expression[],
 * ) => weave.Expression}
 */
export const makeArrayExpression = (expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makePrimitiveExpression({ undefined: null }),
    expressions,
  );

/**
 * @type {(
 *   expression: weave.Expression,
 *   entries: [weave.Expression, weave.Expression][],
 * ) => weave.Expression}
 */
export const makeObjectExpression = (expression, entries) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makePrimitiveExpression({ undefined: null }),
    [expression, ...flat(entries)],
  );

/**
 * @type {(
 *   entry: [string, Json],
 * ) => [weave.Expression, weave.Expression]}
 */
const makeJsonEntry = ([key, val]) => [
  makePrimitiveExpression(key),
  makeJsonExpression(val),
];

/** @type {(json: Json) => weave.Expression} */
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
      /** @type {weave.Expression[]} */ (map(json, makeJsonExpression)),
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype"),
      /** @type {[weave.Expression, weave.Expression][]} */ (
        map(listEntry(json), makeJsonEntry)
      ),
    );
  } else {
    throw new StaticError("invalid json", json);
  }
};

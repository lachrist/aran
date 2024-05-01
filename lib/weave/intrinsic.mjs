/* eslint-disable no-use-before-define */

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { concat_X, flat, map } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";

const {
  Array: { isArray },
  Object: { entries: listEntry },
} = globalThis;

/**
 * @type {(
 *   expression1: aran.Expression<weave.ResAtom>,
 *   expression2: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeGetExpression = (expression1, expression2) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get"),
    makeIntrinsicExpression("undefined"),
    [expression1, expression2],
  );

/**
 * @type {(
 *   expression1: aran.Expression<weave.ResAtom>[],
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeArrayExpression = (expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makeIntrinsicExpression("undefined"),
    expressions,
  );

/**
 * @type {(
 *   prototype: aran.Expression<weave.ResAtom>,
 *   entries: [
 *     aran.Expression<weave.ResAtom>,
 *     aran.Expression<weave.ResAtom>,
 *   ][],
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeObjectExpression = (prototype, entries) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeIntrinsicExpression("undefined"),
    concat_X(prototype, flat(entries)),
  );

/**
 * @type {(
 *   entry: [string, Json],
 * ) => [aran.Expression<weave.ResAtom>, aran.Expression<weave.ResAtom>]}
 */
const makeJsonEntry = ([key, val]) => [
  makePrimitiveExpression(key),
  makeJsonExpression(val),
];

/** @type {(json: Json) => aran.Expression<weave.ResAtom>} */
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
      /** @type {aran.Expression<weave.ResAtom>[]} */ (
        map(json, makeJsonExpression)
      ),
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype"),
      map(/** @type {[string, Json][]} */ (listEntry(json)), makeJsonEntry),
    );
  } else {
    throw new AranTypeError(json);
  }
};

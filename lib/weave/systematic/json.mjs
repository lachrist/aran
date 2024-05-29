/* eslint-disable no-use-before-define */

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { concat_X, flat, map } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";

const {
  Array: { isArray },
  Object: { entries: listEntry },
} = globalThis;

/**
 * @type {(
 *   expression1: aran.Expression<import("./atom").ResAtom>[],
 * ) => aran.Expression<import("./atom").ResAtom>}
 */
const makeArrayExpression = (expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makeIntrinsicExpression("undefined"),
    expressions,
  );

/**
 * @type {(
 *   prototype: aran.Expression<import("./atom").ResAtom>,
 *   entries: [
 *     aran.Expression<import("./atom").ResAtom>,
 *     aran.Expression<import("./atom").ResAtom>,
 *   ][],
 * ) => aran.Expression<import("./atom").ResAtom>}
 */
const makeObjectExpression = (prototype, entries) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeIntrinsicExpression("undefined"),
    concat_X(prototype, flat(entries)),
  );

/**
 * @type {(
 *   entry: [string, Json],
 * ) => [
 *   aran.Expression<import("./atom").ResAtom>,
 *   aran.Expression<import("./atom").ResAtom>,
 * ]}
 */
const makeJsonEntry = ([key, val]) => [
  makePrimitiveExpression(key),
  makeJsonExpression(val),
];

/** @type {(json: Json) => aran.Expression<import("./atom").ResAtom>} */
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
      /** @type {aran.Expression<import("./atom").ResAtom>[]} */ (
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

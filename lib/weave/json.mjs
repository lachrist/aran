/* eslint-disable no-use-before-define */

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { concat_X, flat, map } from "../util/index.mjs";
import { AranTypeError } from "../report.mjs";

const {
  Array: { isArray },
  Object: { entries: listEntry },
} = globalThis;

/**
 * @type {(
 *   expression1: import("./atom").ResExpression[],
 * ) => import("./atom").ResExpression}
 */
const makeArrayExpression = (expressions) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of"),
    makeIntrinsicExpression("undefined"),
    expressions,
  );

/**
 * @type {(
 *   prototype: import("./atom").ResExpression,
 *   entries: [
 *     import("./atom").ResExpression,
 *     import("./atom").ResExpression,
 *   ][],
 * ) => import("./atom").ResExpression}
 */
const makeObjectExpression = (prototype, entries) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject"),
    makeIntrinsicExpression("undefined"),
    concat_X(prototype, flat(entries)),
  );

/**
 * @type {(
 *   entry: [string, import("../json").Json],
 * ) => [
 *   import("./atom").ResExpression,
 *   import("./atom").ResExpression,
 * ]}
 */
const makeJsonEntry = ([key, val]) => [
  makePrimitiveExpression(key),
  makeJsonExpression(val),
];

/**
 * @type {(
 *   json: import("../json").Json,
 * ) => import("./atom").ResExpression}
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
      /** @type {import("./atom").ResExpression[]} */ (
        map(json, makeJsonExpression)
      ),
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype"),
      map(
        /** @type {[string, import("../json").Json][]} */ (listEntry(json)),
        makeJsonEntry,
      ),
    );
  } else {
    throw new AranTypeError(json);
  }
};

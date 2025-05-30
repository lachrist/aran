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
 *   expression1: import("./atom.d.ts").ResExpression[],
 *   tag: import("./atom.d.ts").Tag,
 * ) => import("./atom.d.ts").ResExpression}
 */
const makeArrayExpression = (expressions, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("Array.of", tag),
    makeIntrinsicExpression("undefined", tag),
    expressions,
    tag,
  );

/**
 * @type {(
 *   prototype: import("./atom.d.ts").ResExpression,
 *   entries: [
 *     import("./atom.d.ts").ResExpression,
 *     import("./atom.d.ts").ResExpression,
 *   ][],
 *   tag: import("./atom.d.ts").Tag,
 * ) => import("./atom.d.ts").ResExpression}
 */
const makeObjectExpression = (prototype, entries, tag) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.createObject", tag),
    makeIntrinsicExpression("undefined", tag),
    concat_X(prototype, flat(entries)),
    tag,
  );

/**
 * @type {(
 *   entry: [string, import("../util/util.d.ts").Json],
 *   tag: import("./atom.d.ts").Tag,
 * ) => [
 *   import("./atom.d.ts").ResExpression,
 *   import("./atom.d.ts").ResExpression,
 * ]}
 */
const makeJsonEntry = ([key, val], tag) => [
  makePrimitiveExpression(key, tag),
  makeJsonExpression(val, tag),
];

/**
 * @type {(
 *   json: import("../util/util.d.ts").Json,
 *   tag: import("./atom.d.ts").Tag,
 * ) => import("./atom.d.ts").ResExpression}
 */
export const makeJsonExpression = (json, tag) => {
  if (
    json === null ||
    typeof json === "boolean" ||
    typeof json === "number" ||
    typeof json === "string"
  ) {
    return makePrimitiveExpression(json, tag);
  } else if (isArray(json)) {
    return makeArrayExpression(
      /** @type {import("./atom.d.ts").ResExpression[]} */ (
        map(json, (data) => makeJsonExpression(data, tag))
      ),
      tag,
    );
  } else if (typeof json === "object") {
    return makeObjectExpression(
      makeIntrinsicExpression("Object.prototype", tag),
      map(
        /** @type {[string, import("../util/util.d.ts").Json][]} */ (
          listEntry(json)
        ),
        (entry) => makeJsonEntry(entry, tag),
      ),
      tag,
    );
  } else {
    throw new AranTypeError(json);
  }
};

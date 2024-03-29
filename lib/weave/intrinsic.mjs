/* eslint-disable no-use-before-define */

import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { flat, map } from "../util/index.mjs";
import { AranTypeError } from "../error.mjs";

const {
  Array: { isArray },
  Object: { entries: listEntry },
} = globalThis;

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   expression1: aran.Expression<weave.ResAtom>,
 *   expression2: aran.Expression<weave.ResAtom>,
 *   expression3: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeSetExpression = (
  mode,
  expression1,
  expression2,
  expression3,
) =>
  makeApplyExpression(
    makeIntrinsicExpression(`aran.set.${mode}`),
    makePrimitiveExpression({ undefined: null }),
    [expression1, expression2, expression3],
  );

/**
 * @type {(
 *   expression1: aran.Expression<weave.ResAtom>,
 *   expression2: aran.Expression<weave.ResAtom>,
 * ) => aran.Expression<weave.ResAtom>}
 */
export const makeGetExpression = (expression1, expression2) =>
  makeApplyExpression(
    makeIntrinsicExpression("aran.get"),
    makePrimitiveExpression({ undefined: null }),
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
    makePrimitiveExpression({ undefined: null }),
    expressions,
  );

/**
 * @type {(
 *   expression: aran.Expression<weave.ResAtom>,
 *   entries: [aran.Expression<weave.ResAtom>, aran.Expression<weave.ResAtom>][],
 * ) => aran.Expression<weave.ResAtom>}
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
      /** @type {[aran.Expression<weave.ResAtom>, aran.Expression<weave.ResAtom>][]} */ (
        map(listEntry(json), makeJsonEntry)
      ),
    );
  } else {
    throw new AranTypeError("invalid json", json);
  }
};

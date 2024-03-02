import { AranTypeError } from "../error.mjs";
import { listEntry, map } from "../util/index.mjs";

const {
  Array: { isArray },
} = globalThis;

/**
 * @type {(
 *   json: Json,
 * ) => estree.Expression}
 */
export const makeJsonExpression = (json) => {
  if (
    json === null ||
    typeof json === "boolean" ||
    typeof json === "number" ||
    typeof json === "string"
  ) {
    return {
      type: "Literal",
      value: null,
    };
  } else if (isArray(json)) {
    return {
      type: "ArrayExpression",
      elements: map(json, makeJsonExpression),
    };
  } else if (typeof json === "object") {
    return {
      type: "ObjectExpression",
      properties: map(listEntry(json), ([key, value]) => ({
        type: "Property",
        kind: "init",
        method: false,
        shorthand: false,
        computed: false,
        key: {
          type: "Literal",
          value: key,
        },
        value: makeJsonExpression(value),
      })),
    };
  } else {
    throw new AranTypeError(json);
  }
};

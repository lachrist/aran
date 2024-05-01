import { isBigIntPrimitive } from "../lang.mjs";

const { BigInt } = globalThis;

/**
 * @type {(
 *   primitive: aran.Primitive,
 * ) => estree.Expression}
 */
export const makePrimitiveExpression = (primitive) => {
  if (isBigIntPrimitive(primitive)) {
    return {
      type: "Literal",
      value: BigInt(primitive.bigint),
      bigint: primitive.bigint,
    };
  } else {
    return {
      type: "Literal",
      value: primitive,
    };
  }
};

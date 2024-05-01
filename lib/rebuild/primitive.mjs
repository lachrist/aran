import { AranTypeError } from "../error.mjs";

import {
  isBigIntPrimitive,
  isInfinityPrimitive,
  isNanPrimitive,
  isZeroPrimitive,
} from "../lang.mjs";

const { BigInt } = globalThis;

/**
 * @type {(
 *   primitive: aran.Primitive,
 * ) => estree.Expression}
 */
export const makePrimitiveExpression = (primitive) => {
  if (isNanPrimitive(primitive)) {
    return {
      type: "BinaryExpression",
      operator: "/",
      left: {
        type: "Literal",
        value: 0,
      },
      right: {
        type: "Literal",
        value: 0,
      },
    };
  } else if (isZeroPrimitive(primitive)) {
    switch (primitive.zero) {
      case "+": {
        return {
          type: "Literal",
          value: 0,
        };
      }
      case "-": {
        return {
          type: "UnaryExpression",
          operator: "-",
          prefix: true,
          argument: {
            type: "Literal",
            value: 0,
          },
        };
      }
      default: {
        throw new AranTypeError(primitive.zero);
      }
    }
  } else if (isInfinityPrimitive(primitive)) {
    switch (primitive.infinity) {
      case "+": {
        return {
          type: "BinaryExpression",
          operator: "/",
          left: {
            type: "Literal",
            value: 1,
          },
          right: {
            type: "Literal",
            value: 0,
          },
        };
      }
      case "-": {
        return {
          type: "BinaryExpression",
          operator: "/",
          left: {
            type: "UnaryExpression",
            operator: "-",
            prefix: true,
            argument: {
              type: "Literal",
              value: 1,
            },
          },
          right: {
            type: "Literal",
            value: 0,
          },
        };
      }
      default: {
        throw new AranTypeError(primitive.infinity);
      }
    }
  } else if (isBigIntPrimitive(primitive)) {
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

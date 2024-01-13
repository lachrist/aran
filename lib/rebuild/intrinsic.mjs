import { generateIntrinsicRecord } from "../setup.mjs";
import { reduce } from "../util/index.mjs";
import { INTRINSIC } from "./mangle.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { split },
  },
} = globalThis;

/**
 * @type {(
 *   object: estree.Expression,
 *   key: string,
 * ) => estree.MemberExpression}
 */
const member = (object, key) => ({
  type: "MemberExpression",
  optional: false,
  computed: false,
  object,
  property: {
    type: "Identifier",
    name: key,
  },
});

const DOT = ["."];

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ]}
 */
export const makeIntrinsicDeclarator = (config) => {
  if (config.intrinsic !== null) {
    return [
      {
        type: "Identifier",
        name: INTRINSIC,
      },
      {
        type: "Identifier",
        name: config.intrinsic,
      },
    ];
  } else {
    return [
      {
        type: "Identifier",
        name: INTRINSIC,
      },
      generateIntrinsicRecord(config),
    ];
  }
};

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 * ) => estree.Expression}
 */
export const makeInternalIntrinsicExpression = (intrinsic) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: {
    type: "Identifier",
    name: INTRINSIC,
  },
  property: {
    type: "Literal",
    value: intrinsic,
  },
});

/**
 * @type {(
 *   intrinsic: import("../../type/aran").RegularIntrinsic,
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
export const makeExternalIntrinsicExpression = (intrinsic, config) => {
  if (config.intrinsic !== null) {
    return {
      type: "MemberExpression",
      optional: false,
      computed: true,
      object: {
        type: "Identifier",
        name: config.intrinsic,
      },
      property: {
        type: "Literal",
        value: intrinsic,
      },
    };
  } else {
    const [object, ...keys] = apply(split, intrinsic, DOT);
    return reduce(keys, member, {
      type: "Identifier",
      name: object,
    });
  }
};

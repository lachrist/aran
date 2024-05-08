import { AranTypeError } from "../error.mjs";
import { generateIntrinsicRecord } from "../setup.mjs";
import { mangleExternalIntrinsic, mangleIntrinsic } from "./mangle.mjs";

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
export const makeIntrinsicValue = (config) => {
  switch (config.mode) {
    case "normal": {
      return mangleExternalIntrinsic(config.intrinsic_variable);
    }
    case "standalone": {
      return generateIntrinsicRecord(config);
    }
    default: {
      throw new AranTypeError(config.mode);
    }
  }
};

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const makeIntrinsicDeclarator = (config) => ({
  type: "VariableDeclaration",
  kind: "const",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleIntrinsic(config),
      init: makeIntrinsicValue(config),
    },
  ],
});

/**
 * @type {(
 *   intrinsic: aran.Intrinsic,
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
export const makeIntrinsicExpression = (intrinsic, config) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: mangleIntrinsic(config),
  property: {
    type: "Literal",
    value: intrinsic,
  },
});

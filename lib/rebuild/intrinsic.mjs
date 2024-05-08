import { generateIntrinsicRecord } from "../setup.mjs";
import { mangleExternalIntrinsic, mangleIntrinsic } from "./mangle.mjs";

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
export const makeIntrinsicValue = (config) => {
  if (config.intrinsic_variable !== null) {
    return mangleExternalIntrinsic(config.intrinsic_variable);
  } else {
    return generateIntrinsicRecord(config);
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

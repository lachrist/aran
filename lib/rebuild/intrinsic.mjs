import { generateIntrinsicRecord } from "../setup.mjs";
import { mangleExternalIntrinsic, mangleIntrinsic } from "./mangle.mjs";

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ]}
 */
export const makeIntrinsicDeclarator = (config) => {
  if (config.intrinsic_variable !== null) {
    return [
      mangleIntrinsic(config),
      mangleExternalIntrinsic(config.intrinsic_variable),
    ];
  } else {
    return [mangleIntrinsic(config), generateIntrinsicRecord(config)];
  }
};

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

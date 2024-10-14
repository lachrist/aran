import { AranTypeError } from "../report.mjs";
import { generateIntrinsicRecord } from "../setup.mjs";
import { makeSimpleLiteral } from "./literal.mjs";
import { mangleExternalIntrinsic, mangleIntrinsic } from "./mangle.mjs";

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Expression<{}>}
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
 * ) => import("estree-sentry").Statement<{}>}
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
 *   intrinsic: import("../lang/syntax").Intrinsic,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const makeIntrinsicExpression = (intrinsic, config) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: mangleIntrinsic(config),
  property: makeSimpleLiteral(intrinsic),
});

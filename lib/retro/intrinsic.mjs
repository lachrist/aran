import { AranTypeError } from "../error.mjs";
import { generateIntrinsicRecord } from "../setup.mjs";
import { makeSimpleLiteral } from "./literal.mjs";
import { mangleIntrinsic } from "./mangle.mjs";

/**
 * @type {(
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const makeIntrinsicValue = (config) => {
  switch (config.mode) {
    case "normal": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: {
          type: "Identifier",
          name: config.global_object_variable,
        },
        property: {
          type: "Literal",
          raw: null,
          bigint: null,
          regex: null,
          value: config.intrinsic_global_variable,
        },
      };
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
 *   config: import("./config-internal").InternalConfig,
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
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const makeIntrinsicExpression = (intrinsic, config) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: mangleIntrinsic(config),
  property: makeSimpleLiteral(intrinsic),
});

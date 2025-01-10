const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
} = globalThis;

/**
 * @type {(
 *  target: import("estree-sentry").VariableName,
 *  config: import("./config").InternalConfig,
 * ) => null | import("../error").ClashErrorCause}
 */
export const checkClash = (target, { intrinsic_variable, escape_prefix }) => {
  if (target === intrinsic_variable) {
    return {
      name: "intrinsic_variable",
      base: target,
      meta: intrinsic_variable,
    };
  }
  if (apply(startsWith, target, [escape_prefix])) {
    return {
      name: "escape_prefix",
      base: target,
      meta: escape_prefix,
    };
  }
  return null;
};

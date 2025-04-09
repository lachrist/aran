const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
} = globalThis;

/**
 * @type {(
 *  target: import("estree-sentry").VariableName,
 *  config: import("./config-internal.d.ts").InternalConfig,
 * ) => null | import("../error.d.ts").ClashErrorCause}
 */
export const checkClash = (
  target,
  { intrinsic_global_variable, escape_prefix },
) => {
  if (target === intrinsic_global_variable) {
    return {
      type: "exact",
      conf: "intrinsic_variable",
      variable: target,
    };
  }
  if (apply(startsWith, target, [escape_prefix])) {
    return {
      type: "prefix",
      conf: "escape_prefix",
      variable: target,
      prefix: escape_prefix,
    };
  }
  return null;
};

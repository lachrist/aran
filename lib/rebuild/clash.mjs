const {
  Reflect: { apply },
  String: {
    prototype: { startsWith },
  },
} = globalThis;

/**
 * @type {(
 *  target: import("estree-sentry").VariableName,
 *  config: import("./config").Config,
 * ) => null | import("../report").VariableClash}
 */
export const checkClash = (
  target,
  { advice_variable, intrinsic_variable, escape_prefix },
) => {
  if (target === advice_variable) {
    return {
      name: "advice_variable",
      base: target,
      meta: advice_variable,
    };
  }
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

import type { VariableName } from "estree-sentry";

/**
 * Configuration object for `setup`.
 */
export type GenericConfig<V extends string> = {
  /**
   * The global variable that refer to the global object. Only change this if
   * `globalThis` do not refer to the global object for some reason.
   * @defaultValue `"globalThis"`
   */
  global_variable: V;
  /**
   * The global variable for holding the intrinsic record.
   * @defaultValue `"_ARAN_INTRINSIC_"`
   */
  intrinsic_variable: V;
};

export type InternalConfig = GenericConfig<VariableName>;

export type ExternalConfig = GenericConfig<string>;

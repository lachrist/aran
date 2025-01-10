import type { VariableName } from "estree-sentry";

/**
 * Configuration object for `retropile`.
 */
export type Config<V extends string> = {
  /**
   * Indicates whether or not the setup code should be bundle with the
   * instrumented code. The setup code is generated by `generateSetup` and
   * simply defines a global variable that holds all the intrinsic values used
   * by Aran.
   * - `"normal"`: Do not bundle the setup code with the instrumented code.
   *   Setup code is expected to have been executed once before any instrumented
   *   code. This is the mode you should use for real-world use cases.
   * - `"standalone"`: Bundle the setup code with the instrumented code. It does
   *   no longer require prior execution of the setup code but multiple
   *   instrumented code will interact well. This is the mode you should use to
   *   investigate and share standalone instrumented snippets.
   * @defaultValue `"normal"`
   */
  mode: "normal" | "standalone";
  /**
   * The global variable that refer to the global object. This is only used when
   * `mode` is `"standalone"`. Change this value only if `globalThis` do not
   * refer to the global object for some reason.
   * @defaultValue `"globalThis"`
   */
  global_variable: V;
  /**
   * The global variable that refers to the intrinsic object defined by the
   * setup code. Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_INTRINSIC_"`
   */
  intrinsic_variable: V;
  /**
   * Internal variables are prefixed with this string to avoid clashing with
   * external variables.
   * @defaultValue `"_aran_"`
   */
  escape_prefix: V;
};

export type InternalConfig = Config<VariableName>;

export type ExternalConfig = Config<string>;

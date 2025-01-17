import type { Json } from "../util/util";
import type { ArgAtom } from "./atom";
import type { Pointcut as StandardPointcut } from "./standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./flexible/aspect";
import type { VariableName } from "estree-sentry";
import type { Atom } from "../lang/syntax";

/**
 * Configuration object for both standard and flexible weaving.
 */
export type Config<
  atom extends Atom = Atom,
  global_variable extends string = string,
> = {
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_variable: global_variable;
  /**
   * The initial state passed to advice functions. It will be cloned with JSON
   * serialization.
   * @defaultValue `null`
   */
  initial_state: Json;
  /**
   * The pointcut for the standard weaving API. Either `standard_pointcut` or
   * `flexible_pointcut` should be defined but not both.
   * @defaultValue `null`
   */
  standard_pointcut: null | StandardPointcut<atom>;
  /**
   * The pointcut for the flexible weaving API. Either `standard_pointcut` or
   * `flexible_pointcut` should be defined but not both.
   * @defaultValue `null`
   */
  flexible_pointcut: null | FlexiblePointcut<atom, global_variable>;
};

export type InternalConfig = Config<ArgAtom, VariableName>;

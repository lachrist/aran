import type { Json } from "../util/util";
import type { ArgAtom, Tag } from "./atom";
import type { Pointcut as StandardPointcut } from "./standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./flexible/aspect";
import type { VariableName } from "estree-sentry";
import type { Atom } from "../lang/syntax";

/**
 * Configuration object for both standard and flexible weaving.
 */
export type Config<
  V extends string,
  T extends Json,
  A extends Atom & { Tag: T },
> = {
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_variable: V;
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
  standard_pointcut: null | StandardPointcut<T>;
  /**
   * The pointcut for the flexible weaving API. Either `standard_pointcut` or
   * `flexible_pointcut` should be defined but not both.
   * @defaultValue `null`
   */
  flexible_pointcut: null | FlexiblePointcut<A>;
};

export type InternalConfig = Config<VariableName, Tag, ArgAtom>;

export type ExternalConfig<
  T extends Json,
  A extends Atom & { Tag: T },
> = Config<VariableName, T, A>;

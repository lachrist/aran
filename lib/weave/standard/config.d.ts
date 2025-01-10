import type { VariableName } from "estree-sentry";
import type { Pointcut } from "./aspect";
import type { Json } from "../../util/util";
import type { Tag } from "../atom";

/**
 * Configuration object for standard weaving.
 */
export type Config<T extends Json, V extends string> = {
  /**
   * The initial state passed to advice functions. It will be cloned with JSON
   * serialization.
   * @defaultValue `null`
   */
  initial_state: Json;
  /**
   * The pointcut for the standard weaving API.
   * @defaultValue `false`
   */
  pointcut: Pointcut<T>;
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_variable: V;
};

export type InternalConfig = Config<Tag, VariableName>;

export type ExternalConfig<T extends Json> = Config<T, string>;

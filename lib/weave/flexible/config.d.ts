import type { Pointcut } from "./aspect";
import type { Json } from "../../util/util";
import type { Atom } from "../../lang/syntax";

/**
 * Configuration object for both flexible weaving.
 */
export type Config<
  atom extends Atom = Atom,
  global_property_key extends string = string,
> = {
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
  pointcut: Pointcut<atom, global_property_key>;
};

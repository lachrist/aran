import type { Pointcut } from "./aspect";
import type { Json } from "../../util/util";
import type { ArgAtom } from "../atom";
import type { Atom } from "../../lang/syntax";

/**
 * Configuration object for both flexible weaving.
 */
export type Config<A extends Atom> = {
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
  pointcut: Pointcut<A>;
};

export type InternalConfig = Config<ArgAtom>;

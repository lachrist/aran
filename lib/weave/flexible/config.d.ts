import type { Pointcut } from "./aspect";
import type { GetDefault, Json } from "../../util/util";
import type { Atom } from "../../lang/syntax";

/**
 * Configuration object for both flexible weaving.
 */
export type Config<
  param extends Partial<Atom> & {
    Point?: Json[];
    InitialState?: Json;
    AdviceGlobalVariable?: string;
  } = {},
> = {
  /**
   * The initial state passed to advice functions. It will be cloned with JSON.
   * @defaultValue `null`
   */
  initial_state: GetDefault<param, "InitialState", Json>;
  /**
   * The pointcut for the standard weaving API.
   * @defaultValue `false`
   */
  pointcut: Pointcut<param>;
};

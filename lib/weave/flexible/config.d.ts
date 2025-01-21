import type { Pointcut } from "./aspect";
import type { Json } from "../../util/util";
import type { Atom } from "../../lang/syntax";

/**
 * Configuration object for both flexible weaving.
 */
export type Config<
  state extends Json = Json,
  atom extends Atom = Atom,
  javascript_identifier extends string = string,
  point extends Json[] = Json[],
> = {
  /**
   * The initial state passed to advice functions. It will be cloned with JSON
   * serialization.
   * @defaultValue `null`
   */
  initial_state: state;
  /**
   * The pointcut for the standard weaving API.
   * @defaultValue `false`
   */
  pointcut: Pointcut<atom, point, javascript_identifier>;
};

import type { Pointcut } from "./aspect";
import type { Json } from "../../util/util";
import type { Atom } from "../../lang/syntax";

/**
 * Configuration object for both flexible weaving.
 */
export type Config<
  point extends Json[] = Json[],
  state extends Json = Json,
  atom extends Atom = Atom,
  javascript_identifier extends string = string,
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
  pointcut: Pointcut<point, atom, javascript_identifier>;
};

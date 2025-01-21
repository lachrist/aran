import type { Pointcut } from "./aspect";
import type { Json } from "../../util/util";
import type { Atom } from "../../lang/syntax";

type SerialAtom = Atom & { Tag: Json };

/**
 * Configuration object for standard weaving.
 */
export type Config<
  state extends Json = Json,
  atom extends SerialAtom = SerialAtom,
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
  pointcut: Pointcut<atom>;
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_global_variable: javascript_identifier;
};

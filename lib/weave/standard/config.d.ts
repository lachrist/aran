import type { Pointcut } from "./aspect";
import type { Json } from "../../util/util";
import type { Atom } from "../../lang/syntax";

type SerialAtom = Atom & { Tag: Json };

/**
 * Configuration object for standard weaving.
 */
export type Config<
  atom extends SerialAtom = SerialAtom,
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
  pointcut: Pointcut<atom>;
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_global_variable: global_property_key;
};

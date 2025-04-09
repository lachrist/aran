import type { Pointcut } from "./aspect.d.ts";
import type { GetDefault, Json } from "../../util/util.d.ts";
import type { Atom } from "../../lang/syntax.d.ts";

/**
 * Configuration object for standard weaving.
 */
export type Config<
  param extends Partial<Atom> & {
    AdviceGlobalVariable?: string;
    InitialState?: Json;
    Tag?: Json;
  } = {},
> = {
  /**
   * The initial state passed to the `program-block@setup` advice function. It
   * will be cloned with JSON serialization.
   * @defaultValue `null`
   */
  initial_state: GetDefault<param, "InitialState", Json>;
  /**
   * The pointcut for the standard weaving API.
   * @defaultValue `false`
   */
  pointcut: Pointcut<param>;
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_global_variable: GetDefault<param, "AdviceGlobalVariable", string>;
};

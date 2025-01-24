import type { Pointcut } from "./aspect";
import type { GetDefault, Json } from "../../util/util";
import type { Atom } from "../../lang/syntax";

/**
 * Configuration object for standard weaving.
 */
export type Config<
  param extends {
    AdviceGlobalVariable?: string;
    InitialState?: Json;
    Atom?: Atom & { Tag: Json };
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
  pointcut: Pointcut<GetDefault<param, "Atom", Atom & { Tag: string }>>;
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_global_variable: param["AdviceGlobalVariable"] & string;
};

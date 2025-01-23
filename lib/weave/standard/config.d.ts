import type { Pointcut } from "./aspect";
import type { Json } from "../../util/util";
import type { Atom } from "../../lang/syntax";

export type ConfigParam = Atom & {
  InitialState: Json;
  Tag: Json;
  JavaScriptIdentifier: string;
};

/**
 * Configuration object for standard weaving.
 */
export type Config<param extends ConfigParam = ConfigParam> = {
  /**
   * The initial state passed to the `program-block@setup` advice function. It
   * will be cloned with JSON serialization.
   * @defaultValue `null`
   */
  initial_state: param["InitialState"];
  /**
   * The pointcut for the standard weaving API.
   * @defaultValue `false`
   */
  pointcut: Pointcut<Pick<param, keyof Atom>>;
  /**
   * The global variable that refers to the advice object for standard weaving.
   * Make sure it does not clash with other global variables.
   * @defaultValue `"_ARAN_ADVICE_"`
   */
  advice_global_variable: param["JavaScriptIdentifier"];
};

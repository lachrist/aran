import type { Config as TransConfig } from "./trans/config.d.ts";
import type { Config as RetroConfig } from "./retro/config.d.ts";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect.d.ts";
import type { Atom } from "./lang/syntax.d.ts";
import type { GetDefault, Json } from "./util/util.d.ts";

export type Config<
  param extends Partial<Atom> & {
    FilePath?: unknown;
    NodeHash?: string | number;
    InitialState?: Json;
    AdviceGlobalVariable?: string;
    JavaScriptIdentifier?: string;
  },
> = TransConfig<param> &
  RetroConfig<param> & {
    /**
     * The global variable that refers to the advice object for standard weaving.
     * Make sure it does not clash with other global variables.
     * @defaultValue `"_ARAN_ADVICE_"`
     */
    advice_global_variable: GetDefault<param, "AdviceGlobalVariable", string>;
    /**
     * The initial state passed to advice functions. It will be cloned with JSON
     * serialization.
     * @defaultValue `null`
     */
    initial_state: GetDefault<param, "InitialState", Json>;
    /**
     * The pointcut for the standard weaving API.
     * @defaultValue `[]`
     */
    pointcut: StandardPointcut<param>;
  };

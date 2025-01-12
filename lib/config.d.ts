import type { Json } from "./util/util";
import type { Config as TransConfig } from "./trans/config";
import type { Config as RetroConfig } from "./retro/config";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./weave/flexible/aspect";
import type { Atom } from "./lang/syntax";

export type StandardConfig<P, H extends string | number> = TransConfig<P, H> &
  RetroConfig<string> & {
    /**
     * The global variable that refers to the advice object for standard weaving.
     * Make sure it does not clash with other global variables.
     * @defaultValue `"_ARAN_ADVICE_"`
     */
    advice_variable: string;
    /**
     * The initial state passed to advice functions. It will be cloned with JSON
     * serialization.
     * @defaultValue `null`
     */
    initial_state: Json;
    /**
     * The pointcut for the standard weaving API. Either `standard_pointcut` or
     * `flexible_pointcut` should be defined but not both.
     * @defaultValue `false`
     */
    pointcut: StandardPointcut<H>;
  };

export type FlexibleConfig<
  P,
  H extends string | number,
  A extends Atom & { Tag: H },
> = TransConfig<P, H> &
  RetroConfig<string> & {
    /**
     * The initial state passed to advice functions. It will be cloned with JSON
     * serialization.
     * @defaultValue `null`
     */
    initial_state: Json;
    /**
     * The pointcut for the flexible weaving API. Either `standard_pointcut` or
     * `flexible_pointcut` should be defined but not both.
     * @defaultValue `false`
     */
    pointcut: FlexiblePointcut<A>;
  };

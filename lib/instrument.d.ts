import type { Json } from "./util/util";
import type { Config as TransConfig } from "./trans/config";
import type { Config as RetroConfig } from "./retro/config";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./weave/flexible/aspect";
import type { Atom } from "./lang/syntax";

export type Config<
  state extends Json = Json,
  atom extends Atom = Atom,
  hash extends string | number = string,
  javascript_identifier extends string = string,
  global_property_key extends string = string,
  path = string,
> = TransConfig<hash, path> &
  RetroConfig<javascript_identifier, global_property_key> & {
    /**
     * The global variable that refers to the advice object for standard weaving.
     * Make sure it does not clash with other global variables.
     * @defaultValue `"_ARAN_ADVICE_"`
     */
    advice_global_variable: global_property_key;
    /**
     * The initial state passed to advice functions. It will be cloned with JSON
     * serialization.
     * @defaultValue `null`
     */
    initial_state: state;
    /**
     * The pointcut for the standard weaving API. Either `standard_pointcut` or
     * `flexible_pointcut` should be defined but not both.
     * @defaultValue `null`
     */
    standard_pointcut: null | StandardPointcut<atom>;
    /**
     * The pointcut for the flexible weaving API. Either `standard_pointcut` or
     * `flexible_pointcut` should be defined but not both.
     * @defaultValue `null`
     */
    flexible_pointcut: null | FlexiblePointcut<atom, global_property_key>;
  };

type HashAtom = Atom & { Tag: string | number };

export type ExternalConfig<
  state extends Json = Json,
  atom extends HashAtom = HashAtom,
  javascript_identifier extends string = string,
  global_property_key extends string = string,
  path = string,
> = Config<
  state,
  atom,
  atom["Tag"],
  javascript_identifier,
  global_property_key,
  path
>;

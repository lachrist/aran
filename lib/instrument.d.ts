import type { Json } from "./util/util";
import type { Config as TransConfig } from "./trans/config";
import type { Config as RetroConfig } from "./retro/config";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Atom } from "./lang/syntax";

export type GenericConfig<
  state extends Json = Json,
  atom extends Atom = Atom,
  hash extends string | number = string,
  javascript_identifier extends string = string,
  path = string,
> = TransConfig<hash, path> &
  RetroConfig<javascript_identifier> & {
    /**
     * The global variable that refers to the advice object for standard weaving.
     * Make sure it does not clash with other global variables.
     * @defaultValue `"_ARAN_ADVICE_"`
     */
    advice_global_variable: javascript_identifier;
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
    pointcut: null | StandardPointcut<atom>;
  };

type HashAtom = Atom & { Tag: string | number };

export type Config<
  state extends Json = Json,
  atom extends HashAtom = HashAtom,
  javascript_identifier extends string = string,
  path = string,
> = GenericConfig<state, atom, atom["Tag"], javascript_identifier, path>;

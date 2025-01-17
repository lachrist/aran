import type { Json } from "./util/util";
import type { Config as TransConfig } from "./trans/config";
import type { Config as RetroConfig } from "./retro/config";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./weave/flexible/aspect";
import type { Atom } from "./lang/syntax";
import type { VariableName } from "estree-sentry";
import type { ArgAtom } from "./weave/atom";
import type { FilePath, Hash } from "./trans/hash";

export type Config<
  atom extends Atom,
  hash extends string | number,
  global_variable extends string,
  file_path,
> = TransConfig<file_path, hash> &
  RetroConfig<global_variable> & {
    /**
     * The global variable that refers to the advice object for standard weaving.
     * Make sure it does not clash with other global variables.
     * @defaultValue `"_ARAN_ADVICE_"`
     */
    advice_variable: global_variable;
    /**
     * The initial state passed to advice functions. It will be cloned with JSON
     * serialization.
     * @defaultValue `null`
     */
    initial_state: Json;
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
    flexible_pointcut: null | FlexiblePointcut<atom, global_variable>;
  };

export type InternalConfig = Config<ArgAtom, Hash, VariableName, FilePath>;

type HashAtom = Atom & { Tag: string | number };

export type ExternalConfig<
  atom extends HashAtom = HashAtom,
  global_variable extends string = string,
  file_path = unknown,
> = Config<atom, atom["Tag"], global_variable, file_path>;

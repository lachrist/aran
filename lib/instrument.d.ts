import type { Json } from "./util/util";
import type { VariableName } from "estree-sentry";
import type { Config as TransConfig } from "./unbuild/config";
import type { Config as RetroConfig } from "./rebuild/config";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./weave/flexible/aspect";
import type { Atom } from "./lang/syntax";
import type { FilePath, Hash } from "./unbuild/hash";
import type { ArgAtom, Tag } from "./weave/atom";

export type Config<
  V extends string,
  P,
  H extends string | number,
  T extends Json,
  A extends Atom,
> = TransConfig<P, H> &
  RetroConfig<V> & {
    /**
     * The global variable that refers to the advice object for standard weaving.
     * Make sure it does not clash with other global variables.
     * @defaultValue `"_ARAN_ADVICE_"`
     */
    advice_variable: V;
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
    standard_pointcut: null | StandardPointcut<T>;
    /**
     * The pointcut for the flexible weaving API. Either `standard_pointcut` or
     * `flexible_pointcut` should be defined but not both.
     * @defaultValue `null`
     */
    flexible_pointcut: null | FlexiblePointcut<A>;
  };

export type ExternalConfig<
  P,
  H extends string | number,
  A extends Atom & { Tag: H },
> = Config<VariableName, P, H, H, A>;

export type InternalConfig = Config<VariableName, FilePath, Hash, Tag, ArgAtom>;

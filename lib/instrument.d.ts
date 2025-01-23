import type { Json } from "./util/util";
import type {
  Config as TransConfig,
  ConfigParam as TransConfigParam,
} from "./trans/config";
import type {
  Config as RetroConfig,
  ConfigParam as RetroConfigParam,
} from "./retro/config";
import type { Pointcut as StandardPointcut } from "./weave/standard/aspect";
import type { Atom } from "./lang/syntax";

export type ConfigParam = Atom & {
  InitialState: Json;
  JavaScriptIdentifier: string;
  NodeHash: string | number;
  FilePath: unknown;
};

export type DefaultConfigParam = Atom & {
  InitialState: Json;
  JavaScriptIdentifier: string;
  NodeHash: string;
  FilePath: string;
};

export type Config<param extends ConfigParam = DefaultConfigParam> =
  TransConfig<Pick<param, keyof TransConfigParam>> &
    RetroConfig<Pick<param, keyof RetroConfigParam>> & {
      /**
       * The global variable that refers to the advice object for standard weaving.
       * Make sure it does not clash with other global variables.
       * @defaultValue `"_ARAN_ADVICE_"`
       */
      advice_global_variable: param["JavaScriptIdentifier"];
      /**
       * The initial state passed to advice functions. It will be cloned with JSON
       * serialization.
       * @defaultValue `null`
       */
      initial_state: param["InitialState"];
      /**
       * The pointcut for the standard weaving API. Either `standard_pointcut` or
       * `flexible_pointcut` should be defined but not both.
       * @defaultValue `null`
       */
      pointcut: null | StandardPointcut<Pick<param, keyof Atom>>;
    };

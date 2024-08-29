import type { Context } from "node:vm";
import type {
  DeepLocalSitu,
  FlexibleAspect,
  FlexiblePointcut,
  IntrinsicRecord,
  Json,
  Path,
  StandardAspect,
  StandardPointcut,
} from "../../../lib";
import type { Instrument } from "../stage";

export type InstrumentRoot = Instrument;

export type InstrumentDeep = (
  code: string,
  path: Path,
  situ: DeepLocalSitu,
) => string;

export type Aspect<state extends Json, V> =
  | {
      type: "standard";
      data: StandardAspect<
        state,
        {
          Scope: V;
          Stack: V;
          Other: V;
        }
      >;
    }
  | {
      type: "flexible";
      data: FlexibleAspect<state, V>;
    };

export type MakeAspect<S extends Json, V> = (
  intrinsics: IntrinsicRecord,
  membrane: {
    instrument: InstrumentDeep;
    apply:
      | null
      | ((callee: unknown, self: unknown, input: unknown[]) => unknown);
    construct: null | ((callee: unknown, input: unknown[]) => unknown);
  },
) => Aspect<S, V>;

export type SetupConfig<S extends Json> = {
  context: Context;
  record: Instrument;
  report: (error: Error) => void;
  warning: "console" | "ignore";
  global_declarative_record: "emulate" | "builtin";
  initial_state: S;
};

export type Pointcut =
  | {
      standard_pointcut: StandardPointcut;
    }
  | {
      flexible_pointcut: FlexiblePointcut;
    };

export type SetupAran = <S extends Json, V>(
  makeAspect: MakeAspect<S, V>,
  config: SetupConfig<S>,
) => InstrumentRoot;

export type PartialAranConfig = {
  standard_pointcut: StandardPointcut | null;
  flexible_pointcut: FlexiblePointcut | null;
  warning: "console" | "ignore";
  global_declarative_record: "emulate" | "builtin";
  initial_state: Json;
};

export type Config<G> = {
  record: Instrument;
  config: PartialAranConfig;
  globals: G;
};

export type BasicConfig = Config<{}>;

export type WeaveConfig = Config<{
  evalScript: (code: string) => unknown;
  evalGlobal: (code: string) => unknown;
  Function: FunctionConstructor;
  apply: (callee: unknown, self: unknown, input: unknown[]) => unknown;
  construct: (callee: unknown, input: unknown[]) => unknown;
}>;

export type PatchConfig = Config<{
  evalScript: (code: string) => unknown;
  evalGlobal: (code: string) => unknown;
}>;

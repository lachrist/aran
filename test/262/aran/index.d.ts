import type { Context } from "node:vm";
import type {
  DeepLocalContext,
  FlexibleAspect,
  FlexiblePointcut,
  IntrinsicRecord,
  Json,
  Path,
  StandardAspect,
  StandardPointcut,
} from "../../../lib";
import type { Instrument } from "../types";

export type InstrumentRoot = Instrument;

export type InstrumentDeep = (
  code: string,
  path: Path,
  context: DeepLocalContext,
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

export type Pointcut =
  | {
      type: "standard";
      data: StandardPointcut;
    }
  | {
      type: "flexible";
      data: FlexiblePointcut;
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
  initial: S;
};

export type SetupAran = <S extends Json, V>(
  makeAspect: MakeAspect<S, V>,
  config: SetupConfig<S>,
) => InstrumentRoot;

export type PartialAranConfig = {
  pointcut: Pointcut;
  warning: "console" | "ignore";
  global_declarative_record: "emulate" | "builtin";
  initial: Json;
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
}>;

export type PatchConfig = Config<{
  evalScript: (code: string) => unknown;
  evalGlobal: (code: string) => unknown;
}>;

import type { Context } from "node:vm";
import type {
  DeepLocalContext,
  FlexibleAspect,
  FlexiblePointcut,
  Json,
  Path,
  StandardAdvice,
  StandardAspect,
  StandardPointcut,
  Valuation,
} from "../../../../lib";
import type { Instrument } from "../../types";

export type InstrumentRoot = Instrument;

export type InstrumentDeep = (source: {
  code: unknown;
  path: Path;
  context: DeepLocalContext;
}) => string | unknown;

export type Aspect<state extends Json> =
  | {
      type: "standard";
      data: StandardAspect<
        state,
        {
          Scope: unknown;
          Stack: unknown;
          Other: unknown;
        }
      >;
    }
  | {
      type: "flexible";
      data: FlexibleAspect<state, unknown>;
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

export type SetupConfig<S extends Json> = {
  context: Context;
  record: Instrument;
  warning: "console" | "ignore";
  global_declarative_record: "emulate" | "builtin";
  initial: S;
  aspect: Aspect<S>;
};

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

export type BasicMembrane = {
  instrumentRoot: InstrumentRoot;
  instrumentDeep: InstrumentDeep;
};

export type WeaveMembrane = {
  instrumentRoot: InstrumentRoot;
  instrumentDeep: InstrumentDeep;
  apply: (call: {
    callee: unknown;
    self: unknown;
    input: unknown[];
  }) => unknown;
  construct: (call: { callee: unknown; input: unknown[] }) => unknown;
};

export type PatchMembrane = {
  instrumentRoot: InstrumentRoot;
  instrumentDeep: InstrumentDeep;
};

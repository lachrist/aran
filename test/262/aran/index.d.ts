import type { Context } from "node:vm";
import type {
  DeepLocalSitu,
  Json,
  Path,
  StandardPointcut,
  FlexiblePointcut,
} from "../../../lib";
import type { Instrument } from "../stage";

export type InstrumentRoot = Instrument;

export type InstrumentDeep = (
  code: string,
  path: Path,
  situ: DeepLocalSitu,
) => string;

export type SetupConfig = {
  record: Instrument;
  report: (error: Error) => void;
  context: Context;
  flexible_pointcut: FlexiblePointcut | null;
  standard_pointcut: StandardPointcut | null;
  warning: "console" | "ignore";
  global_declarative_record: "emulate" | "builtin";
  initial_state: Json;
};

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

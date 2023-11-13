import type { EvalContext } from "../lib/unbuild/context.d.ts";
import type {
  AlienLocalProgram,
  GlobalProgram,
  ReifyLocalProgram,
} from "../lib/unbuild/program.js";
import type { Pointcut } from "./advice.js";

export type Base = Brand<string, "options.Base">;

export type AdviceKind = "function" | "object";

export type Advice = {
  kind: AdviceKind;
  variable: estree.Variable;
};

export type Locate<L> = (path: weave.OriginPath, base: Base) => L;

//////////////////////
// Internal Options //
//////////////////////

type CommonOptions<L> = {
  locate: Locate<L>;
  pointcut: Pointcut<L>;
  advice: Advice;
  intrinsic: estree.Variable;
  escape: estree.Variable;
  base: Base;
};

type GlobalOptions<L> = CommonOptions<L> &
  GlobalProgram & {
    mode: "sloppy";
    context: null;
  };

type AlienLocalOptions<L> = CommonOptions<L> &
  AlienLocalProgram & {
    mode: "strict" | "sloppy";
    context: null;
  };

type ReifyLocalOptions<L> = CommonOptions<L> &
  ReifyLocalProgram & {
    mode: null;
    context: EvalContext;
  };

export type RootOptions<L> = GlobalOptions<L> | AlienLocalOptions<L>;

export type NodeOptions<L> = ReifyLocalOptions<L>;

export type Options<L> = RootOptions<L> | NodeOptions<L>;

//////////////////////
// External Options //
//////////////////////

type CommonUserOptions<L> = {
  locate?: Locate<L>;
  pointcut?: Pointcut<L>;
  advice?: Advice;
  intrinsic?: estree.Variable;
  escape?: estree.Variable;
  base?: Base;
};

type GlobalUserOptions<L> = CommonUserOptions<L> & {
  kind?: "module" | "script" | "eval";
  situ?: "global";
  plug?: "reify" | "alien";
  mode?: "sloppy";
  context?: null;
};

type AlienLocalUserOptions<L> = CommonUserOptions<L> & {
  kind?: "eval";
  situ?: "local";
  plug?: "alien";
  mode?: "strict" | "sloppy";
  context?: null;
};

type ReifyLocalUserOptions<L> = CommonUserOptions<L> & {
  kind?: "eval";
  situ?: "local";
  plug?: "reify";
  mode?: null;
  context: EvalContext;
};

type RootUserOptions<L> = GlobalUserOptions<L> | AlienLocalUserOptions<L>;

type NodeUserOptions<L> = ReifyLocalUserOptions<L>;

export type UserOptions<L> = RootUserOptions<L> | NodeUserOptions<L>;

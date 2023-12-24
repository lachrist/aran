import type { Pointcut } from "./advice.js";

export type Base = Brand<string, "options.Base">;

export type Locate<L> = (path: weave.OriginPath, base: Base) => L;

export type Log = unbuild.Log | rebuild.Log;

export type Warning = Exclude<Log, { name: "ClashError" | "SyntaxError" }>;

//////////////////////
// Internal Options //
//////////////////////

type CommonOptions<L> = {
  locate: Locate<L>;
  pointcut: Pointcut<L>;
  advice: estree.Variable;
  intrinsic: estree.Variable;
  escape: estree.Variable;
  exec: estree.Variable | null;
  base: Base;
  warning: "console" | "silent";
  error: "throw" | "embed";
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

export type UserOptions<L> =
  | null
  | undefined
  | {
      [k in keyof Options<L>]?: Options<L>[k];
    };

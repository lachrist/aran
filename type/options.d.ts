import type { EvalContext } from "../lib/unbuild/context.d.ts";
import type {
  AlienLocalProgram,
  GlobalProgram,
  ReifyLocalProgram,
} from "../lib/unbuild/program.js";
import type { Pointcut } from "./advice.js";

export type Base = Brand<string, "options.Base">;

export type Locate<L> = (path: weave.OriginPath, base: Base) => L;

//////////////////////
// Internal Options //
//////////////////////

type CommonOptions<L> = {
  locate: Locate<L>;
  pointcut: Pointcut<L>;
  advice: estree.Variable;
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

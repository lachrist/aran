import { NodeSitu, RootSitu } from "../lib/situ.js";
import { Context } from "../lib/unbuild/context.js";
import { Log as UnbuildLog } from "../lib/unbuild/log";
import type { Pointcut } from "./advice.js";

export type Base = Brand<string, "Base">;

export type Locate<L> = (path: weave.OriginPath, base: Base) => L;

//////////////////////
// Internal Options //
//////////////////////

type Common<L> = {
  locate: Locate<L>;
  pointcut: Pointcut<L>;
  advice: estree.Variable;
  intrinsic: estree.Variable;
  escape: estree.Variable;
  base: Base;
};

export type RootOptions<L> = RootSitu &
  Common<L> & {
    context: null;
  };

export type NodeOptions<L> = NodeSitu &
  Common<L> & {
    context: Context;
  };

export type Options<L> = RootOptions<L> | NodeOptions<L>;

export type PartialOptions<L> =
  | null
  | undefined
  | {
      [k in keyof Options<L>]?: Options<L>[k];
    };

export type RootArgv<L> = Common<L> & {
  situ: RootSitu;
  context: null;
};

export type NodeArgv<L> = Common<L> & {
  situ: NodeSitu;
  context: Context;
};

export type Argv<L> = RootArgv<L> | NodeArgv<L>;

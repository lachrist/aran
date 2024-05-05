import { Context } from "../context";
import { Label, ArgVariable } from "./atom";
import { Frame } from "./frame";

export type Situ = "global" | "local.root" | "local.deep";

export type ProgramKind = "module" | "script" | "eval";

export type ClosureKind = "arrow" | "function";

export type ControlKind =
  | "try"
  | "catch"
  | "finally"
  | "then"
  | "else"
  | "loop"
  | "naked";

export type FrameKind = ProgramKind | ClosureKind | ControlKind;

export type BranchKind =
  | "if"
  | "while"
  | "conditional.effect"
  | "conditional.expression";

type Point<V, L> =
  //////////////
  // Informer //
  //////////////
  // Frame //
  | {
      type: "block.enter";
      frame: Omit<Frame<never>, "record">;
      record: { [key in ArgVariable | aran.Parameter]: V };
      location: L;
    }
  | {
      type: "block.completion";
      frame: Omit<Frame<never>, "record">;
      value: V;
      location: L;
    }
  | {
      type: "block.failure";
      frame: Omit<Frame<never>, "record">;
      value: V;
      location: L;
    }
  | {
      type: "block.leave";
      frame: Omit<Frame<never>, "record">;
      location: L;
    }
  // Debugger //
  | {
      type: "debugger.before";
      location: L;
    }
  | {
      type: "debugger.after";
      location: L;
    }
  // Break //
  | {
      type: "break.before";
      label: Label;
      location: L;
    }
  ///////////////////
  // Pure Producer //
  ///////////////////
  | {
      type: "primitive.after";
      value: null | boolean | number | string | bigint;
      location: L;
    }
  | {
      type: "read.after";
      variable: ArgVariable | aran.Parameter;
      value: V;
      location: L;
    }
  | {
      type: "intrinsic.after";
      name: aran.Intrinsic;
      value: V;
      location: L;
    }
  | {
      type: "import.after";
      source: string;
      specifier: string | null;
      value: V;
      location: L;
    }
  | {
      type: "closure.after";
      kind: "arrow" | "function";
      asynchronous: boolean;
      generator: boolean;
      value: V;
      location: L;
    }
  ////////////////////
  // Pure Consumers //
  ////////////////////
  | {
      type: "return.before";
      value: V;
      location: L;
    }
  | {
      type: "drop.before";
      value: V;
      location: L;
    }
  | {
      type: "export.before";
      specifier: string;
      value: V;
      location: L;
    }
  | {
      type: "write.before";
      variable: ArgVariable | aran.Parameter;
      value: V;
      location: L;
    }
  ////////////////////
  // Before - After //
  ////////////////////
  // Branch //
  | {
      type: "branch.before";
      kind: BranchKind;
      value: V;
      location: L;
    }
  | {
      type: "branch.after";
      kind: BranchKind;
      value: V;
      location: L;
    }
  // Eval //
  | {
      type: "eval.before";
      value: V;
      context: Context;
      location: L;
    }
  | {
      type: "eval.after";
      value: V;
      location: L;
    }
  // Await //
  | {
      type: "await.before";
      value: V;
      location: L;
    }
  | {
      type: "await.after";
      value: V;
      location: L;
    }
  // Yield //
  | {
      type: "yield.before";
      delegate: boolean;
      value: V;
      location: L;
    }
  | {
      type: "yield.after";
      delegate: boolean;
      value: V;
      location: L;
    }
  //////////////
  // Combiner //
  //////////////
  | {
      type: "apply";
      callee: V;
      this: V;
      arguments: V[];
      location: L;
    }
  | {
      type: "construct";
      callee: V;
      arguments: V[];
      location: L;
    };

export type PointName = Point<unknown, unknown>["type"];

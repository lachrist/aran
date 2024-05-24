import { DeepLocalContext } from "../lib/program";
import { Program, Atom, Node } from "./aran";

///////////////////
// Object Format //
///////////////////

export type Point = {
  [K in Node<Atom>["type"]]: Json[];
};

export type Value = {
  Scope: unknown;
  Stack: unknown;
  Enter: unknown;
  Leave: unknown;
};

export type ObjectPointcut<
  P extends Point,
  A extends Atom,
  S extends string,
> = {
  [K in Node<Atom>["type"]]?: (
    node: Node<A> & { type: K },
    path: S,
    root: Program<A>,
  ) => null | {
    point: P[K];
    cut: boolean | ("before" | "after" | "finally" | "catch" | "around")[];
  };
};

export type ObjectAdvice<P extends Point, V extends Value, S extends string> = {
  // Block //
  "ControlBlock.before": <K extends string>(
    frame: { [key in S | aran.Parameter]?: V["Enter"] },
    ...point: P["ControlBlock"]
  ) => { [key in K]?: V["Scope"] };
  "ControlBlock.after": (...point: P["ControlBlock"]) => void;
  "ControlBlock.catch": (
    error: V["Stack"],
    ...point: P["ControlBlock"]
  ) => V["Leave"];
  "ControlBlock.finally": (...point: P["ControlBlock"]) => void;
  "RoutineBlock.before": <K extends string>(
    frame: { [key in S | aran.Parameter]?: V["Enter"] },
    ...point: P["RoutineBlock"]
  ) => { [key in K]?: V["Scope"] };
  "RoutineBlock.after": (
    completion: V["Stack"],
    ...point: P["RoutineBlock"]
  ) => void;
  "RoutineBlock.catch": (
    error: V["Enter"],
    ...point: P["RoutineBlock"]
  ) => V["Leave"];
  "RoutineBlock.finally": (...point: P["RoutineBlock"]) => void;
  // Statement //
  "DebuggerStatement.before": (...point: P["DebuggerStatement"]) => void;
  "DebuggerStatement.after": (...point: P["DebuggerStatement"]) => void;
  "BreakStatement.before": (...point: P["BreakStatement"]) => void;
  "ReturnStatement.before": (...point: P["ReturnStatement"]) => V["Leave"];
  "ReturnStatement.TODO": (
    completion: V["Stack"],
    ...point: P["BreakStatement"]
  ) => V["Leave"];
  "IfStatement.before": (...point: P["IfStatement"]) => boolean;
  "IfStatement.TODO": (test: V["Stack"], ...point: P["IfStatement"]) => boolean;
  "IfStatement.after": (...point: P["IfStatement"]) => void;
  "WhileStatement.before": (...point: P["WhileStatement"]) => boolean;
  "WhileStatement.TODO": (
    test: V["Stack"],
    ...point: P["WhileStatement"]
  ) => boolean;
  "WhileStatement.after": (...point: P["WhileStatement"]) => void;
  "TryStatement.before": (...point: P["TryStatement"]) => void;
  "TryStatement.after": (...point: P["TryStatement"]) => void;
  "BlockStatement.before": (...point: P["BlockStatement"]) => void;
  "BlockStatement.after": (...point: P["BlockStatement"]) => void;
  "EffectStatement.before": (...point: P["EffectStatement"]) => void;
  "EffectStatement.after": (...point: P["EffectStatement"]) => void;
  // Effect //
  "WriteEffect.before": (...point: P["WriteEffect"]) => V["Scope"];
  "WriteEffect.TODO": (
    value: V["Stack"],
    ...point: P["WriteEffect"]
  ) => V["Scope"];
  "WriteEffect.after": (...point: P["WriteEffect"]) => void;
  "ExportEffect.before": (...point: P["ExportEffect"]) => V["Leave"];
  "ExportEffect.TODO": (
    field: V["Stack"],
    ...point: P["ExportEffect"]
  ) => V["Leave"];
  "ExportEffect.after": (...point: P["ExportEffect"]) => void;
  "ExpressionEffect.before": (...point: P["ExpressionEffect"]) => void;
  "ExpressionEffect.TODO": (
    drop: V["Stack"],
    ...point: P["ExpressionEffect"]
  ) => void;
  "ExpressionEffect.after": (...point: P["ExpressionEffect"]) => void;
  "ConditionalEffect.before": (...point: P["ConditionalEffect"]) => boolean;
  "ConditionalEffect.TODO": (
    test: V["Stack"],
    ...point: P["ConditionalEffect"]
  ) => boolean;
  "ConditionalEffect.after": (...point: P["ConditionalEffect"]) => void;
  // Expression //
  "IntrinsicExpression.before": (...point: P["IntrinsicExpression"]) => void;
  "IntrinsicExpression.after": (
    intrinsic: V["Enter"],
    ...point: P["IntrinsicExpression"]
  ) => V["Stack"];
  "PrimitiveExpression.before": (...point: P["PrimitiveExpression"]) => void;
  "PrimitiveExpression.after": (
    primitive: V["Enter"] & (null | boolean | number | string | bigint),
    ...point: P["PrimitiveExpression"]
  ) => V["Stack"];
  "ImportExpression.before": (...point: P["ImportExpression"]) => void;
  "ImportExpression.after": (
    field: V["Enter"],
    ...point: P["ImportExpression"]
  ) => V["Stack"];
  "ReadExpression.before": (...point: P["ReadExpression"]) => void;
  "ReadExpression.after": (
    value: V["Scope"],
    ...point: P["ReadExpression"]
  ) => V["Stack"];
  "ClosureExpression.before": (...point: P["ClosureExpression"]) => void;
  "ClosureExpression.after": (
    closure: V["Enter"] & Function,
    ...point: P["ClosureExpression"]
  ) => V["Stack"];
  "ConditionalExpression.before": (
    ...point: P["ConditionalExpression"]
  ) => boolean;
  "ConditionalExpression.TODO": (
    test: V["Stack"],
    ...point: P["ConditionalExpression"]
  ) => boolean;
  "ConditionalExpression.after": (
    result: V["Stack"],
    ...point: P["ConditionalExpression"]
  ) => V["Stack"];
  "SequenceExpression.before": (...point: P["SequenceExpression"]) => void;
  "SequenceExpression.after": (
    result: V["Stack"],
    ...point: P["SequenceExpression"]
  ) => V["Stack"];
  "EvalExpression.before": (...point: P["EvalExpression"]) => string;
  "EvalExpression.TODO": (
    code: V["Stack"],
    context: DeepLocalContext,
    ...point: P["EvalExpression"]
  ) => string;
  "EvalExpression.after": (
    completion: V["Enter"],
    ...point: P["EvalExpression"]
  ) => V["Stack"];
  "AwaitExpression.before": (...point: P["AwaitExpression"]) => V["Leave"];
  "AwaitExpression.TODO": (
    promise: V["Stack"],
    ...point: P["AwaitExpression"]
  ) => V["Leave"];
  "AwaitExpression.after": (
    result: V["Enter"],
    ...point: P["AwaitExpression"]
  ) => V["Stack"];
  "YieldExpression.before": (...point: P["YieldExpression"]) => V["Leave"];
  "YieldExpression.TODO": (
    item: V["Stack"],
    ...point: P["YieldExpression"]
  ) => V["Leave"];
  "YieldExpression.after": (
    result: V["Enter"],
    ...point: P["YieldExpression"]
  ) => V["Stack"];
  "ApplyExpression.before": (...point: P["ApplyExpression"]) => void;
  "ApplyExpression.callee": (
    callee: V["Stack"],
    ...point: P["ApplyExpression"]
  ) => V["Stack"];
  "ApplyExpression.this": (
    this_: V["Stack"],
    ...point: P["ApplyExpression"]
  ) => V["Stack"];
  "ApplyExpression.argument": (
    index: number,
    arguments_: V["Stack"],
    ...point: P["ApplyExpression"]
  ) => V["Stack"];
  "ApplyExpression.after": (
    result: V["Enter"],
    ...point: P["ApplyExpression"]
  ) => V["Stack"];
  "ApplyExpression.around": (
    callee: V["Stack"],
    this_: V["Stack"],
    arguments_: V["Stack"][],
    ...point: P["ApplyExpression"]
  ) => V["Stack"];
  "ConstructExpression.before": (...point: P["ConstructExpression"]) => void;
  "ConstructExpression.callee": (
    callee: V["Stack"],
    ...point: P["ConstructExpression"]
  ) => V["Stack"];
  "ConstructExpression.argument": (
    index: number,
    arguments_: V["Stack"],
    ...point: P["ConstructExpression"]
  ) => V["Stack"];
  "ConstructExpression.around": (
    callee: V["Stack"],
    arguments_: V["Stack"][],
    ...point: P["ConstructExpression"]
  ) => V["Stack"];
};

/////////////////////
// Function Format //
/////////////////////

type Input<V> =
  | {
      type: "void";
    }
  | {
      type: "value";
      payload: V;
    }
  | {
      type: "frame";
      frame: { [key in string]?: V };
    }
  | {
      type: "apply";
      callee: V;
      this: V;
      arguments: V[];
    }
  | {
      type: "construct";
      callee: V;
      arguments: V[];
    };

export type FunctionPointcut<
  P extends Json,
  A extends Atom,
  S extends string,
> = (
  node: Node<A>,
  path: S,
  root: Program<A>,
) => null | {
  point: P;
  cut: boolean | ("before" | "after" | "finally" | "catch" | "around")[];
};

export type FunctionAdvice<
  P extends Json[],
  V extends unknown,
  S extends string,
> = <I extends Input<V>>(
  input: I,
  point: P,
) => I extends { type: "void" }
  ? void
  : I extends { type: "value" }
  ? V
  : I extends { type: "frame" }
  ? { [key in S | aran.Parameter]?: V }
  : I extends { type: "apply" }
  ? V
  : I extends { type: "construct" }
  ? V
  : never;

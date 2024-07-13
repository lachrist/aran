// @ts-nocheck

import { Intrinsic } from "../../../lib/lang";
import {
  ObjectPointcut as GenericPointcut,
  ObjectAdvice as GenericAdvice,
  ObjectPointcut,
} from "../../../type/yo";

export type Source = Brand<string, "Source">;

export type Specifier = Brand<string, "Specifier">;

export type Label = Brand<string, "Label">;

export type Variable = Brand<string, "Variable">;

export type OriginPath = Brand<string, "Path">;

export type TargetPath = Brand<string, "Path">;

export type Atom = {
  Source: Source;
  Specifier: Specifier;
  Label: Label;
  Variable: Variable;
  Tag: OriginPath;
};

export type Status =
  | { type: "root" }
  | { type: "initial" }
  | { type: "return" }
  | { type: "completion" }
  | { type: "break"; label: Label }
  | { type: "failure" };

export type Scope = {
  "invariant.status": Status;
  "invariant.stack": number;
} & {
  [K in Variable | aran.Parameter]?: Value;
};

export type Value = Brand<unknown, "Value">;

export type Point = {
  Program: [path: TargetPath];
  ControlBlock: [
    path: TargetPath,
    kind: "try" | "catch" | "finally" | "other",
    labels: Label[],
  ];
  RoutineBlock: [
    path: TargetPath,
    kind:
      | "module.global"
      | "script.global"
      | "eval.global"
      | "eval.local.deep"
      | "eval.local.root"
      | "closure",
  ];
  DebuggerStatement: [path: TargetPath];
  BreakStatement: [TargetPath, label: Label];
  ReturnStatement: [path: TargetPath];
  IfStatement: [path: TargetPath];
  WhileStatement: [path: TargetPath];
  TryStatement: [path: TargetPath];
  BlockStatement: [path: TargetPath];
  EffectStatement: [path: TargetPath];
  WriteEffect: [TargetPath, variable: Variable | aran.Parameter];
  ExportEffect: [path: TargetPath];
  ExpressionEffect: [path: TargetPath];
  ConditionalEffect: [path: TargetPath];
  PrimitiveExpression: [
    path: TargetPath,
    primitive: null | boolean | number | string | { bigint: string },
  ];
  ConditionalExpression: [path: TargetPath];
  SequenceExpression: [path: TargetPath];
  AwaitExpression: [path: TargetPath, marker: {}];
  YieldExpression: [path: TargetPath, marker: {}];
  IntrinsicExpression: [path: TargetPath, name: Intrinsic];
  ClosureExpression: [path: TargetPath];
  ReadExpression: [path: TargetPath, variable: Variable | aran.Parameter];
  ImportExpression: [path: TargetPath];
  EvalExpression: [path: TargetPath];
  ApplyExpression: [path: TargetPath];
  ConstructExpression: [path: TargetPath];
};

export type Pointcut = GenericPointcut<Point, Atom, TargetPath>;

export type Advice = GenericAdvice<
  Point,
  {
    Stack: Value;
    Scope: Value;
    Enter: Value;
    Leave: Value;
  },
  Variable
>;

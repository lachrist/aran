import type { Variable } from "./variable";
import type { Hash } from "./hash";
import type {
  Program as GenericProgram,
  SegmentBlock as GenericSegmentBlock,
  RoutineBlock as GenericRoutineBlock,
  Statement as GenericStatement,
  Effect as GenericEffect,
  Expression as GenericExpression,
  Intrinsic,
} from "../lang/syntax";
import type { SourceValue, SpecifierName } from "estree-sentry";
import type { Brand } from "../util/util";
import type { Tree } from "../util/tree";

export type Label = Brand<string, "unbuild.Label">;

export type Atom = {
  Label: Label;
  Source: SourceValue;
  Specifier: SourceValue | SpecifierName;
  Variable: Variable;
  Tag: Hash;
};

export type Program = GenericProgram<Atom>;

export type SegmentBlock = GenericSegmentBlock<Atom>;

export type TreeSegmentBlock = {
  type: "SegmentBlock";
  labels: Tree<Label>;
  bindings: [Variable, Intrinsic][];
  body: Tree<Statement>;
  tag: Hash;
};

export type RoutineBlock = GenericRoutineBlock<Atom>;

export type TreeRoutineBlock = {
  type: "RoutineBlock";
  bindings: [Variable, Intrinsic][];
  head: Tree<Effect>;
  body: Tree<Statement>;
  tail: Expression;
  tag: Hash;
};

export type Statement = GenericStatement<Atom>;

export type Effect = GenericEffect<Atom>;

export type Expression = GenericExpression<Atom>;

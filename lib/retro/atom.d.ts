import type { Brand } from "../util/util";
import type {
  Node as GenericNode,
  Program as GenericProgram,
  SegmentBlock as GenericSegmentBlock,
  RoutineBlock as GenericRoutineBlock,
  Statement as GenericStatement,
  Effect as GenericEffect,
  Expression as GenericExpression,
} from "../lang/syntax";
import type { SourceValue, SpecifierName, SpecifierValue } from "estree-sentry";

export type Label = Brand<string, "retro.Label">;

export type Variable = Brand<string, "retro.Variable">;

export type Atom = {
  Label: Label;
  Source: SourceValue;
  Specifier: SpecifierName | SpecifierValue;
  Variable: Variable;
  Tag: null;
};

export type Node = GenericNode<Atom>;

export type Program = GenericProgram<Atom>;

export type RoutineBlock = GenericRoutineBlock<Atom>;

export type SegmentBlock = GenericSegmentBlock<Atom>;

export type Statement = GenericStatement<Atom>;

export type Effect = GenericEffect<Atom>;

export type Expression = GenericExpression<Atom>;

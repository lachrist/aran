import {
  Node as GenericNode,
  Program as GenericProgram,
  ControlBlock as GenericControlBlock,
  RoutineBlock as GenericRoutineBlock,
  Statement as GenericStatement,
  Effect as GenericEffect,
  Expression as GenericExpression,
} from "../lang";

export type Label = Brand<string, "rebuild.Label">;

export type Variable = Brand<string, "rebuild.Variable">;

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  Tag: null;
};

export type Node = GenericNode<Atom>;

export type Program = GenericProgram<Atom>;

export type RoutineBlock = GenericRoutineBlock<Atom>;

export type ControlBlock = GenericControlBlock<Atom>;

export type Statement = GenericStatement<Atom>;

export type Effect = GenericEffect<Atom>;

export type Expression = GenericExpression<Atom>;

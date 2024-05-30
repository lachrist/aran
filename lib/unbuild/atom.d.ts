import type { Variable } from "./variable.d.ts";
import type { Path } from "../path.js";
import {
  Program as GenericProgram,
  ControlBlock as GenericControlBlock,
  RoutineBlock as GenericRoutineBlock,
  Statement as GenericStatement,
  Effect as GenericEffect,
  Expression as GenericExpression,
} from "../lang.js";

export type Label = Brand<string, "unbuild.Label">;

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  Tag: Path;
};

export type Program = GenericProgram<Atom>;

export type ControlBlock = GenericControlBlock<Atom>;

export type RoutineBlock = GenericRoutineBlock<Atom>;

export type Statement = GenericStatement<Atom>;

export type Effect = GenericEffect<Atom>;

export type Expression = GenericExpression<Atom>;

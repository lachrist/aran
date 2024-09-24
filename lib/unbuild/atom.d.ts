import type { Variable } from "./variable.d.ts";
import type { Hash } from "../hash.d.ts";
import type {
  Program as GenericProgram,
  ControlBlock as GenericControlBlock,
  RoutineBlock as GenericRoutineBlock,
  Statement as GenericStatement,
  Effect as GenericEffect,
  Expression as GenericExpression,
} from "../lang.js";
import type { Source, Specifier } from "../estree.js";
import type { Brand } from "../util.js";

export type Label = Brand<string, "unbuild.Label">;

export type Atom = {
  Label: Label;
  Source: Source;
  Specifier: Specifier;
  Variable: Variable;
  Tag: Hash;
};

export type Program = GenericProgram<Atom>;

export type ControlBlock = GenericControlBlock<Atom>;

export type RoutineBlock = GenericRoutineBlock<Atom>;

export type Statement = GenericStatement<Atom>;

export type Effect = GenericEffect<Atom>;

export type Expression = GenericExpression<Atom>;

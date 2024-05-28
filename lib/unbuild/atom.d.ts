import type { Variable } from "./variable.d.ts";
import type { Path } from "./path.d.ts";
import {
  Program as ProgramGeneric,
  ControlBlock as ControlBlockGeneric,
  RoutineBlock as ClosureBlockGeneric,
  Statement as StatementGeneric,
  Effect as EffectGeneric,
  Expression as ExpressionGeneric,
} from "../../type/aran.js";

export type Label = Brand<string, "unbuild.Label">;

export type { Path } from "./path.d.ts";

export type Atom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: Variable;
  Tag: Path;
};

export type Program = ProgramGeneric<Atom>;

export type ControlBlock = ControlBlockGeneric<Atom>;

export type ClosureBlock = ClosureBlockGeneric<Atom>;

export type Statement = StatementGeneric<Atom>;

export type Effect = EffectGeneric<Atom>;

export type Expression = ExpressionGeneric<Atom>;

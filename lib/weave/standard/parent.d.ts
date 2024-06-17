import type { ModuleHeader, DeclareHeader } from "../../header";
import type { Variable as EstreeVariable } from "../../estree";
import type {
  ArrowKind,
  FunctionKind,
  ClosureKind,
  ControlKind,
  ProgramKind,
  GeneratorKind,
} from "../parametrization";
import type { Json } from "../../json";

export type ProgramParent = {
  type: "program";
  kind: ProgramKind;
  head: (ModuleHeader | DeclareHeader)[];
  initial: Json;
  advice: EstreeVariable;
};

export type ClosureParent = {
  type: "closure";
  kind: ClosureKind;
};

export type ControlParent = {
  type: "control";
  kind: ControlKind;
};

export type Parent = ProgramParent | ClosureParent | ControlParent;

export type RoutineParent =
  | ProgramParent
  | (ClosureParent & { kind: ArrowKind | FunctionKind });

export type PreludeParent = ClosureParent & { kind: GeneratorKind };

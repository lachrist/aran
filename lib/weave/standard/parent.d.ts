import type { ModuleHeader, DeclareHeader } from "../../header";
import type { Variable as EstreeVariable } from "../../estree";
import type { ClosureKind, ControlKind, ProgramKind } from "../parametrization";
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

export type RoutineParent = ProgramParent | ClosureParent;

export type Parent = RoutineParent | ControlParent;

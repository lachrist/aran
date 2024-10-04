import type { ModuleHeader, DeclareHeader } from "../../header";
import type { VariableName } from "estree-sentry";
import type { ClosureKind, SegmentKind, ProgramKind } from "../parametrization";
import type { Json } from "../../json";

export type ProgramParent = {
  type: "program";
  kind: ProgramKind;
  head: (ModuleHeader | DeclareHeader)[];
  initial: Json;
  advice: VariableName;
};

export type ClosureParent = {
  type: "closure";
  kind: ClosureKind;
};

export type SegmentParent = {
  type: "segment";
  kind: SegmentKind;
};

export type RoutineParent = ProgramParent | ClosureParent;

export type Parent = RoutineParent | SegmentParent;

import type { ClosureKind, SegmentKind, ProgramKind } from "../parametrization";
import type { Json } from "../../util/util";
import type { VariableName } from "estree-sentry";

export type ProgramParent = {
  type: "program";
  kind: ProgramKind;
  advice: VariableName[];
  initial: Json;
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

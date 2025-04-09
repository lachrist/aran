import type { ModuleHeader, DeclareHeader } from "../../lang/header.d.ts";
import type {
  ClosureKind,
  SegmentKind,
  ProgramKind,
} from "../parametrization.d.ts";
import type { Json } from "../../util/util.d.ts";

export type ProgramParent = {
  type: "program";
  kind: ProgramKind;
  head: (ModuleHeader | DeclareHeader)[];
  initial: Json;
  advice: string;
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

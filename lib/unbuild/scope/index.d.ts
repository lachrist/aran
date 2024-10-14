import type { Annotation } from "../annotation";
import type { CatchScope } from "./catch";
import type { PrivateScope } from "./private";
import type { ProgramScope } from "./program";
import type { RoutineScope } from "./routine";
import type { VariableScope } from "./variable";

export type Scope = CatchScope &
  PrivateScope &
  ProgramScope &
  RoutineScope &
  VariableScope & {
    annotation: Annotation;
  };

export type PackScope = {
  [key in keyof Scope]: key extends "annotation" ? null : Scope[key];
};

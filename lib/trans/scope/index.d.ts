import type { Annotation } from "../annotation/index.d.ts";
import type { CatchScope } from "./catch/index.d.ts";
import type { PrivateScope } from "./private/index.d.ts";
import type { ProgramScope } from "./program/index.d.ts";
import type { RoutineScope } from "./routine/index.d.ts";
import type { VariableScope } from "./variable/index.d.ts";

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

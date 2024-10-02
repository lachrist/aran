import type { VariableName } from "estree-sentry";
import type { Key } from "./key";

export type PropertyName = {
  type: "property";
  kind: "init" | "get" | "set";
  key: Key;
};

export type AssignmentName = {
  type: "assignment";
  variable: VariableName;
};

export type AnonymousName = {
  type: "anonymous";
};

export type DefaultName = {
  type: "default";
};

export type Name = PropertyName | AssignmentName | AnonymousName | DefaultName;

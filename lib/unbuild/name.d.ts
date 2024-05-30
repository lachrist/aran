import type { Variable } from "../estree.js";
import type { Key } from "./key.js";

export type PropertyName = {
  type: "property";
  kind: "init" | "get" | "set";
  key: Key;
};

export type AssignmentName = {
  type: "assignment";
  variable: Variable;
};

export type AnonymousName = {
  type: "anonymous";
};

export type DefaultName = {
  type: "default";
};

export type Name = PropertyName | AssignmentName | AnonymousName | DefaultName;

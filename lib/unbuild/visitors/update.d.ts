import type { Key } from "./key.d.ts";
import type { Object } from "./object.d.ts";

export type VariableUpdate = {
  type: "variable";
  variable: estree.Variable;
};

export type MemberUpdate = {
  type: "member";
  object: Object;
  key: Key;
};

export type EmptyUpdate = {
  type: "empty";
};

export type Update = VariableUpdate | MemberUpdate | EmptyUpdate;

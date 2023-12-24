import { MemberKey, MemberObject } from "../member";

export type VariableUpdate = {
  type: "variable";
  variable: estree.Variable;
};

export type MemberUpdate = {
  type: "member";
  object: MemberObject;
  key: MemberKey;
};

export type EmptyUpdate = {
  type: "empty";
};

export type Update = VariableUpdate | MemberUpdate | EmptyUpdate;

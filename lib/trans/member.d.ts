import type { Object } from "./object.d.ts";
import type { Key } from "./key.d.ts";
import type { Expression } from "./atom.d.ts";

export type GetMember = {
  object: Object;
  key: Key;
};

export type SetMember = {
  object: Object;
  key: Key;
  value: Expression;
};

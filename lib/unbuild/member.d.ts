import type { Object } from "./object";
import type { Key } from "./key";
import type { Expression } from "./atom";

export type GetMember = {
  object: Object;
  key: Key;
};

export type SetMember = {
  object: Object;
  key: Key;
  value: Expression;
};

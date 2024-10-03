import type { Object } from "./object.d.ts";
import type { Key } from "./key.d.ts";
import type { Expression } from "./atom.js";

export type GetMember = {
  mode: "strict" | "sloppy";
  object: Object;
  key: Key;
};

export type SetMember = {
  mode: "strict" | "sloppy";
  object: Object;
  key: Key;
  value: Expression;
};

import type { Object } from "./object.d.ts";
import type { Key } from "./key.d.ts";
import { Atom } from "./atom.js";

export type GetMember = {
  object: Object;
  key: Key;
};

export type SetMember = {
  object: Object;
  key: Key;
  value: aran.Expression<Atom>;
};

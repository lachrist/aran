import type { Object } from "./object.d.ts";
import type { Key } from "./key.d.ts";

export type GetMember = {
  object: Object;
  key: Key;
};

export type SetMember = {
  object: Object;
  key: Key;
  value: aran.Expression<unbuild.Atom>;
};

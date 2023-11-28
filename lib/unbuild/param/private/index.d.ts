import type { PrivateDictionary } from "./dictionary.js";
import type { PrivateDescriptor } from "./descriptor.d.ts";

export type Private = {
  [k in estree.PrivateKey]: PrivateDictionary<PrivateDescriptor>;
};

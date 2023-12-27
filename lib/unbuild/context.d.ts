import { PackMeta } from "./meta";
import { Scope } from "./scope";

export type Context = {
  scope: Scope;
  meta: PackMeta;
};

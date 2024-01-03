import { PackMeta } from "./meta";
import { Scope } from "./scope";

export type Context = {
  path: unbuild.Path;
  meta: PackMeta;
  scope: Scope;
};

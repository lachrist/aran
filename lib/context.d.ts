import { PackMeta } from "./unbuild/meta";
import { PackScope } from "./unbuild/scope";

export type Context = {
  meta: PackMeta;
  scope: PackScope;
};

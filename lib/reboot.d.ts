import type { Path } from "./path";
import type { PackMeta } from "./unbuild/meta";
import type { PackScope } from "./unbuild/scope";

export type Reboot = {
  meta: PackMeta;
  scope: PackScope;
};

export type RebootRecord = {
  [key in Path]?: Reboot;
};

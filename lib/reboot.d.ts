import type { Path } from "./path";
import type { Meta } from "./unbuild/meta";
import type { PackScope } from "./unbuild/scope";

export type Reboot = {
  meta: Meta;
  scope: PackScope;
};

export type RebootRecord = {
  [key in Path]?: Reboot;
};

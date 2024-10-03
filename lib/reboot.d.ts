import type { Hash } from "./hash";
import type { Meta } from "./unbuild/meta";
import type { PackScope } from "./unbuild/scope";

export type Reboot = {
  meta: Meta;
  mode: "strict" | "sloppy";
  scope: PackScope;
};

export type RebootRecord = {
  [key in Hash]?: Reboot;
};

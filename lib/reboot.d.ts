import type { Hash } from "./hash";
import type { Meta } from "./unbuild/meta";
import type { Scope } from "./unbuild/scope";

export type Reboot = {
  meta: Meta;
  mode: "strict" | "sloppy";
  scope: Scope;
};

export type RebootRecord = {
  [key in Hash]?: Reboot;
};

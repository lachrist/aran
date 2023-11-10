import type { Root } from "../../type/options.d.ts";
import { Scope } from "./scope/index.mjs";
import type { Param } from "./param/param.d.ts";

export type Context = {
  strict: boolean;
  root: Root;
  scope: Scope;
  param: Param;
};

import { Scope } from "./scope/index.mjs";
import { Private } from "./private.mjs";
import type { Root } from "../../type/options.d.ts";
import type { Param } from "./param/param.d.ts";
import type { Param as OldParam } from "./param.mjs";

export type Context = {
  strict: boolean;
  root: Root;
  scope: Scope;
  param: Param;
  private: Private;
  params: OldParam[];
};

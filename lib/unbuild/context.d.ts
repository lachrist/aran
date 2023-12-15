import type { Scope } from "./scope/index.d.ts";
import type { RootSitu } from "../situ.d.ts";
import type { Param } from "./param/param.d.ts";

export type Context = {
  situ: RootSitu;
  mode: "sloppy" | "strict";
  scope: Scope;
  param: Param;
};

export type EvalContext = Context & {
  meta: "string";
};

import type { Base } from "../../type/options.d.ts";
import { Scope } from "./scope/index.mjs";
import type { Closure } from "./param/closure/closure.d.ts";
import type { Private } from "./param/private/index.d.ts";
import type { RootProgram } from "./program.js";

export type Context = {
  mode: "strict" | "sloppy";
  root: RootProgram;
  base: Base;
  catch: boolean;
  closure: Closure;
  scope: Scope;
  private: Private;
};

export type EvalContext = Omit<Context, "base"> & {
  meta: "string";
};

import type { Base } from "../../type/options.d.ts";
import { Scope } from "./scope/index.mjs";
import type { Closure } from "./param/closure/closure.d.ts";
import { Cache } from "./cache.mjs";
import type { RootProgram } from "./program.js";

export type Context = {
  mode: "strict" | "sloppy";
  root: RootProgram;
  base: Base;
  catch: boolean;
  closure: Closure;
  scope: Scope;
  privates: { [key in estree.PrivateKey]: Cache };
};

export type EvalContext = Omit<Context, "base"> & {
  meta: "string";
};

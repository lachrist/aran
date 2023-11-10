import type { Root } from "../../type/options.d.ts";
import { Scope } from "./scope/index.mjs";
import type { Closure } from "./param/closure/closure.d.ts";
import { Cache } from "./cache.mjs";

export type Context = {
  mode: "strict" | "sloppy";
  situ: "global" | "local";
  program: "module" | "script" | "eval";
  catch: boolean;
  closure: Closure;
  root: Root;
  scope: Scope;
  privates: { [key in estree.PrivateKey]: Cache };
};

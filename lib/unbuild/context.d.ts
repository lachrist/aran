import type { Base } from "../../type/options.d.ts";
import { Scope } from "./scope/index.mjs";
import type { Closure } from "./param/closure/closure.d.ts";
import { Cache } from "./cache.mjs";

type Root =
  | {
      kind: "module" | "script" | "eval";
      situ: "global";
      plug: "reify" | "alien";
    }
  | {
      kind: "eval";
      situ: "local";
      plug: "alien";
    };

export type Context = {
  mode: "strict" | "sloppy";
  root: Root;
  base: Base;
  catch: boolean;
  closure: Closure;
  scope: Scope;
  privates: { [key in estree.PrivateKey]: Cache };
};

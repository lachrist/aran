import type { Base } from "../../type/options.d.ts";
import { Scope } from "./scope/index.mjs";
import type { Closure } from "./param/closure/closure.d.ts";
import { Cache } from "./cache.mjs";

type ReifyGlobalRoot = {
  kind: "module" | "script" | "eval";
  situ: "global";
  plug: "reify";
};

type AlienGlobalRoot = {
  kind: "module" | "script" | "eval";
  situ: "global";
  plug: "alien";
};

type AlienLocalRoot = {
  kind: "eval";
  situ: "local";
  plug: "alien";
};

type LocalRoot = AlienLocalRoot;

type GlobalRoot = ReifyGlobalRoot | AlienGlobalRoot;

type AlienRoot = AlienGlobalRoot | AlienLocalRoot;

type ReifyRoot = ReifyGlobalRoot;

type Root = ReifyGlobalRoot | AlienGlobalRoot | AlienLocalRoot;

export type Context = {
  mode: "strict" | "sloppy";
  root: Root;
  base: Base;
  catch: boolean;
  closure: Closure;
  scope: Scope;
  privates: { [key in estree.PrivateKey]: Cache };
};

import type { Scope } from "./scope";

export type Context = {
  mode: "sloppy" | "strict";
  scope: Scope;
};

export type EvalContext = {
  mode: "sloppy" | "strict";
  scope: Scope;
  meta: "string";
};

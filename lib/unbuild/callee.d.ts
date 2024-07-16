import type { Expression } from "./atom";

export type RegularCallee = {
  type: "regular";
  function: Expression;
  this: Expression;
};

export type EvalCallee = {
  type: "eval";
};

export type SuperCallee = {
  type: "super";
};

export type Callee = SuperCallee | RegularCallee | EvalCallee;

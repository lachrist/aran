import type { Expression } from "./atom";

export type EvalCallee = {
  type: "eval";
};

export type SuperCallee = {
  type: "super";
};

export type RegularCallee = {
  type: "regular";
  function: Expression;
  this: Expression;
};

export type Callee = EvalCallee | SuperCallee | RegularCallee;

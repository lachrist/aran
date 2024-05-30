import { Atom } from "./atom";

export type EvalCallee = {
  type: "eval";
};

export type SuperCallee = {
  type: "super";
};

export type RegularCallee = {
  type: "regular";
  function: aran.Expression<Atom>;
  this: aran.Expression<Atom>;
};

export type Callee = EvalCallee | SuperCallee | RegularCallee;

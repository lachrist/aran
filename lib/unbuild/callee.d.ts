export type EvalCallee = {
  type: "eval";
};

export type SuperCallee = {
  type: "super";
};

export type RegularCallee = {
  type: "regular";
  function: aran.Expression<unbuild.Atom>;
  this: aran.Expression<unbuild.Atom>;
};

export type Callee = EvalCallee | SuperCallee | RegularCallee;

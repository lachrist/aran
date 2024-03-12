export type Callee =
  | {
      type: "super";
    }
  | {
      type: "eval";
    }
  | {
      type: "regular";
      function: aran.Expression<unbuild.Atom>;
      this: aran.Expression<unbuild.Atom>;
    };

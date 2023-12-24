export type Callee =
  | {
      type: "super";
    }
  | {
      type: "regular";
      function: aran.Expression<unbuild.Atom>;
      this: aran.Expression<unbuild.Atom>;
    };

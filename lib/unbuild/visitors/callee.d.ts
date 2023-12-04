export type Callee =
  | {
      type: "super";
    }
  | {
      type: "normal";
      function: aran.Expression<unbuild.Atom>;
      this: aran.Expression<unbuild.Atom>;
    };

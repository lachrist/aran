export type Options<A extends aran.Atom> = {
  makeReadExpression: (
    variable: A["Variable"],
    tag: A["Tag"],
  ) => aran.Expression<A>;
  makeWriteEffect: (
    variable: A["Variable"],
    right: aran.Expression<A>,
    tag: A["Tag"],
  ) => aran.Effect<A>;
};

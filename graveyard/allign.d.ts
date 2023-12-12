export type Result<A1 extends aran.Atom, A2 extends aran.Atom> =
  | {
      type: "failure";
      path: string;
      pair: [aran.Node<A1>, aran.Node<A2>];
    }
  | {
      type: "success";
      labels: [A1["Label"], A2["Label"]][];
      variables: [A1["Variable"], A2["Variable"]][];
    };

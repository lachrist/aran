export type Outcome<V, E> =
  | {
      type: "success";
      value: V;
    }
  | {
      type: "failure";
      error: E;
    };

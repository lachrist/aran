export type Outcome<S, F> =
  | {
      type: "success";
      data: S;
    }
  | {
      type: "failure";
      data: F;
    };

export type Success<S> = {
  type: "success";
  data: S;
};

export type Failure<F> = {
  type: "failure";
  data: F;
};

export type Outcome<S, F> = Success<S> | Failure<F>;

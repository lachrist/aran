import { AranTypeError } from "./error.mjs";

/**
 * @type {<S, F, X>(
 *   outcome: import("./outcome").Outcome<S, F>,
 *   fromSuccess: (success: S) => X,
 *   fromFailure: (failure: F) => X,
 * ) => X}
 */
export const fromOutcome = (outcome, fromSuccess, fromFailure) => {
  if (outcome.type === "success") {
    return fromSuccess(outcome.data);
  } else if (outcome.type === "failure") {
    return fromFailure(outcome.data);
  } else {
    throw new AranTypeError(outcome);
  }
};

/**
 * @type {<S, F>(
 *   outcome: import("./outcome").Outcome<S, F>,
 *   fromFailure: (failure: F) => S,
 * ) => S}
 */
export const recover = (outcome, fromFailure) => {
  if (outcome.type === "success") {
    return outcome.data;
  } else if (outcome.type === "failure") {
    return fromFailure(outcome.data);
  } else {
    throw new AranTypeError(outcome);
  }
};

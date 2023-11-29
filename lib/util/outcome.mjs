const { Error } = globalThis;

/**
 * @template V
 * @template E
 * @typedef {{
 *   type: "success",
 *   value: V,
 * } | {
 *   type: "failure",
 *   error: E,
 * }} Outcome
 */

/**
 * @type {<V, E>(value: V) => Outcome<V, E>}
 */
export const success = (value) => ({ type: "success", value });

/**
 * @type {<V, E>(error: E) => Outcome<V, E>}
 */
export const failure = (error) => ({ type: "failure", error });

/**
 * @type {<V1, V2, E>(
 *   outcome: Outcome<V1, E>,
 *   update: (value: V1) => V2,
 * ) => Outcome<V2, E>}
 */
export const mapSuccess = (outcome, update) => {
  switch (outcome.type) {
    case "success": {
      return success(update(outcome.value));
    }
    case "failure": {
      return outcome;
    }
    default: {
      throw new Error("invalid outcome type");
    }
  }
};

/**
 * @type {<V, E1, E2>(
 *   outcome: Outcome<V, E1>,
 *   update: (error: E1) => E2,
 * ) => Outcome<V, E2>}
 */
export const mapFailure = (outcome, update) => {
  switch (outcome.type) {
    case "success": {
      return outcome;
    }
    case "failure": {
      return failure(update(outcome.error));
    }
    default: {
      throw new Error("invalid outcome type");
    }
  }
};

/**
 * @type {<V>(
 *   outcome: Outcome<V, V>,
 * ) => V}
 */
export const recover = (outcome) => {
  switch (outcome.type) {
    case "success": {
      return outcome.value;
    }
    case "failure": {
      return outcome.error;
    }
    default: {
      throw new Error("invalid outcome type");
    }
  }
};

const { Error } = globalThis;

/**
 * @type {<V, E>(value: V) => import("./outcome.d.ts").Outcome<V, E>}
 */
export const success = (value) => ({ type: "success", value });

/**
 * @type {<V, E>(error: E) => import("./outcome.d.ts").Outcome<V, E>}
 */
export const failure = (error) => ({ type: "failure", error });

/**
 * @type {<V1, V2, E>(
 *   outcome: import("./outcome.d.ts").Outcome<V1, E>,
 *   update: (value: V1) => V2,
 * ) => import("./outcome.d.ts").Outcome<V2, E>}
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
 *   outcome: import("./outcome.d.ts").Outcome<V, E1>,
 *   update: (error: E1) => E2,
 * ) => import("./outcome.d.ts").Outcome<V, E2>}
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
 *   outcome: import("./outcome.d.ts").Outcome<V, V>,
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

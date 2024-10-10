const { Error } = globalThis;

/**
 * @type {<S, F>(data: S) => import("./outcome.d.ts").Outcome<S, F>}
 */
export const success = (data) => ({ type: "success", data });

/**
 * @type {<S, F>(data: F) => import("./outcome.d.ts").Outcome<S, F>}
 */
export const failure = (data) => ({ type: "failure", data });

/**
 * @type {<S1, S2, F>(
 *   outcome: import("./outcome.d.ts").Outcome<S1, F>,
 *   update: (data: S1) => S2,
 * ) => import("./outcome.d.ts").Outcome<S2, F>}
 */
export const mapSuccess = (outcome, update) => {
  switch (outcome.type) {
    case "success": {
      return success(update(outcome.data));
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
 * @type {<S, F1, F2>(
 *   outcome: import("./outcome.d.ts").Outcome<S, F1>,
 *   update: (error: F1) => F2,
 * ) => import("./outcome.d.ts").Outcome<S, F2>}
 */
export const mapFailure = (outcome, update) => {
  switch (outcome.type) {
    case "success": {
      return outcome;
    }
    case "failure": {
      return failure(update(outcome.data));
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
export const recover = ({ data }) => data;

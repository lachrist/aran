/**
 * @type {<S, W1, W2, X, Y>(
 *   bindee: import("./state-write").StateWrite<S, W1, X>,
 *   binder: (value: X) => import("./state-write").StateWrite<S, W2, Y>,
 * ) => import("./state-write").StateWrite<S, W1 | W2, Y>}
 */
export const bindStateWrite = (bindee, binder) => (state1) => {
  const { state: state2, write: write1, value: value1 } = bindee(state1);
  const {
    state: state3,
    write: write2,
    value: value2,
  } = binder(value1)(state2);
  return {
    state: state3,
    write: [write1, write2],
    value: value2,
  };
};

/**
 * @type {<S, X>(
 *   value: X,
 * ) => import("./state-write").StateWrite<S, never, X>}
 */
export const zeroStateWrite = (value) => (state) => ({
  state,
  write: null,
  value,
});

/**
 * @type {<S, W, X, Y>(
 *   liftee: (value: X) => Y,
 *   monad: import("./state-write").StateWrite<S, W, X>,
 * ) => import("./state-write").StateWrite<S, W, Y>}
 */
export const liftStateWrite = (liftee, monad) => (state1) => {
  const { state: state2, write, value: value2 } = monad(state1);
  return {
    state: state2,
    write,
    value: liftee(value2),
  };
};

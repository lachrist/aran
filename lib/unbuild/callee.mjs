/**
 * @type {(
 *   function_: import("./atom").Expression,
 *   this_: import("./atom").Expression,
 * ) => import("./callee").RegularCallee}
 */
export const makeRegularCallee = (function_, this_) => ({
  type: "regular",
  function: function_,
  this: this_,
});

/**
 * @type {import("./callee").EvalCallee}
 */
export const EVAL_CALLEE = {
  type: "eval",
};

/**
 * @type {import("./callee").SuperCallee}
 */
export const SUPER_CALLEE = {
  type: "super",
};

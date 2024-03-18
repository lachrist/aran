/**
 * @type {(
 *   function_: aran.Expression<unbuild.Atom>,
 *   this_: aran.Expression<unbuild.Atom>,
 * ) => import("./callee").Callee}
 */
export const makeRegularCallee = (function_, this_) => ({
  type: "regular",
  function: function_,
  this: this_,
});

/**
 * @type {import("./callee").Callee}
 */
export const EVAL_CALEE = {
  type: "eval",
};

/**
 * @type {import("./callee").Callee}
 */
export const SUPER_CALEE = {
  type: "super",
};

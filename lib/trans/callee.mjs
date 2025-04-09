/**
 * @type {(
 *   function_: import("./atom.d.ts").Expression,
 *   this_: import("./atom.d.ts").Expression,
 * ) => import("./callee.d.ts").RegularCallee}
 */
export const makeRegularCallee = (function_, this_) => ({
  type: "regular",
  function: function_,
  this: this_,
});

/**
 * @type {import("./callee.d.ts").EvalCallee}
 */
export const EVAL_CALLEE = {
  type: "eval",
};

/**
 * @type {import("./callee.d.ts").SuperCallee}
 */
export const SUPER_CALLEE = {
  type: "super",
};

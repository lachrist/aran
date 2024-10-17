// @ts-nocheck
/**
 * @type {(
 *   message: string,
 * ) => void}
 */
const log = console.log;

/**
 * @type {(
 *   value: unknown,
 * ) => string}
 */
const show = (value) => {
  if (typeof value === "function") {
    return "function";
  }
};

/**
 * @type {null | string}
 */
let global_indent = null;

/**
 * @type {(
 *   membrane: import("../262/aran/membrane").BasicMembrane,
 * ) => import("../../").StandardAdvice<
 *   import("../262/aran/config").NodeHash,
 *   string,
 *   import("./track-origin").Valuation,
 * >}
 */
export const makeTraceAdvice = ({ intrinsics, instrumentLocalEvalCode }) => ({
  "block@setup": (indent, kind, hash) => {
    if (
      kind === "deep-local-eval" ||
      kind === "arrow" ||
      kind === "function" ||
      kind === "method" ||
      kind === "generator" ||
      kind === "async-arrow" ||
      kind === "async-function" ||
      kind === "async-method" ||
      kind === "async-generator"
    ) {
      indent = global_indent + "|";
    }
    indent += ".";
    log(`${indent} enter ${kind} at ${hash}`);
    return indent;
  },
  "block@teardown": (depth, kind, hash) => {
    log(`${indent} leave ${kind} at ${hash}`);
  },
  "apply@around": (depth, callee, this_arg, arg_list, hash) => {
    global_indent = indent;
    log(`${indent} apply ${callee} with ${arg_list} at ${hash}`);
    try {
      return apply(callee, this_arg, arg_list);
    } catch (error) {}
  },
});

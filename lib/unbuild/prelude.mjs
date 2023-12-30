/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").LogPrelude}
 */
export const isLogPrelude = (prelude) => prelude.type === "log";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").HeaderPrelude}
 */
export const isHeaderPrelude = (prelude) => prelude.type === "header";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").DeclarationPrelude}
 */
export const isDeclarationPrelude = (prelude) => prelude.type === "declaration";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").EffectPrelude}
 */
export const isEffectPrelude = (prelude) => prelude.type === "effect";

/**
 * @type {(
 *   data: import("./log").Log,
 * ) => import("./prelude").Prelude}
 */
export const makeLogPrelude = (data) => ({
  type: "log",
  data,
});

/**
 * @type {(
 *   data: import("./early-error").EarlyError,
 * ) => import("./prelude").Prelude}
 */
export const makeEarlyErrorPrelude = (data) => ({
  type: "early-error",
  data,
});

/**
 * @type {(
 *   data: import("../header").Header,
 * ) => import("./prelude").Prelude}
 */
export const makeHeaderPrelude = (data) => ({
  type: "header",
  data,
});

/**
 * @type {(
 *   data: aran.Effect<unbuild.Atom>,
 * ) => import("./prelude").Prelude}
 */
export const makeEffectPrelude = (data) => ({
  type: "effect",
  data,
});

/**
 * @type {(
 *   data: unbuild.Variable,
 * ) => import("./prelude").DeclarationPrelude}
 */
export const makeDeclarationPrelude = (data) => ({
  type: "declaration",
  data,
});

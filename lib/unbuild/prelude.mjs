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
 * ) => prelude is import("./prelude").VariablePrelude}
 */
export const isVariablePrelude = (prelude) => prelude.type === "variable";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").HeadPrelude}
 */
export const isHeadPrelude = (prelude) => prelude.type === "head";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").BodyPrelude}
 */
export const isBodyPrelude = (prelude) => prelude.type === "body";

/**
 * @type {(
 *   data: import("../../type/unbuild").Log,
 * ) => import("./prelude").Prelude}
 */
export const makeLogPrelude = (data) => ({
  type: "log",
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
 *   data: aran.Statement<unbuild.Atom>,
 * ) => import("./prelude").Prelude}
 */
export const makeHeadPrelude = (data) => ({
  type: "head",
  data,
});

/**
 * @type {(
 *   data: aran.Statement<unbuild.Atom>,
 * ) => import("./prelude").Prelude}
 */
export const makeBodyPrelude = (data) => ({
  type: "head",
  data,
});

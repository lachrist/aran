import { isBaseVariable } from "./mangle.mjs";

/**
 * @type {(
 *   data: import("./log").Log,
 * ) => import("./prelude").LogPrelude}
 */
export const makeLogPrelude = (data) => ({
  type: "log",
  data,
});

/**
 * @type {(
 *   data: import("./context").Context,
 * ) => import("./prelude").ContextPrelude}
 */
export const makeContextPrelude = (data) => ({
  type: "context",
  data,
});

/**
 * @type {(
 *   data: import("./early-error").EarlyError,
 * ) => import("./prelude").EarlyErrorPrelude}
 */
export const makeEarlyErrorPrelude = (data) => ({
  type: "early-error",
  data,
});

/**
 * @type {(
 *   data: import("../header").Header,
 * ) => import("./prelude").HeaderPrelude}
 */
export const makeHeaderPrelude = (data) => ({
  type: "header",
  data,
});

/**
 * @type {(
 *   data: aran.Effect<unbuild.Atom>,
 * ) => import("./prelude").EffectPrelude}
 */
export const makeEffectPrelude = (data) => ({
  type: "effect",
  data,
});

/**
 * @type {(
 *   data: import("./condition").Condition,
 * ) => import("./prelude").ConditionPrelude}
 */
export const makeConditionPrelude = (data) => ({
  type: "condition",
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

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").LogPrelude}
 */
export const isLogPrelude = (prelude) => prelude.type === "log";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").ContextPrelude}
 */
export const isContextPrelude = (prelude) => prelude.type === "context";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").HeaderPrelude}
 */
export const isHeaderPrelude = (prelude) => prelude.type === "header";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").EarlyErrorPrelude}
 */
export const isEarlyErrorPrelude = (prelude) => prelude.type === "early-error";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").DeclarationPrelude}
 */
export const isDeclarationPrelude = (prelude) => prelude.type === "declaration";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").DeclarationPrelude & {
 *   data: unbuild.BaseVariable,
 * }}
 */
export const isBaseDeclarationPrelude = (prelude) =>
  prelude.type === "declaration" && isBaseVariable(prelude.data);

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").EffectPrelude}
 */
export const isEffectPrelude = (prelude) => prelude.type === "effect";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").ConditionPrelude}
 */
export const isConditionPrelude = (prelude) => prelude.type === "condition";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").ProgramPrelude}
 */
export const isProgramPrelude = (prelude) =>
  prelude.type === "context" || prelude.type === "log";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").BlockPrelude}
 */
export const isBlockPrelude = (prelude) =>
  prelude.type === "context" ||
  prelude.type === "log" ||
  prelude.type === "header" ||
  prelude.type === "early-error";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").NodePrelude}
 */
export const isNodePrelude = (prelude) =>
  prelude.type === "context" ||
  prelude.type === "log" ||
  prelude.type === "header" ||
  prelude.type === "early-error" ||
  prelude.type === "declaration";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").SetupPrelude}
 */
export const isSetupPrelude = (prelude) =>
  prelude.type === "context" ||
  prelude.type === "log" ||
  prelude.type === "header" ||
  prelude.type === "early-error" ||
  prelude.type === "declaration" ||
  prelude.type === "effect";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is (
 *   | import("./prelude").EffectPrelude
 *   | import("./prelude").ConditionPrelude
 * )}
 */
export const isChainPrelude = (prelude) =>
  prelude.type === "effect" || prelude.type === "condition";

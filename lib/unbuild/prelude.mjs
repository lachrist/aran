/**
 * @type {(
 *   data: import("./warning").Warning,
 * ) => import("./prelude").WarningPrelude}
 */
export const makeWarningPrelude = (data) => ({
  type: "warning",
  data,
});

/**
 * @type {(
 *   data: [
 *     import("../path").Path,
 *     import("../program").DeepLocalContext,
 *   ],
 * ) => import("./prelude").ContextPrelude}
 */
export const makeContextPrelude = (data) => ({
  type: "context",
  data,
});

/**
 * @type {(
 *   data: {
 *     variable: import("./variable").MetaVariable,
 *     value: import("./site").Site<import("../estree").TaggedTemplateExpression>,
 *   },
 * ) => import("./prelude").TemplatePrelude}
 */
export const makeTemplatePrelude = (data) => ({
  type: "template",
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
 *   data: import("./atom").Effect,
 * ) => import("./prelude").PrefixPrelude}
 */
export const makePrefixPrelude = (data) => ({
  type: "prefix",
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
 *   data: [
 *     import("./variable").BaseVariable,
 *     import("../lang").Intrinsic,
 *   ],
 * ) => import("./prelude").BaseDeclarationPrelude}
 */
export const makeBaseDeclarationPrelude = (data) => ({
  type: "base-declaration",
  data,
});

/**
 * @type {(
 *   data: [
 *     import("./variable").MetaVariable,
 *     import("../lang").Intrinsic,
 *   ],
 * ) => import("./prelude").MetaDeclarationPrelude}
 */
export const makeMetaDeclarationPrelude = (data) => ({
  type: "meta-declaration",
  data,
});

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").WarningPrelude}
 */
export const isWarningPrelude = (prelude) => prelude.type === "warning";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").ContextPrelude}
 */
export const isContextPrelude = (prelude) => prelude.type === "context";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").TemplatePrelude}
 */
export const isTemplatePrelude = (prelude) => prelude.type === "template";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./prelude").TemplatePrelude> }
 */
export const isNotTemplatePrelude = (prelude) => prelude.type !== "template";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./prelude").EarlyErrorPrelude> }
 */
export const isNotEarlyErrorPrelude = (prelude) =>
  prelude.type !== "early-error";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").HeaderPrelude}
 */
export const isHeaderPrelude = (prelude) => prelude.type === "header";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./prelude").HeaderPrelude>}
 */
export const isNotHeaderPrelude = (prelude) => prelude.type !== "header";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").EarlyErrorPrelude}
 */
export const isEarlyErrorPrelude = (prelude) => prelude.type === "early-error";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").MetaDeclarationPrelude}
 */
export const isMetaDeclarationPrelude = (prelude) =>
  prelude.type === "meta-declaration";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").BaseDeclarationPrelude}
 */
export const isBaseDeclarationPrelude = (prelude) =>
  prelude.type === "base-declaration";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./prelude").BaseDeclarationPrelude>}
 */
export const isNotBaseDeclarationPrelude = (prelude) =>
  prelude.type !== "base-declaration";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").DeclarationPrelude}
 */
export const isDeclarationPrelude = (prelude) =>
  prelude.type === "base-declaration" || prelude.type === "meta-declaration";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./prelude").DeclarationPrelude>}
 */
export const isNotDeclarationPrelude = (prelude) =>
  prelude.type !== "base-declaration" && prelude.type !== "meta-declaration";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import("./prelude").ProgramPrelude}
 */
export const isProgramPrelude = (prelude) =>
  prelude.type === "warning" || prelude.type === "context";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import("./prelude").BlockPrelude}
 */
export const isBlockPrelude = (prelude) =>
  prelude.type === "warning" ||
  prelude.type === "context" ||
  prelude.type === "template" ||
  prelude.type === "early-error" ||
  prelude.type === "header";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import("./prelude").BodyPrelude}
 */
export const isBodyPrelude = (prelude) =>
  prelude.type === "warning" ||
  prelude.type === "context" ||
  prelude.type === "template" ||
  prelude.type === "early-error" ||
  prelude.type === "header" ||
  prelude.type === "base-declaration" ||
  prelude.type === "meta-declaration";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").PrefixPrelude}
 */
export const isPrefixPrelude = (prelude) => prelude.type === "prefix";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<
 *   P,
 *   import("./prelude").PrefixPrelude
 * >}
 */
export const isNotPrefixPrelude = (prelude) => prelude.type !== "prefix";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is (
 *   | import("./prelude").PrefixPrelude
 *   | import("./prelude").ConditionPrelude
 * )}
 */
export const isChainPrelude = (prelude) =>
  prelude.type === "prefix" || prelude.type === "condition";

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, (
 *   | import("./prelude").PrefixPrelude
 *   | import("./prelude").ConditionPrelude
 * )>}
 */
export const isNotChainPrelude = (prelude) =>
  prelude.type !== "prefix" && prelude.type !== "condition";

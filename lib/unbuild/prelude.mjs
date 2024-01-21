import { isBaseVariable, isMetaVariable } from "./mangle.mjs";

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
 *     unbuild.Path,
 *     import("../context").Context,
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
 *     value: import("./site").Site<estree.TaggedTemplateExpression>,
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
 *   data: import("./variable").BaseVariable,
 * ) => import("./prelude").BaseDeclarationPrelude}
 */
export const makeBaseDeclarationPrelude = (data) => ({
  type: "declaration",
  data,
});

/**
 * @type {(
 *   data: import("./variable").MetaVariable,
 * ) => import("./prelude").MetaDeclarationPrelude}
 */
export const makeMetaDeclarationPrelude = (data) => ({
  type: "declaration",
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
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is Exclude<P, import("./prelude").DeclarationPrelude>}
 */
export const isNotDeclarationPrelude = (prelude) =>
  prelude.type !== "declaration";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").DeclarationPrelude & {
 *   data: import("./variable").BaseVariable,
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
 * @type {<P extends import("./prelude").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./prelude").EffectPrelude>}
 */
export const isNotEffectPrelude = (prelude) => prelude.type !== "effect";

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
  prelude.type === "context" || prelude.type === "warning";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").BlockPrelude}
 */
export const isBlockPrelude = (prelude) =>
  prelude.type === "context" ||
  prelude.type === "warning" ||
  prelude.type === "header" ||
  prelude.type === "early-error";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").BodyPrelude}
 */
export const isBodyPrelude = (prelude) =>
  prelude.type === "context" ||
  prelude.type === "warning" ||
  prelude.type === "header" ||
  prelude.type === "early-error" ||
  prelude.type === "declaration" ||
  prelude.type === "effect";

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is import("./prelude").NodePrelude}
 */
export const isNodePrelude = (prelude) =>
  prelude.type === "context" ||
  prelude.type === "warning" ||
  prelude.type === "header" ||
  prelude.type === "early-error" ||
  (prelude.type === "declaration" && isMetaVariable(prelude.data)) ||
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

/**
 * @type {(
 *   prelude: import("./prelude").Prelude,
 * ) => prelude is (
 *   | import("./prelude").WarningPrelude
 *   | import("./prelude").ContextPrelude
 *   | import("./prelude").HeaderPrelude
 *   | import("./prelude").EarlyErrorPrelude
 *   | import("./prelude").MetaDeclarationPrelude
 * )}
 */
export const isNotChainPrelude = (prelude) =>
  prelude.type !== "effect" && prelude.type !== "condition";

import { hasNarrowKey } from "../../util/index.mjs";
import { makeEffectStatement } from "../node.mjs";

/**
 * @type {(
 *   data: import("./warning").RawWarning,
 * ) => import(".").WarningPrelude}
 */
export const makeWarningPrelude = (data) => ({
  type: "warning",
  data,
});

/**
 * @type {(
 *   data: import("./external").ReifyExternal,
 * ) => import(".").ReifyExternalPrelude}
 */
export const makeReifyExternalPrelude = (data) => ({
  type: "external-reify",
  data,
});

/**
 * @type {(
 *   data: import("estree-sentry").VariableName,
 * ) => import(".").NativeExternalPrelude}
 */
export const makeNativeExternalPrelude = (data) => ({
  type: "external-native",
  data,
});

/**
 * @type {(
 *   data: import("./template").Template,
 * ) => import(".").TemplatePrelude}
 */
export const makeTemplatePrelude = (data) => ({
  type: "template",
  data,
});

/**
 * @type {(
 *   data: import("./syntax-error").SyntaxError,
 * ) => import(".").SyntaxErrorPrelude}
 */
export const makeSyntaxErrorPrelude = (data) => ({
  type: "syntax-error",
  data,
});

/**
 * @type {(
 *   data: import("../../lang/header").Header,
 * ) => import(".").HeaderPrelude}
 */
export const makeHeaderPrelude = (data) => ({
  type: "header",
  data,
});

/**
 * @type {(
 *   data: import("../atom").Effect,
 * ) => import(".").PrefixPrelude}
 */
export const makePrefixPrelude = (data) => ({
  type: "prefix",
  data,
});

/**
 * @type {(
 *   data: import("./condition").Condition,
 * ) => import(".").ConditionPrelude}
 */
export const makeConditionPrelude = (data) => ({
  type: "condition",
  data,
});

/**
 * @type {(
 *   data: [
 *     import("../variable").BaseVariable,
 *     import("../../lang/syntax").Intrinsic,
 *   ],
 * ) => import(".").BaseDeclarationPrelude}
 */
export const makeBaseDeclarationPrelude = (data) => ({
  type: "base-declaration",
  data,
});

/**
 * @type {(
 *   data: import("estree-sentry").PrivateKeyName,
 * ) => import(".").UnboundPrivatePrelude}
 */
export const makeUnboundPrivatePrelude = (data) => ({
  type: "private-unbound",
  data,
});

/**
 * @type {(
 *   data: [
 *     import("../variable").MetaVariable,
 *     import("../../lang/syntax").Intrinsic,
 *   ],
 * ) => import(".").MetaDeclarationPrelude}
 */
export const makeMetaDeclarationPrelude = (data) => ({
  type: "meta-declaration",
  data,
});

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").WarningPrelude}
 */
export const isWarningPrelude = (prelude) => prelude.type === "warning";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").TemplatePrelude}
 */
export const isTemplatePrelude = (prelude) => prelude.type === "template";

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import(".").TemplatePrelude> }
 */
export const isNotTemplatePrelude = (prelude) => prelude.type !== "template";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").HeaderPrelude}
 */
export const isHeaderPrelude = (prelude) => prelude.type === "header";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").ReifyExternalPrelude}
 */
export const isReifyExternalPrelude = (prelude) =>
  prelude.type === "external-reify";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").NativeExternalPrelude}
 */
export const isNativeExternalPrelude = (prelude) =>
  prelude.type === "external-native";

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import(".").HeaderPrelude>}
 */
export const isNotHeaderPrelude = (prelude) => prelude.type !== "header";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").SyntaxErrorPrelude}
 */
export const isSyntaxErrorPrelude = (prelude) =>
  prelude.type === "syntax-error";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").MetaDeclarationPrelude}
 */
export const isMetaDeclarationPrelude = (prelude) =>
  prelude.type === "meta-declaration";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").BaseDeclarationPrelude}
 */
export const isBaseDeclarationPrelude = (prelude) =>
  prelude.type === "base-declaration";

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import(".").BaseDeclarationPrelude>}
 */
export const isNotBaseDeclarationPrelude = (prelude) =>
  prelude.type !== "base-declaration";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").DeclarationPrelude}
 */
export const isDeclarationPrelude = (prelude) =>
  prelude.type === "base-declaration" || prelude.type === "meta-declaration";

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import(".").DeclarationPrelude>}
 */
export const isNotDeclarationPrelude = (prelude) =>
  prelude.type !== "base-declaration" && prelude.type !== "meta-declaration";

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import(".").ProgramPrelude}
 */
export const isProgramPrelude = (prelude) =>
  prelude.type === "warning" || prelude.type === "syntax-error";

/**
 * @type {{
 *   [key in import(".").BlockPrelude["type"]]: null
 * }}
 */
const BLOCK_PRELUDE_RECORD = {
  "warning": null,
  "template": null,
  "syntax-error": null,
  "header": null,
  "external-native": null,
  "external-reify": null,
  "private-unbound": null,
};

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import(".").BlockPrelude}
 */
export const isBlockPrelude = (prelude) =>
  hasNarrowKey(BLOCK_PRELUDE_RECORD, prelude.type);

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import(".").NotBlockPrelude}
 */
export const isNotBlockPrelude = (prelude) =>
  !hasNarrowKey(BLOCK_PRELUDE_RECORD, prelude.type);

/**
 * @type {{
 *   [key in import(".").BodyPrelude["type"]]: null
 * }}
 */
const BODY_PRELUDE_RECORD = {
  "warning": null,
  "template": null,
  "syntax-error": null,
  "header": null,
  "base-declaration": null,
  "meta-declaration": null,
  "external-native": null,
  "external-reify": null,
  "private-unbound": null,
};

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import(".").BodyPrelude}
 */
export const isBodyPrelude = (prelude) =>
  hasNarrowKey(BODY_PRELUDE_RECORD, prelude.type);

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").PrefixPrelude}
 */
export const isPrefixPrelude = (prelude) => prelude.type === "prefix";

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<
 *   P,
 *   import(".").PrefixPrelude
 * >}
 */
export const isNotPrefixPrelude = (prelude) => prelude.type !== "prefix";

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<
 *   P,
 *   (
 *     | import(".").PrefixPrelude
 *     | import(".").DeclarationPrelude
 *   )
 * >}
 */
export const isIncorporateBlockPrelude = (prelude) =>
  prelude.type !== "prefix" &&
  prelude.type !== "base-declaration" &&
  prelude.type !== "meta-declaration";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is import(".").UnboundPrivatePrelude}
 */
export const isUnboundPrivatePrelude = (prelude) =>
  prelude.type === "private-unbound";

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => prelude is (
 *   | import(".").PrefixPrelude
 *   | import(".").ConditionPrelude
 * )}
 */
export const isChainPrelude = (prelude) =>
  prelude.type === "prefix" || prelude.type === "condition";

/**
 * @type {<P extends import(".").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, (
 *   | import(".").PrefixPrelude
 *   | import(".").ConditionPrelude
 * )>}
 */
export const isNotChainPrelude = (prelude) =>
  prelude.type !== "prefix" && prelude.type !== "condition";

////////////
// Getter //
////////////

/**
 * @type {(
 *   prelude: import(".").Prelude,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Statement | null}
 */
export const getPreludePrefixStatement = (prelude, hash) =>
  prelude.type === "prefix" ? makeEffectStatement(prelude.data, hash) : null;

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => import("../atom").Effect | null}
 */
export const getPreludePrefixEffect = (prelude) =>
  prelude.type === "prefix" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => null | [
 *   import("../variable").Variable,
 *   import("../../lang/syntax").Intrinsic,
 * ]}
 */
export const getPreludeDeclarationBinding = (prelude) =>
  prelude.type === "base-declaration" || prelude.type === "meta-declaration"
    ? prelude.data
    : null;

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => null | import("../../lang/header").Header}
 */
export const getPreludeHeader = (prelude) =>
  prelude.type === "header" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => null | import("estree-sentry").VariableName}
 */
export const getPreludeNativeExternalVariable = (prelude) =>
  prelude.type === "external-native" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => null | import("estree-sentry").PrivateKeyName}
 */
export const getPreludePrivateKey = (prelude) =>
  prelude.type === "private-unbound" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => null | import("./warning").RawWarning}
 */
export const getPreludeWarning = (prelude) =>
  prelude.type === "warning" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import(".").Prelude,
 * ) => null | import("./syntax-error").SyntaxError}
 */
export const getPreludeSyntaxError = (prelude) =>
  prelude.type === "syntax-error" ? prelude.data : null;

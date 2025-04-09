import { hasNarrowKey } from "../../util/index.mjs";
import { makeEffectStatement } from "../node.mjs";

/**
 * @type {(
 *   data: import("./warning.d.ts").RawWarning,
 * ) => import("./index.d.ts").WarningPrelude}
 */
export const makeWarningPrelude = (data) => ({
  type: "warning",
  data,
});

/**
 * @type {(
 *   data: import("./external.d.ts").ReifyExternal,
 * ) => import("./index.d.ts").ReifyExternalPrelude}
 */
export const makeReifyExternalPrelude = (data) => ({
  type: "external-reify",
  data,
});

/**
 * @type {(
 *   data: import("estree-sentry").VariableName,
 * ) => import("./index.d.ts").NativeExternalPrelude}
 */
export const makeNativeExternalPrelude = (data) => ({
  type: "external-native",
  data,
});

/**
 * @type {(
 *   data: import("./template.d.ts").Template,
 * ) => import("./index.d.ts").TemplatePrelude}
 */
export const makeTemplatePrelude = (data) => ({
  type: "template",
  data,
});

/**
 * @type {(
 *   data: import("./syntax-error.d.ts").SyntaxError,
 * ) => import("./index.d.ts").SyntaxErrorPrelude}
 */
export const makeSyntaxErrorPrelude = (data) => ({
  type: "syntax-error",
  data,
});

/**
 * @type {(
 *   data: import("../../lang/header.d.ts").Header,
 * ) => import("./index.d.ts").HeaderPrelude}
 */
export const makeHeaderPrelude = (data) => ({
  type: "header",
  data,
});

/**
 * @type {(
 *   data: import("../atom.d.ts").Effect,
 * ) => import("./index.d.ts").PrefixPrelude}
 */
export const makePrefixPrelude = (data) => ({
  type: "prefix",
  data,
});

/**
 * @type {(
 *   data: import("./condition.d.ts").Condition,
 * ) => import("./index.d.ts").ConditionPrelude}
 */
export const makeConditionPrelude = (data) => ({
  type: "condition",
  data,
});

/**
 * @type {(
 *   data: [
 *     import("../variable.d.ts").BaseVariable,
 *     import("../../lang/syntax.d.ts").Intrinsic,
 *   ],
 * ) => import("./index.d.ts").BaseDeclarationPrelude}
 */
export const makeBaseDeclarationPrelude = (data) => ({
  type: "base-declaration",
  data,
});

/**
 * @type {(
 *   data: import("estree-sentry").PrivateKeyName,
 * ) => import("./index.d.ts").UnboundPrivatePrelude}
 */
export const makeUnboundPrivatePrelude = (data) => ({
  type: "private-unbound",
  data,
});

/**
 * @type {(
 *   data: [
 *     import("../variable.d.ts").MetaVariable,
 *     import("../../lang/syntax.d.ts").Intrinsic,
 *   ],
 * ) => import("./index.d.ts").MetaDeclarationPrelude}
 */
export const makeMetaDeclarationPrelude = (data) => ({
  type: "meta-declaration",
  data,
});

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").WarningPrelude}
 */
export const isWarningPrelude = (prelude) => prelude.type === "warning";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").TemplatePrelude}
 */
export const isTemplatePrelude = (prelude) => prelude.type === "template";

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./index.d.ts").TemplatePrelude> }
 */
export const isNotTemplatePrelude = (prelude) => prelude.type !== "template";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").HeaderPrelude}
 */
export const isHeaderPrelude = (prelude) => prelude.type === "header";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").ReifyExternalPrelude}
 */
export const isReifyExternalPrelude = (prelude) =>
  prelude.type === "external-reify";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").NativeExternalPrelude}
 */
export const isNativeExternalPrelude = (prelude) =>
  prelude.type === "external-native";

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./index.d.ts").HeaderPrelude>}
 */
export const isNotHeaderPrelude = (prelude) => prelude.type !== "header";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").SyntaxErrorPrelude}
 */
export const isSyntaxErrorPrelude = (prelude) =>
  prelude.type === "syntax-error";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").MetaDeclarationPrelude}
 */
export const isMetaDeclarationPrelude = (prelude) =>
  prelude.type === "meta-declaration";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").BaseDeclarationPrelude}
 */
export const isBaseDeclarationPrelude = (prelude) =>
  prelude.type === "base-declaration";

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./index.d.ts").BaseDeclarationPrelude>}
 */
export const isNotBaseDeclarationPrelude = (prelude) =>
  prelude.type !== "base-declaration";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").DeclarationPrelude}
 */
export const isDeclarationPrelude = (prelude) =>
  prelude.type === "base-declaration" || prelude.type === "meta-declaration";

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, import("./index.d.ts").DeclarationPrelude>}
 */
export const isNotDeclarationPrelude = (prelude) =>
  prelude.type !== "base-declaration" && prelude.type !== "meta-declaration";

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import("./index.d.ts").ProgramPrelude}
 */
export const isProgramPrelude = (prelude) =>
  prelude.type === "warning" || prelude.type === "syntax-error";

/**
 * @type {{
 *   [key in import("./index.d.ts").BlockPrelude["type"]]: null
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
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import("./index.d.ts").BlockPrelude}
 */
export const isBlockPrelude = (prelude) =>
  hasNarrowKey(BLOCK_PRELUDE_RECORD, prelude.type);

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import("./index.d.ts").NotBlockPrelude}
 */
export const isNotBlockPrelude = (prelude) =>
  !hasNarrowKey(BLOCK_PRELUDE_RECORD, prelude.type);

/**
 * @type {{
 *   [key in import("./index.d.ts").BodyPrelude["type"]]: null
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
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is P & import("./index.d.ts").BodyPrelude}
 */
export const isBodyPrelude = (prelude) =>
  hasNarrowKey(BODY_PRELUDE_RECORD, prelude.type);

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").PrefixPrelude}
 */
export const isPrefixPrelude = (prelude) => prelude.type === "prefix";

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<
 *   P,
 *   import("./index.d.ts").PrefixPrelude
 * >}
 */
export const isNotPrefixPrelude = (prelude) => prelude.type !== "prefix";

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<
 *   P,
 *   (
 *     | import("./index.d.ts").PrefixPrelude
 *     | import("./index.d.ts").DeclarationPrelude
 *   )
 * >}
 */
export const isIncorporateBlockPrelude = (prelude) =>
  prelude.type !== "prefix" &&
  prelude.type !== "base-declaration" &&
  prelude.type !== "meta-declaration";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is import("./index.d.ts").UnboundPrivatePrelude}
 */
export const isUnboundPrivatePrelude = (prelude) =>
  prelude.type === "private-unbound";

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => prelude is (
 *   | import("./index.d.ts").PrefixPrelude
 *   | import("./index.d.ts").ConditionPrelude
 * )}
 */
export const isChainPrelude = (prelude) =>
  prelude.type === "prefix" || prelude.type === "condition";

/**
 * @type {<P extends import("./index.d.ts").Prelude>(
 *   prelude: P,
 * ) => prelude is Exclude<P, (
 *   | import("./index.d.ts").PrefixPrelude
 *   | import("./index.d.ts").ConditionPrelude
 * )>}
 */
export const isNotChainPrelude = (prelude) =>
  prelude.type !== "prefix" && prelude.type !== "condition";

////////////
// Getter //
////////////

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../atom.d.ts").Statement | null}
 */
export const getPreludePrefixStatement = (prelude, hash) =>
  prelude.type === "prefix" ? makeEffectStatement(prelude.data, hash) : null;

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => import("../atom.d.ts").Effect | null}
 */
export const getPreludePrefixEffect = (prelude) =>
  prelude.type === "prefix" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | [
 *   import("../variable.d.ts").Variable,
 *   import("../../lang/syntax.d.ts").Intrinsic,
 * ]}
 */
export const getPreludeDeclarationBinding = (prelude) =>
  prelude.type === "base-declaration" || prelude.type === "meta-declaration"
    ? prelude.data
    : null;

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | import("../../lang/header.d.ts").Header}
 */
export const getPreludeHeader = (prelude) =>
  prelude.type === "header" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | import("estree-sentry").VariableName}
 */
export const getPreludeNativeExternalVariable = (prelude) =>
  prelude.type === "external-native" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | import("estree-sentry").PrivateKeyName}
 */
export const getPreludePrivateKey = (prelude) =>
  prelude.type === "private-unbound" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | import("./warning.d.ts").RawWarning}
 */
export const getPreludeWarning = (prelude) =>
  prelude.type === "warning" ? prelude.data : null;

/**
 * @type {(
 *   prelude: import("./index.d.ts").Prelude,
 * ) => null | import("./syntax-error.d.ts").SyntaxError}
 */
export const getPreludeSyntaxError = (prelude) =>
  prelude.type === "syntax-error" ? prelude.data : null;

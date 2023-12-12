import { AranTypeError } from "./error.mjs";
import {
  isDeclarationHeader,
  isLookupHeader,
  isModuleHeader,
  isPrivateHeader,
  isSloppyHeader,
} from "./header.mjs";
import { some } from "./util/index.mjs";

//////////
// Mode //
//////////

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").StrictSitu}
 */
export const isStrictSitu = (situ) => situ.mode === "strict";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").SloppySitu}
 */
export const isSloppySitu = (situ) => situ.mode === "sloppy";

//////////
// Kind //
//////////

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").ModuleSitu}
 */
export const isModuleSitu = (situ) => situ.kind === "module";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").ScriptSitu}
 */
export const isScriptSitu = (situ) => situ.kind === "script";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").EvalSitu}
 */
export const isEvalSitu = (situ) => situ.kind === "eval";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").GlobalEvalSitu}
 */
export const isGlobalEvalSitu = (situ) =>
  situ.kind === "eval" && situ.scope === "global";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").LocalEvalSitu}
 */
export const isLocalEvalSitu = (situ) =>
  situ.kind === "eval" && situ.scope === "local";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").InternalLocalEvalSitu}
 */
export const isInternalLocalEvalSitu = (situ) =>
  situ.kind === "eval" && situ.scope === "local" && situ.ambient === "internal";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").ExternalLocalEvalSitu}
 */
export const isExternalLocalEvalSitu = (situ) =>
  situ.kind === "eval" && situ.scope === "local" && situ.ambient === "external";

/////////////////
// Root | Node //
/////////////////

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").RootSitu}
 */
export const isRootSitu = (situ) =>
  isModuleSitu(situ) ||
  isScriptSitu(situ) ||
  isGlobalEvalSitu(situ) ||
  isExternalLocalEvalSitu(situ);

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").NodeSitu}
 */
export const isNodeSitu = isInternalLocalEvalSitu;

/////////////
// Closure //
/////////////

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").ExternalLocalEvalSitu & {
 *   closure: "function",
 * }}
 */
export const isFunctionExternalLocalEvalSitu = (situ) =>
  situ.kind === "eval" &&
  situ.scope === "local" &&
  situ.ambient === "external" &&
  situ.closure === "function";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").ExternalLocalEvalSitu & {
 *   closure: "method",
 * }}
 */
export const isMethodExternalLocalEvalSitu = (situ) =>
  situ.kind === "eval" &&
  situ.scope === "local" &&
  situ.ambient === "external" &&
  situ.closure === "method";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").ExternalLocalEvalSitu & {
 *   closure: "method",
 * }}
 */
export const isConstructorExternalLocalEvalSitu = (situ) =>
  situ.kind === "eval" &&
  situ.scope === "local" &&
  situ.ambient === "external" &&
  situ.closure === "constructor";

/////////////
// Ambient //
/////////////

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => situ is import("./situ").InternalSitu}
 */
export const isInternalSitu = (situ) => situ.ambient === "internal";

/**
 * @type {(
 *   situ: import("./situ").Situ,
 * ) => import("./situ").SituKind}
 */
export const kindSitu = (situ) => {
  switch (situ.kind) {
    case "module": {
      return "module";
    }
    case "script": {
      return "script";
    }
    case "eval": {
      switch (situ.scope) {
        case "global": {
          return "global-eval";
        }
        case "local": {
          return `${situ.ambient}-local-eval`;
        }
        default: {
          throw new AranTypeError("invalid situ", situ);
        }
      }
    }
    default: {
      throw new AranTypeError("invalid situ", situ);
    }
  }
};

/** @type {(situ: import("./situ").Situ) => string} */
export const nameSitu = (situ) => {
  switch (situ.kind) {
    case "module": {
      return `${situ.ambient} module`;
    }
    case "script": {
      return `${situ.mode} ${situ.ambient} script`;
    }
    case "eval": {
      return `${situ.mode} ${situ.ambient} ${situ.scope} eval`;
    }
    default: {
      throw new AranTypeError("invalid situ", situ);
    }
  }
};

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => boolean}
 */
const isLetDeclareHeader = (header) =>
  header.type === "declaration" && header.kind === "let";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => boolean}
 */
const isStrictDeclarationHeader = (header) =>
  header.type === "declaration" && header.mode === "strict";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => boolean}
 */
const isSloppyDeclarationHeader = (header) =>
  header.type === "declaration" && header.mode === "sloppy";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => boolean}
 */
const isStrictVarDeclareHeader = (header) =>
  header.type === "declaration" &&
  header.kind === "var" &&
  header.mode === "strict";

/**
 * @type {(
 *   parameter: aran.Parameter,
 * ) => (
 *   header: import("./header").Header,
 * ) => boolean}
 */
const compileIsParameterHeader = (parameter) => (header) =>
  header.type === "parameter" && header.parameter === parameter;

const isThisHeader = compileIsParameterHeader("this");

const isImportHeader = compileIsParameterHeader("import");

const isImportMetaHeader = compileIsParameterHeader("import.meta");

const isNewTargetHeader = compileIsParameterHeader("new.target");

const isSuperGetHeader = compileIsParameterHeader("super.get");

const isSuperSetHeader = compileIsParameterHeader("super.set");

const isSuperCallHeader = compileIsParameterHeader("super.call");

/**
 * @type {(
 *   head: import("./header").Header[],
 *   situ: import("./situ").Situ,
 * ) => string[]}
 */
export const validateProgramHead = (head, situ) => [
  // mode //
  ...(isStrictSitu(situ) && some(head, isSloppyHeader)
    ? ["strict program should not contain sloppy header"]
    : []),
  // ambient //
  ...(isInternalSitu(situ) && some(head, isLookupHeader)
    ? ["internal program connnot contain lookup header"]
    : []),
  ...(isInternalSitu(situ) && some(head, isDeclarationHeader)
    ? ["internal program connnot contain lookup header"]
    : []),
  // module //
  ...(isModuleSitu(situ) && some(head, isModuleHeader)
    ? ["only module program may contain module header"]
    : []),
  // declaration //
  ...(some(head, isStrictDeclarationHeader) &&
  some(head, isSloppyDeclarationHeader)
    ? ["cannot mix strict and sloppy declaration header"]
    : []),
  ...(isModuleSitu(situ) && some(head, isDeclarationHeader)
    ? ["module program cannot contain declaration header"]
    : []),
  ...(isEvalSitu(situ) && some(head, isLetDeclareHeader)
    ? ["eval program cannot contain let-declaration header"]
    : []),
  ...(isEvalSitu(situ) && some(head, isStrictVarDeclareHeader)
    ? ["eval program cannot contain strict-var-declaration header"]
    : []),
  // private //
  ...(situ.root !== "external-local-eval" && some(head, isPrivateHeader)
    ? ["only external-local-eval rooted program may contain 'private' header"]
    : []),
  // this //
  ...(isInternalLocalEvalSitu(situ) && some(head, isThisHeader)
    ? ["internal-local-eval program should not redefine 'this'"]
    : []),
  // import //
  ...(isInternalLocalEvalSitu(situ) && some(head, isImportHeader)
    ? ["internal-local-eval program should not redefine 'import'"]
    : []),
  // import.meta //
  ...(situ.root !== "module" && some(head, isImportMetaHeader)
    ? ["only module-rooted program may define 'import.meta'"]
    : []),
  ...(isInternalLocalEvalSitu(situ) && some(head, isImportMetaHeader)
    ? ["internal-local-eval program should not redefine 'import.meta'"]
    : []),
  // new.target //
  ...(!isFunctionExternalLocalEvalSitu(situ) &&
  !isMethodExternalLocalEvalSitu(situ) &&
  !isConstructorExternalLocalEvalSitu(situ) &&
  some(head, isNewTargetHeader)
    ? [
        "new.target header should only appear in (function | method | constructor)",
      ]
    : []),
  // super.get //
  ...(!isMethodExternalLocalEvalSitu(situ) &&
  !isConstructorExternalLocalEvalSitu(situ) &&
  some(head, isSuperGetHeader)
    ? ["super.get header should only appear in (method | constructor)"]
    : []),
  // super.set //
  ...(!isMethodExternalLocalEvalSitu(situ) &&
  !isConstructorExternalLocalEvalSitu(situ) &&
  some(head, isSuperSetHeader)
    ? ["super.set header should only appear in (method | constructor)"]
    : []),
  // super.call //
  ...(!isConstructorExternalLocalEvalSitu(situ) && some(head, isSuperCallHeader)
    ? ["super.call header should only appear in constructor"]
    : []),
];

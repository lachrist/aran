/////////////////////
// ParameterHeader //
/////////////////////

/**
 * @type {(
 *   parameter: import("./header").HeaderParameter,
 * ) => import("./header").ParameterHeader}
 */
export const makeParameterHeader = (parameter) => ({
  type: "parameter",
  parameter,
});

/**
 * @type {Record<
 *   import("./header").HeaderParameter,
 *   aran.Parameter[]
 * >}
 */
const PARAM = {
  "this": ["this"],
  "new.target": ["new.target"],
  "import.meta": ["import.meta"],
  "import.dynamic": ["import.dynamic"],
  "super.get": ["super.get"],
  "super.set": ["super.set"],
  "super.call": ["super.call"],
  "private": ["private.has", "private.get", "private.set"],
  "lookup.strict": [
    "read.strict",
    "write.strict",
    "typeof.strict",
    "discard.strict",
  ],
  "lookup.sloppy": [
    "read.sloppy",
    "write.sloppy",
    "typeof.sloppy",
    "discard.sloppy",
  ],
};

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ParameterHeader}
 */
export const isParameterHeader = (header) => header.type === "parameter";

/**
 * @type {(
 *   header: import("./header").ParameterHeader,
 * ) => aran.Parameter[]}
 */
export const listHeaderParameter = (header) => PARAM[header.parameter];

///////////////////////
// DeclarationHeader //
///////////////////////

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").DeclareHeader}
 */
export const isDeclareHeader = (header) =>
  header.type === "declare.let" || header.type === "declare.var";

//////////////////
// LookupHeader //
//////////////////

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StaticLookupHeader}
 */
export const isStaticLookupHeader = (header) => header.type === "lookup.static";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").DynamicLookupHeader}
 */
export const isDynamicLookupHeader = (header) =>
  header.type === "lookup.dynamic";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader & {
 *   mode: "strict",
 * }}
 */
export const isStrictLookupHeader = (header) =>
  (header.type === "lookup.static" || header.type === "lookup.dynamic") &&
  header.mode === "strict";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader & {
 *   mode: "sloppy",
 * }}
 */
export const isSloppyLookupHeader = (header) =>
  (header.type === "lookup.static" || header.type === "lookup.dynamic") &&
  header.mode === "sloppy";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader}
 */
export const isLookupHeader = (header) =>
  header.type === "lookup.static" || header.type === "lookup.dynamic";

///////////////////
// PrivateHeader //
///////////////////

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StaticPrivateHeader}
 */
export const isStaticPrivateHeader = (header) =>
  header.type === "private.static";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").DynamicPrivateHeader}
 */
export const isDynamicPrivateHeader = (header) =>
  header.type === "private.dynamic";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").PrivateHeader}
 */
export const isPrivateHeader = (header) =>
  header.type === "private.static" || header.type === "private.dynamic";

//////////////////
// ModuleHeader //
//////////////////

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ModuleHeader}
 */
export const isModuleHeader = (header) =>
  header.type === "import" ||
  header.type === "export" ||
  header.type === "aggregate";

//////////
// Mode //
//////////

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").SloppyHeader}
 */
export const isSloppyHeader = (header) =>
  (header.type === "declare.let" ||
    header.type === "declare.var" ||
    header.type === "lookup.static" ||
    header.type === "lookup.dynamic") &&
  header.mode === "sloppy";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StrictHeader}
 */
export const isStrictHeader = (header) =>
  header.type === "import" ||
  header.type === "export" ||
  header.type === "aggregate" ||
  header.type === "private.static" ||
  header.type === "private.dynamic" ||
  ((header.type === "declare.let" ||
    header.type === "declare.var" ||
    header.type === "lookup.static" ||
    header.type === "lookup.dynamic") &&
    header.mode === "strict");

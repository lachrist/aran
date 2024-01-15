import { PARAMETER_RECORD } from "./lang.mjs";
import { hasNarrowKey, listKey } from "./util/index.mjs";

/** @type {Record<import("./header").StraightParameter, null>} */
const STRAIGHT_PARAMETER_RECORD = {
  "this": null,
  "import.dynamic": null,
  "import.meta": null,
  "new.target": null,
  "super.get": null,
  "super.set": null,
  "super.call": null,
};

export const STRAIGHT_PARAMETER_ENUM = listKey(STRAIGHT_PARAMETER_RECORD);

/** @type {Record<import("./header").PrivateParameter, null>} */
const PRIVATE_PARAMETER_RECORD = {
  "private.has": null,
  "private.get": null,
  "private.set": null,
};

/** @type {Record<import("./header").LookupParameter, null>} */
const LOOKUP_PARAMETER_RECORD = {
  "read.strict": null,
  "write.strict": null,
  "typeof.strict": null,
  "read.sloppy": null,
  "write.sloppy": null,
  "typeof.sloppy": null,
  "discard.sloppy": null,
};

/**
 * @type {(
 *   parameter: string,
 * ) => parameter is import("./header").StraightParameter}
 */
export const isStraightParameter = (parameter) =>
  hasNarrowKey(STRAIGHT_PARAMETER_RECORD, parameter);

/**
 * @type {(
 *   parameter: string,
 * ) => parameter is import("./header").LookupParameter}
 */
export const isLookupParameter = (parameter) =>
  hasNarrowKey(LOOKUP_PARAMETER_RECORD, parameter);

/**
 * @type {(
 *   parameter: string,
 * ) => parameter is import("./header").PrivateParameter}
 */
export const isPrivateParameter = (parameter) =>
  hasNarrowKey(PRIVATE_PARAMETER_RECORD, parameter);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ParameterHeader}
 */
export const isParameterHeader = (header) =>
  hasNarrowKey(PARAMETER_RECORD, header.type);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StraightHeader}
 */
export const isStraightHeader = (header) =>
  hasNarrowKey(STRAIGHT_PARAMETER_RECORD, header.type);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").PrivateHeader}
 */
export const isPrivateHeader = (header) =>
  hasNarrowKey(PRIVATE_PARAMETER_RECORD, header.type);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader}
 */
export const isLookupHeader = (header) =>
  hasNarrowKey(LOOKUP_PARAMETER_RECORD, header.type);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ModuleHeader}
 */
export const isModuleHeader = (header) =>
  header.type === "import" ||
  header.type === "export" ||
  header.type === "aggregate";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").DeclareHeader}
 */
export const isDeclareHeader = (header) =>
  header.type === "declare.strict" || header.type === "declare.sloppy";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").EvalHeader}
 */
export const isEvalHeader = (header) => header.type === "eval";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => boolean}
 */
export const isSloppyHeader = (header) =>
  header.type === "declare.sloppy" ||
  header.type === "typeof.sloppy" ||
  header.type === "discard.sloppy" ||
  header.type === "read.sloppy" ||
  header.type === "write.sloppy";

/**
 * @type {(
 *   parameter: import("./header").StraightParameter,
 * ) => import("./header").StraightHeader}
 */
export const makeStraightHeader = (parameter) => ({
  type: parameter,
});

import { AranTypeError } from "./error.mjs";
import { PARAMETER_ENUM } from "./lang.mjs";
import { hasOwn } from "./util/index.mjs";

/** @type {Record<import("./header").StraightParameter, null>} */
const STRAIGHT_PARAMETER_ENUM = {
  "this": null,
  "import.dynamic": null,
  "import.meta": null,
  "new.target": null,
  "super.get": null,
  "super.set": null,
  "super.call": null,
};

/** @type {Record<import("./header").PrivateParameter, null>} */
const PRIVATE_PARAMETER_ENUM = {
  "private.has": null,
  "private.get": null,
  "private.set": null,
};

/** @type {Record<import("./header").LookupParameter, null>} */
const LOOKUP_PARAMETER_ENUM = {
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
  hasOwn(STRAIGHT_PARAMETER_ENUM, parameter);

/**
 * @type {(
 *   parameter: string,
 * ) => parameter is import("./header").LookupParameter}
 */
export const isLookupParameter = (parameter) =>
  hasOwn(LOOKUP_PARAMETER_ENUM, parameter);

/**
 * @type {(
 *   parameter: string,
 * ) => parameter is import("./header").PrivateParameter}
 */
export const isPrivateParameter = (parameter) =>
  hasOwn(PRIVATE_PARAMETER_ENUM, parameter);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").ParameterHeader}
 */
export const isParameterHeader = (header) =>
  hasOwn(PARAMETER_ENUM, header.type);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StraightHeader}
 */
export const isStraightHeader = (header) =>
  hasOwn(STRAIGHT_PARAMETER_ENUM, header.type);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").PrivateHeader}
 */
export const isPrivateHeader = (header) =>
  hasOwn(PRIVATE_PARAMETER_ENUM, header.type);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader}
 */
export const isLookupHeader = (header) =>
  hasOwn(LOOKUP_PARAMETER_ENUM, header.type);

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StaticLookupHeader}
 */
export const isStaticLookupHeader = (header) =>
  isLookupHeader(header) && header.variable !== null;

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
 *   parameter: import("./header").HeaderParameter,
 * ) => import("./header").ParameterHeader}
 */
export const makeParameterHeader = (parameter) => {
  if (isLookupParameter(parameter)) {
    return {
      type: parameter,
      variable: null,
    };
  } else if (isPrivateParameter(parameter)) {
    return {
      type: parameter,
      key: null,
    };
  } else if (isStraightParameter(parameter)) {
    return {
      type: parameter,
    };
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StraightHeader}
 */
export const isStraightHeader = (header) =>
  header.type === "this" ||
  header.type === "import.dynamic" ||
  header.type === "import.meta" ||
  header.type === "new.target" ||
  header.type === "super.get" ||
  header.type === "super.set" ||
  header.type === "super.call";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").PrivateHeader}
 */
export const isPrivateHeader = (header) =>
  header.type === "private.has" ||
  header.type === "private.get" ||
  header.type === "private.set";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StaticPrivateHeader}
 */
export const isStaticPrivateHeader = (header) =>
  (header.type === "private.has" ||
    header.type === "private.get" ||
    header.type === "private.set") &&
  header.key !== null;

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader}
 */
export const isLookupHeader = (header) =>
  header.type === "read" ||
  header.type === "write" ||
  header.type === "typeof" ||
  header.type === "discard";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StaticLookupHeader}
 */
export const isStaticLookupHeader = (header) =>
  (header.type === "read" ||
    header.type === "write" ||
    header.type === "typeof" ||
    header.type === "discard") &&
  header.variable !== null;

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
export const isDeclareHeader = (header) => header.type === "declare";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => boolean}
 */
export const isDynamicHeader = (header) =>
  (header.type === "declare" && header.variable === null) ||
  (header.type === "read" && header.variable === null) ||
  (header.type === "write" && header.variable === null) ||
  (header.type === "typeof" && header.variable === null) ||
  (header.type === "discard" && header.variable === null) ||
  (header.type === "private.has" && header.key === null) ||
  (header.type === "private.get" && header.key === null) ||
  (header.type === "private.set" && header.key === null);

/**
 * @type {(
 *   header: import("./header").LookupHeader,
 * ) => import("./header").LookupParameter}
 */
export const getLookupParameter = (header) =>
  /** @type {any} */ (`${header.type}.${header.mode}`);

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   operation: "read" | "write" | "typeof" | "discard",
 *   variable: estree.Variable | null,
 * ) => import("./header").StaticLookupHeader | null}
 */
export const makeLookupHeader = (mode, operation, variable) => {
  if (mode === "strict" && operation === "discard") {
    return null;
  } else {
    return /** @type {any} */ ({
      type: operation,
      mode,
      variable,
    });
  }
};

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => import("./header").HeaderParameter[]}
 */
export const listParameter = (header) => {
  if (isStraightHeader(header) || isPrivateHeader(header)) {
    return [header.type];
  } else if (isLookupHeader(header)) {
    return [getLookupParameter(header)];
  } else {
    return [];
  }
};

/**
 * @type {(
 *   parameter: import("./header").StraightParameter,
 * ) => import("./header").StraightHeader}
 */
export const makeStraightHeader = (parameter) => ({
  type: parameter,
  mode: null,
});

import { flatMap, removeDuplicate } from "./util/index.mjs";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").StrictHeader}
 */
export const isStrictHeader = (header) => header.mode === "strict";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").SloppyHeader}
 */
export const isSloppyHeader = (header) => header.mode === "sloppy";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").DeclarationHeader}
 */
export const isDeclarationHeader = (header) => header.type === "declaration";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").LookupHeader}
 */
export const isLookupHeader = (header) => header.type === "lookup";

/**
 * @type {(
 *   header: import("./header").Header,
 * ) => header is import("./header").PrivateHeader}
 */
export const isPrivateHeader = (header) => header.type === "private";

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
 * ) => aran.Parameter[]}
 */
export const listHeaderParameter = (header) => {
  switch (header.type) {
    case "parameter": {
      return [header.parameter];
    }
    case "lookup": {
      return [
        `read.${header.mode}`,
        `write.${header.mode}`,
        `typeof.${header.mode}`,
        `discard.${header.mode}`,
      ];
    }
    case "private": {
      return ["private.has", "private.get", "private.set"];
    }
    default: {
      return [];
    }
  }
};

/**
 * @type {(
 *   head: import("./header").Header[],
 * ) => aran.Parameter[]}
 */
export const listHeadParameter = (head) =>
  removeDuplicate(flatMap(head, listHeaderParameter));

import { AranTypeError } from "../error.mjs";

const {
  Reflect: { apply },
  Number: {
    prototype: { toString },
  },
  String: {
    prototype: { replace, padStart, charCodeAt, startsWith },
  },
} = globalThis;

////////////
// escape //
////////////

const PAD = [4, "0"];

const HEX = [16];

const FIRST = [0];

/** @type {[RegExp, (match: string) => string]} */
const ESCAPE_DOT = [
  /\.|(_+)/gu,
  (match) => (match === "." ? "_" : `_${match}`),
];

/** @type {[RegExp, (match: string) => string]} */
const ESCAPE_ALL = [
  /[^a-zA-Z0-9]/gu,
  (character) =>
    `$${apply(
      padStart,
      apply(toString, apply(charCodeAt, character, FIRST), HEX),
      PAD,
    )}`,
];

/** @type {(input: string) => string} */
const escapeAll = (input) => apply(replace, input, ESCAPE_ALL);

/** @type {(input: string) => string} */
const escapeDot = (string) => apply(replace, string, ESCAPE_DOT);

///////////
// Label //
///////////

export const mangleLabel =
  /** @type {(input: rebuild.Label) => estree.Label} */ (
    /** @type {unknown} */ (escapeDot)
  );

//////////////
// Variable //
//////////////

export const INTRINSIC = "intrinsic";

const VARIABLE = "var";

const PARAMETER = "par";

const IMPORT = "imp";

const EXPORT = "exp";

/**
 * @type {(
 *   variable: rebuild.Variable,
 * ) => string}
 */
export const mangleVariable = (variable) =>
  `${VARIABLE}_${escapeDot(variable)}`;

/**
 * @type {(
 *   parameter: aran.Parameter,
 * ) => string}
 */
export const mangleParameter = (parameter) =>
  `${PARAMETER}_${escapeDot(parameter)}`;

/**
 * @type {(
 *   source: estree.Source,
 *   specifier: estree.Specifier | null,
 *   escape: estree.Variable,
 * ) => string}
 */
export const mangleImport = (source, specifier, escape) => {
  if (specifier === null) {
    return `${IMPORT}_${escape}_${escapeAll(source)}`;
  } else {
    return `${IMPORT}_${escape}_${escapeAll(source)}_${escapeAll(specifier)}`;
  }
};

/**
 * @type {(
 *   specifier: estree.Specifier,
 *   escape: estree.Variable,
 * ) => string}
 */
export const mangleExport = (specifier, escape) =>
  `${EXPORT}_${escape}_${escapeAll(specifier)}`;

/**
 * @type {(
 *   variable: estree.Variable,
 *   config: import("./config").Config,
 * ) => import("./clash").Clash | null}
 */
export const checkClash = (variable, { intrinsic, escape }) => {
  if (variable === intrinsic) {
    return {
      type: "intrinsic",
      variable,
    };
  } else if (apply(startsWith, variable, [`${IMPORT}_${escape}_`])) {
    return {
      type: "import",
      variable,
      escape,
    };
  } else if (apply(startsWith, variable, [`${EXPORT}_${escape}_`])) {
    return {
      type: "export",
      variable,
      escape,
    };
  } else {
    return null;
  }
};

/**
 * @type {(
 *   clash: import("./clash").Clash,
 * ) => string}
 */
export const reportClash = (clash) => {
  if (clash.type === "intrinsic") {
    return `External variable '${clash.variable}' clashes with reserved intrinsinc variable, you can solve this by picking another name for config.intrinsic`;
  } else if (clash.type === "export") {
    return `External variable '${clash.variable}' clashes with export escape prefix '${EXPORT}_${clash.escape}_', you can solve this by picking another name for config.escape`;
  } else if (clash.type === "import") {
    return `External variable '${clash.variable}' clashes with import escape prefix '${IMPORT}_${clash.escape}_', you can solve this by picking another name for config.escape`;
  } else {
    throw new AranTypeError(clash);
  }
};

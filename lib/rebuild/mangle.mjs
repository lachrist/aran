const {
  Reflect: { apply },
  Number: {
    prototype: { toString },
  },
  String: {
    prototype: { replace, padStart, charCodeAt },
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

/**
 * @type {(
 *   escape: import("./context").Escape,
 *   head: "var" | "prm" | "imp" | "exp",
 *   body: string,
 * ) => estree.Variable}
 */
const mangle = (escape, head, body) =>
  /** @type {estree.Variable} */ (`${escape}${head}_${body}`);

/**
 * @type {(
 *   variable: rebuild.Variable,
 *   escape: import("./context").Escape,
 * ) => estree.Variable}
 */
export const mangleVariable = (variable, escape) =>
  mangle(escape, "var", /** @type {estree.Variable} */ (escapeDot(variable)));

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   escape: import("./context").Escape,
 * ) => estree.Variable}
 */
export const mangleParameter = (parameter, escape) =>
  mangle(escape, "prm", /** @type {estree.Variable} */ (escapeDot(parameter)));

/**
 * @type {(
 *   source: estree.Source,
 *   specifier: estree.Specifier | null,
 *   escape: import("./context").Escape,
 * ) => estree.Variable}
 */
export const mangleImport = (source, specifier, escape) =>
  mangle(
    escape,
    "imp",
    /** @type {estree.Variable} */ (
      specifier === null
        ? escapeAll(source)
        : `${escapeAll(source)}_${escapeAll(specifier)}`
    ),
  );

/**
 * @type {(
 *   specifier: estree.Specifier,
 *   escape: import("./context").Escape,
 * ) => estree.Variable}
 */
export const mangleExport = (specifier, escape) =>
  mangle(escape, "exp", /** @type {estree.Variable} */ (escapeAll(specifier)));

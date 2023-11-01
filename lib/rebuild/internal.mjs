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
 *   head: estree.Variable,
 *   body: estree.Variable,
 * ) => estree.Variable}
 */
const append = (head, body) =>
  /** @type {estree.Variable} */ (`${head}_${body}`);

/**
 * @type {(
 *   escape: estree.Variable,
 *   kind: "reg" | "imp" | "exp" | "prm" | "arg",
 *   variable: estree.Variable,
 * ) => estree.Variable}
 */
const mangleInternal = (escape, kind, variable) =>
  append(append(escape, /** @type {estree.Variable} */ (kind)), variable);

////////////
// Escape //
////////////

/**
 * @type {(
 *   source: estree.Source,
 *   specifier: estree.Specifier | null,
 *   options: { escape: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleImport = (source, specifier, { escape }) =>
  mangleInternal(
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
 *   options: { escape: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleExport = (specifier, { escape }) =>
  mangleInternal(
    escape,
    "exp",
    /** @type {estree.Variable} */ (escapeAll(specifier)),
  );

/**
 * @type {(
 *   variable: rebuild.Variable,
 *   options: { escape: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleRegular = (variable, { escape }) =>
  mangleInternal(
    escape,
    "reg",
    /** @type {estree.Variable} */ (escapeDot(variable)),
  );

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   options: { escape: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleParameter = (parameter, { escape }) =>
  mangleInternal(
    escape,
    "prm",
    /** @type {estree.Variable} */ (escapeDot(parameter)),
  );

/**
 * @type {(
 *   argument: "src" | "key" | "val" | "arg" | "mtd" | "var" | "obj",
 *   options: { escape: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleArgument = (argument, { escape }) =>
  mangleInternal(escape, "arg", /** @type {estree.Variable} */ (argument));

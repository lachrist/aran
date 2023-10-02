import { AranError } from "../error.mjs";

const {
  Reflect: { apply },
  Number: { toString },
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
 *   prefix: estree.Variable,
 *   kind: "reg" | "imp" | "exp" | "prm" | "arg",
 *   variable: estree.Variable,
 * ) => estree.Variable}
 */
const mangleInternal = (prefix, kind, variable) =>
  append(append(prefix, /** @type {estree.Variable} */ (kind)), variable);

/**
 * @type {(
 *   variable: estree.Variable,
 *   options: { intrinsic: estree.Variable, prefix: estree.Variable },
 * ) => void}
 */
export const checkExternal = (variable, { intrinsic, prefix }) => {
  if (variable === intrinsic) {
    throw new AranError(
      `external variable clashes with intrinsic name: ${variable}`,
    );
  }
  if (apply(startsWith, variable, [prefix])) {
    throw new AranError(
      `external variable clashes with internal prefix: ${variable}`,
    );
  }
};

////////////
// Escape //
////////////

/**
 * @type {(
 *   source: estree.Source,
 *   specifier: estree.Specifier | null,
 *   options: { prefix: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleImport = (source, specifier, { prefix }) =>
  mangleInternal(
    prefix,
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
 *   options: { prefix: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleExport = (specifier, { prefix }) =>
  mangleInternal(
    prefix,
    "exp",
    /** @type {estree.Variable} */ (escapeAll(specifier)),
  );

/**
 * @type {(
 *   variable: rebuild.Variable,
 *   options: { prefix: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleRegular = (variable, { prefix }) =>
  mangleInternal(
    prefix,
    "reg",
    /** @type {estree.Variable} */ (escapeDot(variable)),
  );

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   options: { prefix: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleParameter = (parameter, { prefix }) =>
  mangleInternal(
    prefix,
    "prm",
    /** @type {estree.Variable} */ (escapeDot(parameter)),
  );

/**
 * @type {(
 *   argument: "src" | "key" | "val" | "arg" | "mtd" | "var" | "obj",
 *   options: { prefix: estree.Variable },
 * ) => estree.Variable}
 */
export const mangleArgument = (argument, { prefix }) =>
  mangleInternal(prefix, "arg", /** @type {estree.Variable} */ (argument));

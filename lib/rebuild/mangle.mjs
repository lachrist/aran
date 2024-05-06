// estree.Identifier should only be constructed in this file.

import { AranClashError } from "../error.mjs";

const {
  RegExp: {
    prototype: { test: testRegExp },
  },
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

/**
 * @type {(
 *   label: rebuild.Label,
 * ) => estree.Identifier}
 */
export const mangleLabel = (label) => ({
  type: "Identifier",
  name: escapeDot(label),
});

/////////
// Key //
/////////

/**
 * @type {(
 *   key: estree.Key,
 * ) => estree.Identifier}
 */
export const mangleKey = (key) => ({
  type: "Identifier",
  name: key,
});

///////////////
// Specifier //
///////////////

const variable_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

/**
 * @type {(
 *   specifier: estree.Specifier
 * ) => estree.Identifier}
 */
export const mangleSpecifier = (specifier) => {
  if (apply(testRegExp, variable_regexp, [specifier])) {
    return {
      type: "Identifier",
      name: specifier,
    };
  } else {
    return /** @type {any} */ ({
      type: "Literal",
      value: specifier,
    });
  }
};

///////////////////
// Meta Property //
///////////////////

/**
 * @type {estree.Expression}
 */
export const NEW_TARGET = {
  type: "MetaProperty",
  meta: {
    type: "Identifier",
    name: "new",
  },
  property: {
    type: "Identifier",
    name: "target",
  },
};

/**
 * @type {estree.Expression}
 */
export const IMPORT_META = {
  type: "MetaProperty",
  meta: {
    type: "Identifier",
    name: "import",
  },
  property: {
    type: "Identifier",
    name: "meta",
  },
};

//////////////
// Variable //
//////////////

const INTRINSIC = "itr";

const VARIABLE = "var";

const PARAMETER = "par";

const EAGER = "eag";

const IMPORT = "imp";

const EXPORT = "exp";

const ARGUMENT = "arg";

/**
 * @type {estree.Identifier}
 */
export const EVAL_IDENTIFIER = {
  type: "Identifier",
  name: "eval",
};

/**
 * @type {(
 *   variable: estree.Variable,
 *   config: import("./config").Config,
 * ) => estree.Identifier}
 */
export const mangleExternal = (
  variable,
  { escape_prefix, intrinsic_variable },
) => {
  if (apply(startsWith, variable, [escape_prefix])) {
    throw new AranClashError(
      `External variable '${variable}' clashes with escape prefix '${escape_prefix}'`,
    );
  } else if (variable === intrinsic_variable) {
    throw new AranClashError(
      `External variable '${variable}' clashes with reserved intrinsic variable`,
    );
  } else {
    return {
      type: "Identifier",
      name: variable,
    };
  }
};

/**
 * @type {(
 *   variable: rebuild.Variable,
 *   config: import("./config").Config,
 * ) => estree.Identifier}
 */
export const mangleVariable = (variable, { escape_prefix }) => ({
  type: "Identifier",
  name: `${escape_prefix}${VARIABLE}_${escapeDot(variable)}`,
});

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => estree.Identifier}
 */
export const mangleIntrinsic = ({ escape_prefix }) => ({
  type: "Identifier",
  name: `${escape_prefix}${INTRINSIC}`,
});

/**
 * @type {(
 *  intrinsic_variable: estree.Variable,
 * ) => estree.Identifier}
 */
export const mangleExternalIntrinsic = (intrinsic_variable) => ({
  type: "Identifier",
  name: intrinsic_variable,
});

/**
 * @type {(
 *   parameter: aran.Parameter,
 *   config: import("./config").Config,
 * ) => estree.Identifier}
 */
export const mangleParameter = (parameter, { escape_prefix }) => ({
  type: "Identifier",
  name: `${escape_prefix}${PARAMETER}_${escapeDot(parameter)}`,
});

/**
 * @type {(
 *   parameter: (
 *     | "scope.read"
 *     | "scope.write"
 *     | "scope.typeof"
 *     | "scope.discard"
 *     | "private.get"
 *     | "private.set"
 *     | "private.has"
 *   ),
 *   config: import("./config").Config,
 * ) => estree.Identifier}
 */
export const mangleEager = (parameter, { escape_prefix }) => ({
  type: "Identifier",
  name: `${escape_prefix}${EAGER}_${escapeDot(parameter)}`,
});

/**
 * @type {(
 *   source: estree.Source,
 *   specifier: estree.Specifier | null,
 *   config: import("./config").Config,
 * ) => estree.Identifier}
 */
export const mangleImport = (source, specifier, { escape_prefix }) => {
  if (specifier === null) {
    return {
      type: "Identifier",
      name: `${escape_prefix}${IMPORT}_${escapeAll(source)}`,
    };
  } else {
    return {
      type: "Identifier",
      name: `${escape_prefix}${IMPORT}_${escapeAll(source)}_${escapeAll(
        specifier,
      )}`,
    };
  }
};

/**
 * @type {(
 *   argument: string,
 *   config: import("./config").Config,
 * ) => estree.Identifier}
 */
export const mangleArgument = (argument, { escape_prefix }) => ({
  type: "Identifier",
  name: `${escape_prefix}${ARGUMENT}_${escapeDot(argument)}`,
});

/**
 * @type {(
 *   specifier: estree.Specifier,
 *   config: import("./config").Config,
 * ) => estree.Identifier}
 */
export const mangleExport = (specifier, { escape_prefix }) => ({
  type: "Identifier",
  name: `${escape_prefix}${EXPORT}_${escapeAll(specifier)}`,
});

// import("../estree").Identifier should only be constructed in this file.

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
 *   label: import("./atom").Label,
 * ) => import("../estree").LabelIdentifier}
 */
export const mangleLabel = (label) => ({
  type: "Identifier",
  name: /** @type {import("../estree").Label} */ (escapeDot(label)),
});

/////////
// Key //
/////////

/**
 * @type {(
 *   key: import("../estree").PublicKey,
 * ) => import("../estree").PublicKeyIdentifier}
 */
export const manglePublicKey = (key) => ({
  type: "Identifier",
  name: key,
});

///////////////
// Specifier //
///////////////

const variable_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

/**
 * @type {(
 *   specifier: import("../estree").Specifier
 * ) => (
 *   | import("../estree").SpecifierIdentifier
 *   | import("../estree").SpecifierLiteral
 * )}
 */
export const mangleSpecifier = (specifier) => {
  if (apply(testRegExp, variable_regexp, [specifier])) {
    return {
      type: "Identifier",
      name: specifier,
    };
  } else {
    return {
      type: "Literal",
      value: specifier,
    };
  }
};

///////////////////
// Meta Property //
///////////////////

/**
 * @type {import("../estree").Expression}
 */
export const NEW_TARGET = {
  type: "MetaProperty",
  meta: {
    type: "Identifier",
    name: /** @type {import("../estree").Meta} */ ("new"),
  },
  property: {
    type: "Identifier",
    name: /** @type {import("../estree").Meta} */ ("target"),
  },
};

/**
 * @type {import("../estree").Expression}
 */
export const IMPORT_META = {
  type: "MetaProperty",
  meta: {
    type: "Identifier",
    name: /** @type {import("../estree").Meta} */ ("import"),
  },
  property: {
    type: "Identifier",
    name: /** @type {import("../estree").Meta} */ ("meta"),
  },
};

//////////////
// Variable //
//////////////

const INTRINSIC = "itr";

const VARIABLE = "var";

const PARAMETER = "par";

const RECORD = "rec";

const EVAL = "evl";

const IMPORT = "imp";

const EXPORT = "exp";

const ARGUMENT = "arg";

/**
 * @type {import("../estree").VariableIdentifier}
 */
export const EVAL_IDENTIFIER = {
  type: "Identifier",
  name: /** @type {import("../estree").Variable} */ ("eval"),
};

/**
 * @type {(
 *   variable: import("../estree").Variable,
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
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
 *   variable: import("../estree").Variable,
 *   config: import("./config").Config,
 * ) => string | null}
 */
export const formatClashMessage = (
  variable,
  { escape_prefix, intrinsic_variable },
) => {
  if (apply(startsWith, variable, [escape_prefix])) {
    return `External variable '${variable}' clashes with escape '${escape_prefix}'`;
  } else if (variable === intrinsic_variable) {
    return `External variable '${variable}' clashes with intrinsic variable`;
  } else {
    return null;
  }
};

/**
 * @type {(
 *   variable: import("./atom").Variable,
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleVariable = (variable, { escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("../estree").Variable} */ (
    `${escape_prefix}${VARIABLE}_${escapeDot(variable)}`
  ),
});

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleIntrinsic = ({ escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("../estree").Variable} */ (
    `${escape_prefix}${INTRINSIC}`
  ),
});

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleEval = ({ escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("../estree").Variable} */ (`${escape_prefix}${EVAL}`),
});

/**
 * @type {(
 *  intrinsic_variable: import("../estree").Variable,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleExternalIntrinsic = (intrinsic_variable) => ({
  type: "Identifier",
  name: intrinsic_variable,
});

/**
 * @type {(
 *   parameter: import("../lang").Parameter,
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleParameter = (parameter, { escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("../estree").Variable} */ (
    `${escape_prefix}${PARAMETER}_${escapeDot(parameter)}`
  ),
});

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleRecord = ({ escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("../estree").Variable} */ (
    `${escape_prefix}${RECORD}`
  ),
});

/**
 * @type {(
 *   source: import("../estree").Source,
 *   specifier: import("../estree").Specifier | null,
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleImport = (source, specifier, { escape_prefix }) => {
  if (specifier === null) {
    return {
      type: "Identifier",
      name: /** @type {import("../estree").Variable} */ (
        `${escape_prefix}${IMPORT}_${escapeAll(source)}`
      ),
    };
  } else {
    return {
      type: "Identifier",
      name: /** @type {import("../estree").Variable} */ (
        `${escape_prefix}${IMPORT}_${escapeAll(source)}_${escapeAll(specifier)}`
      ),
    };
  }
};

/**
 * @type {(
 *   argument: string,
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleArgument = (argument, { escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("../estree").Variable} */ (
    `${escape_prefix}${ARGUMENT}_${escapeDot(argument)}`
  ),
});

/**
 * @type {(
 *   specifier: import("../estree").Specifier,
 *   config: import("./config").Config,
 * ) => import("../estree").VariableIdentifier}
 */
export const mangleExport = (specifier, { escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("../estree").Variable} */ (
    `${escape_prefix}${EXPORT}_${escapeAll(specifier)}`
  ),
});

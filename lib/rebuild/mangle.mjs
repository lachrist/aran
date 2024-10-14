// import("estree-sentry").Identifier<{}> should only be constructed in this file.

import { AranClashError } from "../error.mjs";
import { checkClash } from "./clash.mjs";

const {
  RegExp: {
    prototype: { test: testRegExp },
  },
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

/**
 * @type {(
 *   label: import("./atom").Label,
 * ) => import("estree-sentry").LabelIdentifier<{}>}
 */
export const mangleLabel = (label) => ({
  type: "Identifier",
  name: /** @type {import("estree-sentry").LabelName} */ (escapeDot(label)),
});

///////////////
// Specifier //
///////////////

const specifier_name_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

/**
 * @type {(
 *   specifier: (
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 * ) => specifier is import("estree-sentry").SpecifierName}
 */
const isSpecifierName = (specifier) =>
  apply(testRegExp, specifier_name_regexp, [specifier]);

/**
 * @type {(
 *   specifier: (
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 * ) => (
 *   | import("estree-sentry").SpecifierIdentifier<{}>
 *   | import("estree-sentry").SpecifierLiteral<{}>
 * )}
 */
export const mangleSpecifier = (specifier) => {
  if (isSpecifierName(specifier)) {
    return {
      type: "Identifier",
      name: /** @type {import("estree-sentry").SpecifierName} */ (specifier),
    };
  } else {
    return {
      type: "Literal",
      value: specifier,
      raw: null,
      bigint: null,
      regex: null,
    };
  }
};

///////////////////
// Meta Property //
///////////////////

/**
 * @type {import("estree-sentry").Expression<{}>}
 */
export const NEW_TARGET = {
  type: "MetaProperty",
  meta: {
    type: "Identifier",
    name: "new",
  },
  property: {
    type: "Identifier",
    name: /** @type {import("estree-sentry").PublicKeyName} */ ("target"),
  },
};

/**
 * @type {import("estree-sentry").Expression<{}>}
 */
export const IMPORT_META = {
  type: "MetaProperty",
  meta: {
    type: "Identifier",
    name: "import",
  },
  property: {
    type: "Identifier",
    name: /** @type {import("estree-sentry").PublicKeyName} */ ("meta"),
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
 * @type {import("estree-sentry").VariableIdentifier<{}>}
 */
export const EVAL_IDENTIFIER = {
  type: "Identifier",
  name: /** @type {import("estree-sentry").VariableName} */ ("eval"),
};

/**
 * @type {(
 *   variable: import("estree-sentry").VariableName,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleExternal = (variable, config) => {
  const clash = checkClash(variable, config);
  if (clash) {
    throw new AranClashError(clash);
  } else {
    return {
      type: "Identifier",
      name: variable,
    };
  }
};

/**
 * @type {(
 *   variable: import("./atom").Variable,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleVariable = (variable, { escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("estree-sentry").VariableName} */ (
    `${escape_prefix}${VARIABLE}_${escapeDot(variable)}`
  ),
});

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleIntrinsic = ({ escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("estree-sentry").VariableName} */ (
    `${escape_prefix}${INTRINSIC}`
  ),
});

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleEval = ({ escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("estree-sentry").VariableName} */ (
    `${escape_prefix}${EVAL}`
  ),
});

/**
 * @type {(
 *  intrinsic_variable: import("estree-sentry").VariableName,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleExternalIntrinsic = (intrinsic_variable) => ({
  type: "Identifier",
  name: intrinsic_variable,
});

/**
 * @type {(
 *   parameter: import("../lang/syntax").Parameter,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleParameter = (parameter, { escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("estree-sentry").VariableName} */ (
    `${escape_prefix}${PARAMETER}_${escapeDot(parameter)}`
  ),
});

/**
 * @type {(
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleRecord = ({ escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("estree-sentry").VariableName} */ (
    `${escape_prefix}${RECORD}`
  ),
});

/**
 * @type {(
 *   source: import("estree-sentry").SourceValue,
 *   specifier: (
 *     | null
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleImport = (source, specifier, { escape_prefix }) => {
  if (specifier === null) {
    return {
      type: "Identifier",
      name: /** @type {import("estree-sentry").VariableName} */ (
        `${escape_prefix}${IMPORT}_${escapeAll(source)}`
      ),
    };
  } else {
    return {
      type: "Identifier",
      name: /** @type {import("estree-sentry").VariableName} */ (
        `${escape_prefix}${IMPORT}_${escapeAll(source)}_${escapeAll(specifier)}`
      ),
    };
  }
};

/**
 * @type {(
 *   argument: string,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleArgument = (argument, { escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("estree-sentry").VariableName} */ (
    `${escape_prefix}${ARGUMENT}_${escapeDot(argument)}`
  ),
});

/**
 * @type {(
 *   specifier: (
 *     | import("estree-sentry").SpecifierName
 *     | import("estree-sentry").SpecifierValue
 *   ),
 *   config: import("./config").Config,
 * ) => import("estree-sentry").VariableIdentifier<{}>}
 */
export const mangleExport = (specifier, { escape_prefix }) => ({
  type: "Identifier",
  name: /** @type {import("estree-sentry").VariableName} */ (
    `${escape_prefix}${EXPORT}_${escapeAll(specifier)}`
  ),
});

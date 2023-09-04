const {
  parseInt,
  Reflect: { apply },
  Number: {
    prototype: { toString },
  },
  String: {
    fromCharCode,
    prototype: { charCodeAt, padStart, replace, substring },
  },
} = globalThis;

const ADVICE = "a";

const COMPLETION = "c";

const CALLEE = "f";

const SERIAL = "s";

const LABEL = "l";

const PARAMETER = "p";

const SHADOW = "_";

const ORIGINAL = "$";

////////////
// Encode //
////////////

const PAD = [4, "0"];

const FIRST = [0];

const HEX = [16];

/** @type {(character: string) => string} */
const escapeCharacter = (character) =>
  `$${apply(
    padStart,
    apply(toString, apply(charCodeAt, character, FIRST), HEX),
    PAD,
  )}`;

const ESCAPE = [/[^a-zA-Z0-9]/gu, escapeCharacter];

/** @type {(print: string) => Variable} */
const sanitize = (string) => apply(replace, string, ESCAPE);

////////////
// Decode //
////////////

/** @type {(_match: string, sequence: string) => string} */
const unescapeCharacter = (_match, sequence) =>
  fromCharCode(parseInt(sequence));

const UNESCAPE = [/[$]([0-9a-fA-F]{4})/gu, unescapeCharacter];

/** @type {(variable: Variable) => string} */
const unsanitize = (variable) => apply(replace, variable, UNESCAPE);

////////////
// Mangle //
////////////

export const ADVICE_VARIABLE = /** @type {Variable} */ (ADVICE);

export const COMPLETION_VARIABLE = /** @type {Variable} */ (COMPLETION);

/** @type {(path: string) => Variable} */
export const mangleCalleeVariable = (path) =>
  /** @type {Variable} */ (`${CALLEE}${path}`);

/** @type {(parameter: Parameter | null) => Variable} */
export const mangleParameterVariable = (parameter) =>
  /** @type {Variable} */ (
    parameter === null ? PARAMETER : `${parameter}${parameter}`
  );

/** @type {(print: string) => Variable} */
export const mangleSerialVariable = (print) =>
  /** @type {Variable} */ (`${SERIAL}${sanitize(print)}`);

/** @type {(label: Label) => Variable} */
export const mangleLabelVariable = (label) =>
  /** @type {Variable} */ (`${LABEL}${label}`);

/** @type {(variable: Variable) => Variable} */
export const mangleShadowVariable = (variable) =>
  /** @type {Variable} */ (`${SHADOW}${variable}`);

/** @type {(variable: Variable) => Variable} */
export const mangleOriginalVariable = (variable) =>
  /** @type {Variable} */ (`${ORIGINAL}${variable}`);

///////////
// Query //
///////////

/** @type {(prefix: string) => (variable: Variable) => boolean} */
const compileIsVariable = (prefix) => (variable) => variable[0] === prefix;

export const isSerialVariable = compileIsVariable(SERIAL);

export const isLabelVariable = compileIsVariable(LABEL);

export const isParameterVariable = compileIsVariable(PARAMETER);

export const isShadowVariable = compileIsVariable(SHADOW);

export const isOriginalVariable = compileIsVariable(ORIGINAL);

export const isCalleeVariable = compileIsVariable(CALLEE);

export const isAdviceVariable = compileIsVariable(ADVICE);

export const isCompletionVariable = compileIsVariable(COMPLETION);

//////////////
// Unmangle //
//////////////

const ONE = [1];

/** @type {(variable: Variable) => string | null} */
export const unmangleSerialVariable = (variable) =>
  variable[0] === SERIAL ? unsanitize(apply(substring, variable, ONE)) : null;

const {
  undefined,
  parseInt,
  Reflect: { apply },
  Number: {
    prototype: { toString },
  },
  String: {
    fromCharCode,
    prototype: { substring, startsWith, charCodeAt, padStart, replace },
  },
  JSON: { parse: parseJson, stringify: stringifyJson },
} = globalThis;

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

/** @type {(dirty: string) => string} */
const sanitize = (dirty) => apply(replace, dirty, ESCAPE);

////////////
// Decode //
////////////

/** @type {(_match: string, sequence: string) => string} */
const unescapeCharacter = (_match, sequence) =>
  fromCharCode(parseInt(sequence));

const UNESCAPE = [/[$]([0-9a-fA-F]{4})/gu, unescapeCharacter];

/** @type {(clean: string) => string} */
const unsanitize = (clean) => apply(replace, clean, UNESCAPE);

////////////
// Mangle //
////////////

const CALLEE_PREFIX = "callee.";
const SERIAL_PREFIX = "serial.";
const ORIGINAL_PREFIX = "original.";

const ORIGINAL_PREFIX_SINGLETON = [ORIGINAL_PREFIX];
const ORIGINAL_PREFIX_LENGTH_SINGLETON = [ORIGINAL_PREFIX.length];

const SERIAL_PREFIX_SINGLETON = [SERIAL_PREFIX];
const SERIAL_PREFIX_LENGTH_SINGLETON = [SERIAL_PREFIX.length];

export const ADVICE_VARIABLE = /** @type {weave.Variable} */ ("advice");

export const COMPLETION_VARIABLE = /** @type {weave.Variable} */ ("completion");

export const FRAME_VARIABLE = /** @type {weave.Variable} */ ("frame");

/** @type {(path: string) => weave.Variable} */
export const mangleCalleeVariable = (path) =>
  /** @type {weave.Variable} */ (`${CALLEE_PREFIX}${path}`);

/** @type {(variable: unbuild.Variable) => weave.Variable} */
export const mangleOriginalVariable = (variable) =>
  /** @type {weave.Variable} */ (`${ORIGINAL_PREFIX}${variable}`);

/** @type {(variable: weave.Variable) => unbuild.Variable | null} */
export const unmangleOriginalVariable = (variable) =>
  apply(startsWith, variable, ORIGINAL_PREFIX_SINGLETON)
    ? apply(substring, variable, ORIGINAL_PREFIX_LENGTH_SINGLETON)
    : null;

/** @type {<S extends Json>(serial: S) => weave.Variable} */
export const mangleSerialVariable = (serial) =>
  /** @type {weave.Variable} */ (
    `${SERIAL_PREFIX}${sanitize(stringifyJson(serial))}`
  );

/** @type {<S extends Json>(variable: weave.Variable) => S | undefined} */
export const unmangleSerialVariable = (variable) =>
  apply(startsWith, variable, SERIAL_PREFIX_SINGLETON)
    ? parseJson(
        unsanitize(apply(substring, variable, SERIAL_PREFIX_LENGTH_SINGLETON)),
      )
    : undefined;

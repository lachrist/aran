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

export const ADVICE_VARIABLE = /** @type {weave.ResVariable} */ ("advice");

export const COMPLETION_VARIABLE = /** @type {weave.ResVariable} */ (
  "completion"
);

export const FRAME_VARIABLE = /** @type {weave.ResVariable} */ ("frame");

/** @type {(path: string) => weave.ResVariable} */
export const mangleCalleeVariable = (path) =>
  /** @type {weave.ResVariable} */ (`${CALLEE_PREFIX}${path}`);

/** @type {(variable: weave.ArgVariable) => weave.ResVariable} */
export const mangleOriginalVariable = (variable) =>
  /** @type {weave.ResVariable} */ (`${ORIGINAL_PREFIX}${variable}`);

/** @type {(variable: weave.ResVariable) => weave.ArgVariable | null} */
export const unmangleOriginalVariable = (variable) =>
  apply(startsWith, variable, ORIGINAL_PREFIX_SINGLETON)
    ? apply(substring, variable, ORIGINAL_PREFIX_LENGTH_SINGLETON)
    : null;

/** @type {<L extends Json>(location: L) => weave.ResVariable} */
export const mangleLocationVariable = (location) =>
  /** @type {weave.ResVariable} */ (
    `${SERIAL_PREFIX}${sanitize(stringifyJson(location))}`
  );

/** @type {<S extends Json>(variable: weave.ResVariable) => S | undefined} */
export const unmangleSerialVariable = (variable) =>
  apply(startsWith, variable, SERIAL_PREFIX_SINGLETON)
    ? parseJson(
        unsanitize(apply(substring, variable, SERIAL_PREFIX_LENGTH_SINGLETON)),
      )
    : undefined;

const {
  Reflect: { apply },
  String: {
    prototype: { replace, substring },
  },
} = globalThis;

const ONE = [1];

/** @type {[RegExp, (match: string) => string]} */
const ESCAPE = [/\.|(_+)/gu, (match) => (match === "." ? "_" : `_${match}`)];

/** @type {[RegExp, (match: string) => string]} */
const UNESCAPE = [
  /_+/gu,
  (match) => (match === "_" ? "." : apply(substring, match, ONE)),
];

/** @type {(input: string) => string} */
export const escapeDot = (string) => apply(replace, string, ESCAPE);

/** @type {(input: string) => string} */
export const unescapeDot = (string) => apply(replace, string, UNESCAPE);

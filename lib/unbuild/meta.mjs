const {
  Math: { floor },
} = globalThis;

const RADIX = 32;

/**
 * @type {string[]}
 */
const MAPPING = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

/**
 * @type {(
 *   tail: number
 * ) => string}
 */
const to32String = (tail) => {
  if (tail < RADIX) {
    return MAPPING[tail];
  } else {
    // eslint-disable-next-line no-bitwise
    return `${to32String(floor(tail / RADIX))}$${MAPPING[tail % RADIX]}`;
  }
};

/** @type {import("./meta").Meta} */
export const ROOT_META = {
  body: "",
  tail: 0,
};

/**
 * @type {(
 *   meta: import("./meta").Meta,
 * ) => import("./meta").Meta}
 */
export const nextMeta = ({ body, tail }) => ({
  body,
  tail: tail + 1,
});

/**
 * @type {(
 *   meta: import("./meta").Meta,
 * ) => import("./meta").Meta}
 */
export const forkMeta = ({ body, tail }) => ({
  body: `${body}${to32String(tail)}`,
  tail: 0,
});

/**
 * @type {(
 *   meta: import("./meta").Meta,
 * ) => string}
 */
export const finalizeMeta = ({ body, tail }) => `${body}${to32String(tail)}`;

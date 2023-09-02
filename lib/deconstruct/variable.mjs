import { DynamicError } from "../util/error.mjs";

const {
  String: {
    prototype: { substring },
  },
  Reflect: { apply },
} = globalThis;

const ONE = [1];

const META = "_";

const BASE = "$";

const ORIGINAL = "O";

const DEADZONE = "X";

/** @type {(head: string) => (body: string) => string} */
const compilePrepend = (head) => (body) => `${head}${body}`;

/** @type {(head: string) => (variable: string) => boolean} */
const compileTest = (head) => (variable) => variable[0] === head;

/** @type {(head1: string, head2: string) => (variable: string) => boolean} */
const compileTestDouble = (head1, head2) => (variable) =>
  variable[0] === head1 && variable[1] === head2;

export const mangleMetaVariable = compilePrepend(META);

export const mangleBaseOriginalVariable = compilePrepend(`${BASE}${ORIGINAL}`);

export const mangleBaseDeadzoneVariable = compilePrepend(`${BASE}${DEADZONE}`);

export const mangleOriginalVariable = compilePrepend(ORIGINAL);

export const isMetaVariable = compileTest(META);

export const isBaseVariable = compileTest(BASE);

export const isBaseOriginalVariable = compileTestDouble(BASE, ORIGINAL);

export const isBaseDeadzoneVariable = compileTestDouble(BASE, DEADZONE);

/** @type {(variable: string) => string} */
export const unmangleVariable = (variable) => {
  if (variable[0] === META) {
    return apply(substring, variable, ONE);
  } else if (variable[0] === BASE) {
    return apply(substring, variable, ONE);
  } else {
    throw new DynamicError("invalid variable layer", variable);
  }
};

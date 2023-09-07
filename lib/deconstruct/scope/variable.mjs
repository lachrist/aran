import { DynamicError } from "../../util/error.mjs";

const {
  String: {
    prototype: { substring },
  },
  Reflect: { apply },
} = globalThis;

const ONE = [1];

const TWO = [2];

const META = "_";

const BASE = "$";

const ORIGINAL = "O";

const DEADZONE = "X";

/** @type {(head: string) => (body: string) => Variable} */
const compilePrepend = (head) => (body) =>
  /** @type {Variable} */ (`${head}${body}`);

/** @type {(head: string) => (variable: Variable) => boolean} */
const compileTest = (head) => (variable) => variable[0] === head;

/** @type {(head1: string, head2: string) => (variable: Variable) => boolean} */
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

/**
 * @type {(variable: Variable) => {
 *   layer: "base" | "meta",
 *   deadzone: boolean,
 *   body: string,
 * }}
 */
export const unmangleVariable = (variable) => {
  if (variable[0] === BASE) {
    if (variable[1] === ORIGINAL) {
      return {
        layer: "base",
        deadzone: false,
        body: apply(substring, variable, TWO),
      };
    } else if (variable[1] === DEADZONE) {
      return {
        layer: "base",
        deadzone: true,
        body: apply(substring, variable, TWO),
      };
    } else {
      throw new DynamicError("invalid variable deadzone", variable);
    }
  } else if (variable[0] === META) {
    return {
      layer: "meta",
      deadzone: false,
      body: apply(substring, variable, ONE),
    };
  } else {
    throw new DynamicError("invalid variable layer", variable);
  }
};

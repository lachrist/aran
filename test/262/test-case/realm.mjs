import { createContext, runInContext } from "node:vm";
import { writeSync } from "node:fs";
import { inspect } from "node:util";
import { recreateError } from "../util/index.mjs";

const { gc, Reflect } = globalThis;

/**
 * @type {(
 *   value: unknown
 * ) => void}
 */
const dir = (value) => {
  writeSync(1, inspect(value, { depth: null, colors: true }) + "\n");
};

/**
 * @type {(
 *   value: unknown
 * ) => void}
 */
const log = (message) => {
  writeSync(1, message + "\n");
};

/**
 * @type {<X>(
 *   state: X,
 *   dependencies: {
 *     print: (message: string) => void,
 *     prepare: import("../staging/stage").Prepare<X>,
 *     signalNegative: (message: string) => Error,
 *   },
 * ) => import("../$262").$262}
 */
export const createRealm = (state, { prepare, print, signalNegative }) => {
  const context = createContext({ __proto__: null });
  /** @type {globalThis} */
  const global = runInContext("this;", context);
  const { SyntaxError } = global;
  /** @type {import("../$262").$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    createRealm: () => createRealm(state, { prepare, print, signalNegative }),
    detachArrayBuffer: () => {
      throw signalNegative("detachArrayBuffer");
    },
    // We have no information on the location of this.
    // so we do not have to register this script to the
    // linker because dynamic import is pointless.
    evalScript: (code) => {
      try {
        return runInContext(code, context, {
          filename: "dynamic://script",
        });
      } catch (error) {
        throw recreateError(error, {
          SyntaxError,
          AranSyntaxError: SyntaxError,
        });
      }
    },
    gc: () => {
      if (typeof gc === "function") {
        return gc();
      } else {
        throw signalNegative("gc");
      }
    },
    global,
    /** @returns {object} */
    get IsHTMLDDA() {
      throw signalNegative("IsHTMLDDA");
    },
    /** @type {import("../$262").Agent} */
    get agent() {
      throw signalNegative("agent");
    },
    get AbstractModuleSource() {
      throw signalNegative("AbstractModuleSource");
    },
    aran: { context, log, dir, signalNegative },
  };
  Reflect.defineProperty(context, "$262", {
    // @ts-ignore
    __proto__: null,
    configurable: true,
    enumerable: false,
    writable: true,
    value: $262,
  });
  Reflect.defineProperty(context, "print", {
    // @ts-ignore
    __proto__: null,
    configurable: true,
    enumerable: false,
    writable: true,
    value: print,
  });
  prepare(state, context);
  return $262;
};

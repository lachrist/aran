import { createContext, runInContext } from "node:vm";
import { harmonizeSyntaxError } from "../syntax-error.mjs";

const {
  gc,
  Reflect,
  console: { log, dir },
} = globalThis;

/**
 * @type {(
 *   dependencies: {
 *     print: (message: string) => void,
 *     setup: (context: import("node:vm").Context) => void,
 *     signalNegative: (message: string) => Error,
 *   },
 * ) => import("../test262").$262}
 */
export const createRealm = ({ setup, print, signalNegative }) => {
  const context = createContext({ __proto__: null });
  /** @type {globalThis} */
  const global = runInContext("this;", context);
  const { SyntaxError } = global;
  /** @type {import("../test262").$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    createRealm: () => createRealm({ setup, print, signalNegative }),
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
        throw harmonizeSyntaxError(error, SyntaxError);
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
    // eslint-disable-next-line local/no-function
    get IsHTMLDDA() {
      throw signalNegative("IsHTMLDDA");
    },
    /** @type {import("../test262").Agent} */
    // eslint-disable-next-line local/no-function
    get agent() {
      throw signalNegative("agent");
    },
    // eslint-disable-next-line local/no-function
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
  setup(context);
  return $262;
};

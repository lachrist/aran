import { createContext, runInContext } from "node:vm";

const { gc, Reflect, URL } = globalThis;

/* eslint-disable */
export const AranRealmError = class AranRealmError extends Error {
  constructor(/** @type {string} */ message) {
    super(message);
    this.name = "AranRealmError";
  }
};
/* eslint-enable */

/**
 * @type {(
 *   options: {
 *     counter: { value: number },
 *     report: (error: Error) => void,
 *     record: import("./stage").Instrument,
 *     warning: "ignore" | "console",
 *     print: (message: string) => void,
 *     compileInstrument: import("./stage").CompileInstrument,
 *   },
 * ) => {
 *   context: import("node:vm").Context,
 *   instrument: import("./stage").Instrument,
 * }}
 */
export const createRealm = ({
  counter,
  report,
  record,
  warning,
  print,
  compileInstrument,
}) => {
  const context = createContext({ __proto__: null });
  /** @type {import("./stage").$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    createRealm: () =>
      createRealm({
        counter,
        report,
        record,
        warning,
        print,
        compileInstrument,
      }).context.$262,
    detachArrayBuffer: () => {
      const error = new AranRealmError("detachArrayBuffer");
      report(error);
      throw error;
    },
    // we have no information on the location of this.
    // so we do not have to register this script to the
    // linker because dynamic import is pointless.
    evalScript: (code) => {
      counter.value += 1;
      // eslint-disable-next-line no-use-before-define
      const { url, content } = instrument({
        kind: "script",
        url: new URL(`script:///${counter.value}`),
        content: code,
      });
      return runInContext(content, context, { filename: url.href });
    },
    gc: () => {
      if (typeof gc === "function") {
        return gc();
      } else {
        const error = new AranRealmError("gc");
        report(error);
        throw error;
      }
    },
    global: runInContext("this;", context),
    /** @returns {object} */
    // eslint-disable-next-line local/no-function
    get IsHTMLDDA() {
      const error = new AranRealmError("IsHTMLDDA");
      report(error);
      throw error;
    },
    /** @type {import("./stage").Agent} */
    // eslint-disable-next-line local/no-function
    get agent() {
      const error = new AranRealmError("agent");
      report(error);
      throw error;
    },
    // eslint-disable-next-line local/no-function
    get AbstractModuleSource() {
      const error = new AranRealmError("AbstractModuleSource");
      report(error);
      throw error;
    },
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
  const instrument = compileInstrument({
    record,
    report,
    warning,
    context,
  });
  return { context, instrument };
};

import { createContext, runInContext } from "node:vm";
import { AranTestError } from "./error.mjs";

const { gc, Reflect, URL } = globalThis;

/**
 * @type {(
 *   options: {
 *     counter: { value: number },
 *     reject: (reason: string) => void,
 *     report: (error: Error) => void,
 *     record: import("./types").Instrument,
 *     warning: "ignore" | "console",
 *     print: (message: string) => void,
 *     compileInstrument: import("./types").CompileInstrument,
 *   },
 * ) => import("node:vm").Context & {
 *   $262: import("./types").$262 & {
 *     instrument: import("./types").Instrument,
 *   },
 * }}
 */
export const createRealm = ({
  counter,
  reject,
  report,
  record,
  warning,
  print,
  compileInstrument,
}) => {
  const context = createContext({ __proto__: null });
  const instrument = compileInstrument({
    reject,
    record,
    report,
    warning,
    context,
  });
  /** @type {import("./types").$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    instrument,
    createRealm: () =>
      createRealm({
        counter,
        reject,
        report,
        record,
        warning,
        print,
        compileInstrument,
      }).$262,
    detachArrayBuffer: () => {
      reject("detach-array-buffer");
      throw new AranTestError("detachArrayBuffer");
    },
    // we have no information on the location of this.
    // so we do not have to register this script to the
    // linker because dynamic import is pointless.
    evalScript: (code) => {
      counter.value += 1;
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
        reject("gc");
        throw new AranTestError("gc");
      }
    },
    global: runInContext("this;", context),
    // eslint-disable-next-line local/no-function
    get isHTMLDDA() {
      reject("isHTMLDDA");
      throw new AranTestError("isHTMLDDA");
    },
    /** @type {import("./types").Agent} */
    // eslint-disable-next-line local/no-function
    get agent() {
      reject("agent");
      throw new AranTestError("agent");
    },
    // eslint-disable-next-line local/no-function
    get AbstractModuleSource() {
      reject("AbstractModuleSource");
      throw new AranTestError("AbstractModuleSource");
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
  return /** @type {any} */ (context);
};

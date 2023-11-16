import { createContext, runInContext } from "node:vm";

const { gc, Object, Error, Reflect, URL } = globalThis;

// eslint-disable-next-line local/no-class, local/standard-declaration
class RealmAranError extends Error {}

/**
 * @type {(
 *   options: {
 *     counter: { value: number },
 *     reject: (error: Error) => void,
 *     warning: "silent" | "console",
 *     print: (message: string) => void,
 *     createInstrumenter: test262.Stage["createInstrumenter"],
 *   },
 * ) => import("node:vm").Context & {
 *   $262: test262.$262 & {
 *     instrument: test262.Instrument,
 *   },
 * }}
 */
export const createRealm = ({
  counter,
  reject,
  warning,
  print,
  createInstrumenter,
}) => {
  const { instrument, setup, globals } = createInstrumenter({
    reject,
    warning,
  });
  const context = createContext({ __proto__: null });
  for (const [name, descriptor] of Object.entries(globals)) {
    Reflect.defineProperty(context, name, descriptor);
  }
  /** @type {test262.$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    instrument,
    createRealm: () =>
      createRealm({
        counter,
        reject,
        warning,
        print,
        createInstrumenter,
      }).$262,
    detachArrayBuffer: () => {},
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
        const error = new RealmAranError("gc");
        reject(error);
        throw error;
      }
    },
    global: runInContext("this;", context),
    // eslint-disable-next-line local/no-function
    get isHTMLDDA() {
      const error = new RealmAranError("isHTMLDDA");
      reject(error);
      throw error;
    },
    /** @type {test262.Agent} */
    // eslint-disable-next-line local/no-function
    get agent() {
      const error = new RealmAranError("agent");
      reject(error);
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
  runInContext(setup, context);
  return /** @type {any} */ (context);
};

import { createContext, runInContext } from "node:vm";

const { gc, Reflect } = globalThis;

/**
 * @type {(
 *   options: {
 *     context: object,
 *     origin: URL,
 *     print: (message: string) => void,
 *     RealmError: new (feature: test262.RealmFeature) => Error,
 *     instrumenter: test262.Instrumenter,
 *   },
 * ) => test262.$262}
 */
export const createRealm = ({
  context,
  origin,
  print,
  RealmError,
  instrumenter,
}) => {
  const { instrument, setup, globals } = instrumenter;
  createContext(context);
  for (const [name, value] of globals) {
    Reflect.defineProperty(context, name, {
      // @ts-ignore
      __proto__: null,
      configurable: false,
      enumerable: false,
      writable: false,
      value,
    });
  }
  runInContext(setup, context);
  /** @type {import("./types.js").$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    createRealm: () =>
      createRealm({
        context: { __proto__: null },
        origin,
        print,
        RealmError,
        instrumenter,
      }),
    detachArrayBuffer: () => {
      throw new RealmError("detachArrayBuffer");
    },
    // we have no information on the location of this.
    // so we do not have to register this script to the
    // linker because dynamic import is pointless.
    evalScript: (code) =>
      runInContext(instrument(code, "script"), context, {
        filename: `${origin.href} >> evalScript`,
      }),
    gc: () => {
      if (typeof gc === "function") {
        return gc();
      } else {
        throw new RealmError("gc");
      }
    },
    global: runInContext("this;", context),
    get isHTMLDDA() {
      throw new RealmError("isHTMLDDA");
    },
    /** @type {any} */
    get agent() {
      throw new RealmError("agent");
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
  return $262;
};

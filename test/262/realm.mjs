import { createContext, runInContext } from "node:vm";

const { gc, Reflect } = globalThis;

/**
 * @type {(
 *   options: {
 *     context: object,
 *     origin: URL,
 *     print: (message: string) => void,
 *     makeRealmError: (feature: test262.RealmFeature) => Error,
 *     instrumenter: test262.Instrumenter,
 *   },
 * ) => test262.$262}
 */
export const createRealm = ({
  context,
  origin,
  print,
  makeRealmError,
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
  let counter = 0;
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
        makeRealmError,
        instrumenter,
      }),
    detachArrayBuffer: () => {
      throw makeRealmError("detachArrayBuffer");
    },
    // we have no information on the location of this.
    // so we do not have to register this script to the
    // linker because dynamic import is pointless.
    evalScript: (code) => {
      counter += 1;
      return runInContext(
        instrument(code, { kind: "script", specifier: counter }),
        context,
        {
          filename: `${origin.href} >> evalScript#${counter}`,
        },
      );
    },
    gc: () => {
      if (typeof gc === "function") {
        return gc();
      } else {
        throw makeRealmError("gc");
      }
    },
    global: runInContext("this;", context),
    // eslint-disable-next-line local/no-function
    get isHTMLDDA() {
      throw makeRealmError("isHTMLDDA");
    },
    /** @type {any} */
    // eslint-disable-next-line local/no-function
    get agent() {
      throw makeRealmError("agent");
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

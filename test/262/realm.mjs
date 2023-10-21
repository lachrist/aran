import { createContext, runInContext } from "node:vm";

const { gc, Error, Reflect } = globalThis;

// eslint-disable-next-line local/no-class, local/standard-declaration
class RealmAranError extends Error {}

/**
 * @type {(
 *   options: {
 *     context: object,
 *     origin: URL,
 *     print: (message: string) => void,
 *     instrumenter: test262.Instrumenter,
 *   },
 * ) => test262.$262}
 */
export const createRealm = ({ context, origin, print, instrumenter }) => {
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
  /** @type {test262.$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    createRealm: () =>
      createRealm({
        context: { __proto__: null },
        origin,
        print,
        instrumenter,
      }),
    detachArrayBuffer: () => {},
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
        throw new RealmAranError("gc");
      }
    },
    global: runInContext("this;", context),
    // eslint-disable-next-line local/no-function
    get isHTMLDDA() {
      throw new RealmAranError("isHTMLDDA");
    },
    /** @type {test262.Agent} */
    // eslint-disable-next-line local/no-function
    get agent() {
      throw new RealmAranError("agent");
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

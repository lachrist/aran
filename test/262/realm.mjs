import { createContext, runInContext } from "node:vm";

const { gc, Reflect } = globalThis;

/**
 * @type {(
 *   options: {
 *     context: object,
 *     origin: URL,
 *     print: (message: string) => void,
 *     RealmError: new (feature: import("./types").RealmFeature) => Error,
 *     instrument: (code: string, kind: "script" | "module") => string,
 *   },
 * ) => import("./types").$262}
 */
export const createRealm = ({
  context,
  origin,
  print,
  RealmError,
  instrument,
}) => {
  createContext(context);
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
        instrument,
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
    configurable: true,
    enumerable: false,
    writable: true,
    value: $262,
  });
  Reflect.defineProperty(context, "print", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: print,
  });
  return $262;
};

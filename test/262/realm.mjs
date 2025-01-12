import { createContext, runInContext } from "node:vm";
import { harmonizeSyntaxError } from "./syntax-error.mjs";

const {
  gc,
  Reflect,
  console: { log, dir },
} = globalThis;

/**
 * @type {(
 *   dependencies: {
 *     print: (message: string) => void,
 *     report: import("./report").Report,
 *     setup: (context: import("node:vm").Context) => void,
 *     instrument: import("./stage").Instrument,
 *   },
 * ) => import("./test262").$262}
 */
export const createRealm = ({ setup, print, report, instrument }) => {
  const context = createContext({ __proto__: null });
  /** @type {globalThis} */
  const global = runInContext("this;", context);
  const { SyntaxError } = global;
  /** @type {import("./test262").$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    createRealm: () => createRealm({ setup, print, report, instrument }),
    detachArrayBuffer: () => {
      throw report("AranRealmError", "detachArrayBuffer");
    },
    // We have no information on the location of this.
    // so we do not have to register this script to the
    // linker because dynamic import is pointless.
    evalScript: (content1) => {
      try {
        const { path: path2, content: content2 } = instrument({
          type: "dynamic",
          kind: "script",
          path: "dynamic://script",
          content: content1,
        });
        return runInContext(content2, context, {
          filename: path2,
        });
      } catch (error) {
        throw harmonizeSyntaxError(error, SyntaxError);
      }
    },
    gc: () => {
      if (typeof gc === "function") {
        return gc();
      } else {
        throw report("AranRealmError", "gc");
      }
    },
    global,
    /** @returns {object} */
    // eslint-disable-next-line local/no-function
    get IsHTMLDDA() {
      throw report("AranRealmError", "IsHTMLDDA");
    },
    /** @type {import("./test262").Agent} */
    // eslint-disable-next-line local/no-function
    get agent() {
      throw report("AranRealmError", "agent");
    },
    // eslint-disable-next-line local/no-function
    get AbstractModuleSource() {
      throw report("AranRealmError", "AbstractModuleSource");
    },
    aran: { context, log, dir, report },
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

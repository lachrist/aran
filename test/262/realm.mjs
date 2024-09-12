import { createContext, runInContext } from "node:vm";
import { AranTypeError } from "./error.mjs";

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
 * ) => import("node:vm").Context}
 */
export const createRealm = ({ setup, print, report, instrument }) => {
  const context = createContext({ __proto__: null });
  const global = runInContext("this;", context);
  const { SyntaxError } = global;
  /** @type {import("./test262").$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    createRealm: () =>
      createRealm({ setup, print, report, instrument }).context.$262,
    detachArrayBuffer: () => {
      throw report("AranRealmError", "detachArrayBuffer");
    },
    // We have no information on the location of this.
    // so we do not have to register this script to the
    // linker because dynamic import is pointless.
    evalScript: (code) => {
      const outcome = instrument({
        type: "global",
        kind: "script",
        path: null,
        content: code,
        context: null,
      });
      switch (outcome.type) {
        case "success": {
          return runInContext(outcome.data.content, context, {
            filename: outcome.data.location ?? "[evalScript]",
          });
        }
        case "failure": {
          if (outcome.data.name === "SyntaxError") {
            throw new SyntaxError(outcome.data);
          } else {
            throw report(
              /** @type {import("./report").ReportName} */ (outcome.data.name),
              outcome.data.message,
            );
          }
        }
        default: {
          throw new AranTypeError(outcome);
        }
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
    aran: {
      log,
      dir,
      report,
      instrumentEvalCode: (content, context) => {
        const outcome = instrument(
          context === null
            ? {
                type: "global",
                kind: "eval",
                path: null,
                content,
                context,
              }
            : {
                type: "local",
                kind: "eval",
                path: null,
                content,
                context,
              },
        );
        switch (outcome.type) {
          case "success": {
            return outcome.data.content;
          }
          case "failure": {
            if (outcome.data.name === "SyntaxError") {
              throw new SyntaxError(outcome.data);
            } else {
              throw report(
                /** @type {import("./report").ReportName} */ (
                  outcome.data.name
                ),
                outcome.data.message,
              );
            }
          }
          default: {
            throw new AranTypeError(outcome);
          }
        }
      },
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
  setup(context);
  return context;
};

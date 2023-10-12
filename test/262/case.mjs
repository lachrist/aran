import {
  createContext,
  runInContext,
  Script,
  SourceTextModule,
  SyntheticModule,
} from "node:vm";
import { readFile } from "node:fs/promises";

/**
 * @type {(
 *   context: object,
 *   print: (message: string) => void,
 *   RealmError: new (feature: import("./types").RealmFeature) => Error,
 * ) => import("./types").$262}
 */
export const createRealm = (context, print, RealmError) => {
  createContext(context);
  Reflect.defineProperty(context, "print", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: print,
  });
  /** @type {import("./types.js").$262} */
  const $262 = {
    // @ts-ignore
    __proto__: null,
    createRealm: () => createRealm({ __proto__: null }, print, Error),
    detachArrayBuffer: () => {
      throw new RealmError("detachArrayBuffer");
    },
    evalScript: (code) => runInContext(code, context),
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
  return $262;
};

/**
 * @type {() => {
 *   done: Promise<import("./types").TestError[]>,
 *   print: (message: string) => void,
 * }}
 */
const makeAsynchronousTermination = () => {
  /** @type {(errors: import("./types").TestError[]) => void} */
  let resolve;
  return {
    done: new Promise((resolve_) => {
      resolve = resolve_;
    }),
    print: (message) => {
      if (typeof message === "string") {
        // console.log(message);
        if (message === "Test262:AsyncTestComplete") {
          resolve([]);
        }
        if (message.startsWith("Test262:AsyncTestFailure:")) {
          resolve([
            {
              type: "async",
              message,
            },
          ]);
        }
      } else {
        resolve([
          {
            type: "inspect",
            message: "message is not a string",
          },
        ]);
      }
    },
  };
};

/**
 * @type {() => {
 *   done: Promise<import("./types").TestError[]>,
 *   print: (message: string) => void,
 * }}
 */
const makeSynchronousTermination = () => {
  /** @type {import("./types").TestError[]} */
  const errors = [];
  return {
    done: Promise.resolve(errors),
    print: (message) => {
      if (typeof message === "string") {
        // console.log(message);
        if (message.startsWith("Test262:AsyncTestFailure:")) {
          errors.push({
            type: "async",
            message,
          });
        }
      } else {
        errors.push({
          type: "inspect",
          message: "message is not a string",
        });
      }
    },
  };
};

/** @type {Map<string, string>} */
const cache = new Map();

/** @type {(url: URL) => Promise<string>} */
const readFileCache = async (url) => {
  const cached = cache.get(url.href);
  if (cached === undefined) {
    const content = await readFile(url, "utf8");
    cache.set(url.href, content);
    return content;
  } else {
    return cached;
  }
};

/**
 * @type {(
 *   type: "harness" | "parse" | "resolution" | "runtime",
 *   error: unknown,
 * ) => import("./types").TestError}
 */
const parseError = (type, error) => {
  try {
    return {
      type,
      error: {
        name: String(/** @type {any} */ (error).constructor.name),
        message: String(/** @type {any} */ (error).message),
        stack:
          /** @type {any} */ (error).stack == null
            ? null
            : String(/** @type {any} */ (error).stack),
      },
    };
  } catch {
    return {
      type: "inspect",
      message: "failed to parse error",
    };
  }
};

/**
 * @type {(
 *   options: import("./types").TestCase,
 * ) => Promise<import("./types").TestError[]>}
 */
export const runTestCase = async ({
  url,
  content,
  asynchronous,
  includes,
  module,
}) => {
  /** @type {import("./types").TestError[]} */
  const errors = [];
  const { done, print } = asynchronous
    ? makeAsynchronousTermination()
    : makeSynchronousTermination();
  const context = { __proto__: null };
  createRealm(
    context,
    print,
    class RealmError extends Error {
      /** @param {import("./types").RealmFeature} feature */
      constructor(feature) {
        super(`$262.${feature} is not implemented`);
        this.name = "RealmError";
        errors.push({
          type: "realm",
          feature,
        });
      }
    },
  );
  for (const url of includes) {
    try {
      runInContext(await readFileCache(url), context);
    } catch (error) {
      errors.push(parseError("harness", error));
    }
  }
  if (errors.length === 0) {
    /**
     * @type {WeakMap<
     *   import("node:vm").Module | import("node:vm").Script,
     *   URL
     * >}
     */
    const urls = new WeakMap();
    /** @type {Map<string, import("node:vm").Module>} */
    const cache = new Map();
    /**
     * @type {(
     *   specifier: string,
     *   parent: import("node:vm").Module | import("node:vm").Script,
     *   _assertions: object,
     * ) => Promise<import("node:vm").Module>}
     */
    const linker = async (specifier, parent, _assertions) => {
      const url = new URL(specifier, /** @type {URL} */ (urls.get(parent)));
      let module = cache.get(url.href);
      if (module === undefined) {
        const content = await readFile(url, "utf8");
        if (url.href.endsWith(".json")) {
          module = new SyntheticModule(
            ["default"],
            () => {
              /** @type {import("node:vm").SyntheticModule} */ (
                module
              ).setExport("default", JSON.parse(content));
            },
            { context },
          );
        } else {
          module = new SourceTextModule(content, {
            context,
            importModuleDynamically: /** @type {any} */ (linker),
          });
          await module.link(linker);
        }
        await module.evaluate();
        urls.set(module, url);
        cache.set(url.href, module);
      }
      return module;
    };
    if (module) {
      try {
        /** @type {import("node:vm").Module} */
        const module = new SourceTextModule(content, {
          context,
          importModuleDynamically: /** @type {any} */ (linker),
        });
        cache.set(url.href, module);
        urls.set(module, url);
        try {
          await module.link(linker);
          try {
            await module.evaluate();
          } catch (error) {
            errors.push(parseError("runtime", error));
          }
        } catch (error) {
          errors.push(parseError("resolution", error));
        }
      } catch (error) {
        errors.push(parseError("parse", error));
      }
    } else {
      try {
        const script = new Script(content, {
          importModuleDynamically: /** @type {any} */ (linker),
        });
        urls.set(script, url);
        try {
          script.runInContext(context);
        } catch (error) {
          errors.push(parseError("runtime", error));
        }
      } catch (error) {
        errors.push(parseError("parse", error));
      }
    }
  }
  if (errors.length === 0) {
    errors.push(...(await done));
  }
  return errors;
};

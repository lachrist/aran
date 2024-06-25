import { readFile } from "node:fs";
import {
  runInContext,
  Script,
  SourceTextModule,
  SyntheticModule,
} from "node:vm";

const { Error, undefined, URL, Map, JSON } = globalThis;

/**
 * @type {(
 *   source: {
 *     url: URL,
 *     content: string,
 *   },
 *   options: {
 *     instrument: import("./types").Instrument,
 *     context: import("node:vm").Context,
 *     link: import("./linker").Link,
 *   },
 * ) => import("node:vm").Module}
 */
const makeModule = (
  { url: url1, content: content1 },
  { instrument, context, link },
) => {
  if (url1.href.endsWith(".json")) {
    const module = new SyntheticModule(
      ["default"],
      () => {
        /** @type {import("node:vm").SyntheticModule} */ (module).setExport(
          "default",
          JSON.parse(content1),
        );
      },
      { identifier: url1.href, context },
    );
    return module;
  } else {
    const { url: url2, content: content2 } = instrument({
      kind: "module",
      url: url1,
      content: content1,
    });
    return new SourceTextModule(content2, {
      identifier: url2.href,
      context,
      importModuleDynamically: /** @type {any} */ (link),
    });
  }
};

/**
 * @type {(
 *   options: {
 *     context: object,
 *     instrument: import("./types").Instrument,
 *   },
 * ) => {
 *   link: import("./linker").Link,
 *   register: import("./linker").Register,
 * }}
 */
export const compileLinker = ({ context, instrument }) => {
  // Use promise of the module realm and not the main realm.
  // Still not working because node is changing the promise.
  //   https://github.com/nodejs/node/issues/53575
  const Promise = /** @type {PromiseConstructor} */ (
    runInContext("Promise;", context)
  );
  /** @type {Map<import("node:vm").Module | import("node:vm").Script, URL>} */
  const urls = new Map();
  /** @type {Map<string, import("node:vm").Module>} */
  const modules = new Map();
  /** @type {import("./linker").Link} */
  const link = (specifier, referrer, _assertions) =>
    new Promise((resolve, reject) => {
      try {
        const referrer_url = urls.get(referrer);
        if (referrer_url === undefined) {
          throw new Error("missing referrer url");
        } else {
          // import("") will import self
          const url = new URL(specifier, referrer_url);
          const module = modules.get(url.href);
          if (module === undefined) {
            readFile(url, "utf8", (error, content) => {
              try {
                if (error) {
                  throw error;
                } else {
                  const module = makeModule(
                    { url, content },
                    { instrument, context, link },
                  );
                  const race_module = modules.get(url.href);
                  if (race_module !== undefined) {
                    resolve(race_module);
                  } else {
                    urls.set(module, url);
                    modules.set(url.href, module);
                    resolve(module);
                  }
                }
              } catch (error) {
                reject(error);
              }
            });
          } else {
            resolve(module);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  return {
    link,
    register: (main, url) => {
      urls.set(main, url);
      if (!(main instanceof Script)) {
        modules.set(url.href, main);
      }
    },
  };
};

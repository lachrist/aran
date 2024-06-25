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
 *     importModuleDynamically: any,
 *   },
 * ) => import("node:vm").Module}
 */
const makeModule = (
  { url: url1, content: content1 },
  { instrument, context, importModuleDynamically },
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
      importModuleDynamically,
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
                    // eslint-disable-next-line no-use-before-define
                    { instrument, context, importModuleDynamically },
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
  // https://github.com/nodejs/node/issues/33216#issuecomment-623039235
  /** @type {import("./linker").Link} */
  const importModuleDynamically = (specifier, referrer, assertions) =>
    new Promise((resolve, reject) => {
      link(specifier, referrer, assertions).then((module) => {
        if (module.status === "unlinked") {
          module.link(link).then(() => {
            if (module.status === "linked") {
              try {
                module.evaluate().then(() => {
                  resolve(module);
                }, reject);
              } catch (error) {
                console.log("WESH", error);
              }
            } else {
              resolve(module);
            }
          }, reject);
        } else if (module.status === "linked") {
          module.evaluate().then(() => {
            resolve(module);
          }, reject);
        } else {
          resolve(module);
        }
      }, reject);
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

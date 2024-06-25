import { readFile } from "node:fs/promises";
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
 *     importModuleDynamically: import("./linker").Load,
 *     context: import("node:vm").Context,
 *   },
 * ) => import("node:vm").Module}
 */
const makeModule = (
  { url: url1, content: content1 },
  { instrument, importModuleDynamically, context },
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
      // eslint-disable-next-line object-shorthand
      importModuleDynamically: /** @type {any} */ (importModuleDynamically),
    });
  }
};

/**
 * @type {(
 *   options: {
 *     context: object,
 *     instrument: import("./types").Instrument,
 *   },
 * ) => import("./linker").Linker}
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
  /** @type {import("./linker").Load} */
  const link = async (specifier, referrer, _assertions) => {
    const referrer_url = urls.get(referrer);
    if (referrer_url === undefined) {
      throw new Error("missing referrer url");
    } else {
      // import("") will import self
      const url = new URL(specifier, referrer_url);
      const module = modules.get(url.href);
      if (module === undefined) {
        const content = await readFile(url, "utf8");
        const module = makeModule(
          { url, content },
          // eslint-disable-next-line no-use-before-define
          { instrument, importModuleDynamically, context },
        );
        const race_module = modules.get(url.href);
        if (race_module !== undefined) {
          return race_module;
        } else {
          urls.set(module, url);
          modules.set(url.href, module);
          return module;
        }
      } else {
        return module;
      }
    }
  };
  // https://github.com/nodejs/node/issues/33216#issuecomment-623039235
  /** @type {import("./linker").Load} */
  const evaluate = async (specifier, referrer, assertions) => {
    const module = await link(specifier, referrer, assertions);
    if (module.status === "unlinked") {
      await module.link(link);
    }
    if (module.status === "linked") {
      await module.evaluate();
    }
    return module;
  };
  /** @type {import("./linker").Load} */
  const importModuleDynamically = (specifier, referrer, assertions) =>
    new Promise((resolve, reject) => {
      evaluate(specifier, referrer, assertions).then(resolve, reject);
    });
  return {
    link,
    importModuleDynamically,
    register: (main, url) => {
      urls.set(main, url);
      if (!(main instanceof Script)) {
        modules.set(url.href, main);
      }
    },
  };
};

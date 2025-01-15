import {
  runInContext,
  Script,
  SourceTextModule,
  SyntheticModule,
} from "node:vm";
import { harmonizeSyntaxError } from "../syntax-error.mjs";

const { Error, undefined, Map, JSON } = globalThis;

/**
 * @type {(
 *   dependency: {
 *     path: import("../fetch").DependencyPath,
 *     content: string,
 *   },
 *   options: {
 *     SyntaxError: SyntaxErrorConstructor,
 *     instrument: import("../stagging/stage").Instrument,
 *     importModuleDynamically: import("./linker").Load,
 *     context: import("node:vm").Context,
 *   },
 * ) => import("node:vm").Module}
 */
const makeModule = (
  { path: path1, content: content1 },
  { SyntaxError, instrument, importModuleDynamically, context },
) => {
  try {
    if (path1.endsWith(".json")) {
      const module = new SyntheticModule(
        ["default"],
        () => {
          /** @type {import("node:vm").SyntheticModule} */ (module).setExport(
            "default",
            JSON.parse(content1),
          );
        },
        { identifier: path1, context },
      );
      return module;
    } else {
      const { content: content2, path: path2 } = instrument({
        type: "dependency",
        kind: "module",
        path: path1,
        content: content1,
      });
      return new SourceTextModule(content2, {
        identifier: path2,
        context,
        // eslint-disable-next-line object-shorthand
        importModuleDynamically: /** @type {any} */ (importModuleDynamically),
      });
    }
  } catch (error) {
    throw harmonizeSyntaxError(error, SyntaxError);
  }
};

/**
 * @type {(
 *   context: import("node:vm").Context,
 *   dependencies: {
 *     resolveDependency: import("../fetch").ResolveDependency,
 *     instrument: import("../stagging/stage").Instrument,
 *     fetchTarget: import("../fetch").FetchTarget,
 *   },
 * ) => import("./linker").Linker}
 */
export const compileLinker = (
  context,
  { resolveDependency, instrument, fetchTarget },
) => {
  // Use promise of the module realm and not the main realm.
  // Still not working because node is changing the promise.
  //   https://github.com/nodejs/node/issues/53575
  const { SyntaxError, Promise } = /**
   * @type {{
   *   SyntaxError: SyntaxErrorConstructor,
   *   Promise: PromiseConstructor,
   * }}
   */ (runInContext("({ Promise, SyntaxError });", context));
  /** @type {Map<import("../fetch").TargetPath, import("node:vm").Module>} */
  const module_cache = new Map();
  /**
   * @type {Map<
   *   import("node:vm").Module | import("node:vm").Script,
   *   import("../fetch").TargetPath
   * >}
   */
  const reverse_module_cache = new Map();
  /** @type {import("./linker").Load} */
  const link = async (specifier, referrer, _assertions) => {
    const base_path = reverse_module_cache.get(referrer);
    if (base_path === undefined) {
      throw new Error("missing referrer url");
    } else {
      // import("") will import self
      const path = resolveDependency(
        /** @type {import("../fetch").DependencyName} */ (specifier),
        base_path,
      );
      const module = module_cache.get(path);
      if (module === undefined) {
        const content = await fetchTarget(path);
        const module = makeModule(
          { path, content },
          // eslint-disable-next-line no-use-before-define
          { SyntaxError, instrument, importModuleDynamically, context },
        );
        const race_module = module_cache.get(path);
        if (race_module !== undefined) {
          return race_module;
        } else {
          module_cache.set(path, module);
          reverse_module_cache.set(module, path);
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
    registerMain: (main, path) => {
      reverse_module_cache.set(main, path);
      if (!(main instanceof Script)) {
        module_cache.set(path, main);
      }
    },
  };
};

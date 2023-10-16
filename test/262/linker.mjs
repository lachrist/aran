import { readFile } from "node:fs/promises";
import { Script, SourceTextModule, SyntheticModule } from "node:vm";

const { Error, undefined, URL, Map, JSON } = globalThis;

/**
 * @typedef {(
 *   specifier: string,
 *   parent: import("node:vm").Module | import("node:vm").Script,
 *   _assertions: object,
 * ) => Promise<import("node:vm").Module>} Link
 */

/**
 * @typedef {(
 *   main: import("node:vm").Module | import("node:vm").Script,
 *   url: URL,
 * ) => Promise<void>} Register
 */

/**
 * @type {(
 *   options: {
 *     context: object,
 *     origin: URL,
 *     instrument: test262.Instrument,
 *   },
 * ) => {
 *   link: Link,
 *   register: Register,
 * }}
 */
export const compileLinker = ({ context, origin, instrument }) => {
  /** @type {Map<import("node:vm").Module | import("node:vm").Script, URL>} */
  const urls = new Map();
  /** @type {Map<string, import("node:vm").Module>} */
  const modules = new Map();
  /** @type {Link} */
  const link = async (specifier, parent, _assertions) => {
    const parent_url = urls.get(parent);
    if (parent_url === undefined) {
      throw new Error("missing parent url");
    }
    const url = new URL(specifier, parent_url);
    const identifier = `${origin.href} >> ${url.href}`;
    let module = modules.get(url.href);
    if (module === undefined) {
      const content = await readFile(url, "utf8");
      if (url.href.endsWith(".json")) {
        module = new SyntheticModule(
          ["default"],
          () => {
            /** @type {import("node:vm").SyntheticModule} */ (module).setExport(
              "default",
              JSON.parse(content),
            );
          },
          { identifier, context },
        );
      } else {
        module = new SourceTextModule(
          instrument(content, { kind: "module", specifier: url }),
          {
            identifier,
            context,
            importModuleDynamically: /** @type {any} */ (link),
          },
        );
      }
      const race_module = modules.get(url.href);
      if (race_module !== undefined) {
        module = race_module;
      } else {
        urls.set(module, url);
        modules.set(url.href, module);
        await module.link(link);
        await module.evaluate();
      }
    }
    return module;
  };
  return {
    link,
    register: async (main, url) => {
      urls.set(main, url);
      if (!(main instanceof Script)) {
        modules.set(url.href, main);
      }
    },
  };
};

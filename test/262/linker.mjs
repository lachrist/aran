import { readFile } from "node:fs/promises";
import { Script, SourceTextModule, SyntheticModule } from "node:vm";

const { Error, undefined, URL, Map, JSON } = globalThis;

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
  /** @type {Map<import("node:vm").Module | import("node:vm").Script, URL>} */
  const urls = new Map();
  /** @type {Map<string, import("node:vm").Module>} */
  const modules = new Map();
  /** @type {import("./linker").Link} */
  const link = async (specifier, parent, _assertions) => {
    const parent_url = urls.get(parent);
    if (parent_url === undefined) {
      throw new Error("missing parent url");
    }
    const url1 = new URL(specifier, parent_url);
    let module = modules.get(url1.href);
    if (module === undefined) {
      const content1 = await readFile(url1, "utf8");
      if (url1.href.endsWith(".json")) {
        module = new SyntheticModule(
          ["default"],
          () => {
            /** @type {import("node:vm").SyntheticModule} */ (module).setExport(
              "default",
              JSON.parse(content1),
            );
          },
          { identifier: url1.href, context },
        );
      } else {
        const { url: url2, content: content2 } = instrument({
          kind: "module",
          url: url1,
          content: content1,
        });
        module = new SourceTextModule(content2, {
          identifier: url2.href,
          context,
          importModuleDynamically: /** @type {any} */ (link),
        });
      }
      const race_module = modules.get(url1.href);
      if (race_module !== undefined) {
        module = race_module;
      } else {
        urls.set(module, url1);
        modules.set(url1.href, module);
      }
    }
    return module;
  };
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

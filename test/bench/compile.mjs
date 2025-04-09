import { writeFile } from "node:fs/promises";
import { bundleModule } from "./module.mjs";
import { bundleOctane } from "./octane.mjs";

const { URL } = globalThis;

/**
 * @type {(
 *   meta: import("./enum.js").Meta,
 *   transformMeta: import("./transform.js").TransformMeta,
 * ) => Promise<string>}
 */
const compileMeta = async (meta, transformMeta) => {
  const path1 = `out/${meta}-meta.mjs`;
  const code1 = await bundleModule(
    new URL(`meta/${meta}/meta.mjs`, import.meta.url),
  );
  await writeFile(new URL(path1, import.meta.url), code1, "utf8");
  const code2 = transformMeta({ path: path1, kind: "module", code: code1 });
  if (code1 !== code2) {
    const path2 = `out/${meta}-$.mjs`;
    await writeFile(new URL(path2, import.meta.url), code2, "utf8");
    return path2;
  } else {
    return path1;
  }
};

/**
 * @type {(
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").ModuleBase,
 *   transformBase: import("./transform.js").TransformBase,
 * ) => Promise<string>}
 */
const compileBaseModule = async (meta, base, transformBase) => {
  const path1 = `out/${base}-base.mjs`;
  const code1 = await bundleModule(
    new URL(`base/${base}.mjs`, import.meta.url),
  );
  await writeFile(new URL(path1, import.meta.url), code1, "utf8");
  const code2 = transformBase({ path: path1, kind: "module", code: code1 });
  if (code1 !== code2) {
    const path2 = `out/${base}-${meta}-base.mjs`;
    await writeFile(new URL(path2, import.meta.url), code2, "utf8");
    return path2;
  } else {
    return path1;
  }
};

/**
 * @type {(
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").OctaneBase,
 *   transformBase: import("./transform.js").TransformBase,
 * ) => Promise<string>}
 */
const compileBaseOctane = async (meta, base, transformBase) => {
  const path1 = `out/${base}-base.cjs`;
  const code1 = await bundleOctane(base);
  await writeFile(new URL(path1, import.meta.url), code1, "utf8");
  const code2 = transformBase({ path: path1, kind: "script", code: code1 });
  if (code1 !== code2) {
    const path2 = `out/${base}-${meta}-base.cjs`;
    await writeFile(new URL(path2, import.meta.url), code2, "utf8");
    return path2;
  } else {
    return path1;
  }
};

/**
 * @type {(
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").ModuleBase,
 * ) => Promise<string>}
 */
export const compileModule = async (meta, base) => {
  /** @type {import("./transform.js").Transform} */
  const { transformBase, transformMeta } = (
    await import(`./meta/${meta}/transform.mjs`)
  ).default;
  const base_path = await compileBaseModule(meta, base, transformBase);
  const meta_path = await compileMeta(meta, transformMeta);
  await writeFile(
    new URL(`out/${meta}-${base}-main.mjs`, import.meta.url),
    [
      `await import('../meta/${meta}/setup.mjs');`,
      `await import('../${meta_path}');`,
      `await import('../${base_path}');`,
      "",
    ].join("\n"),
    "utf8",
  );
  return `./out/${meta}-${base}-main.mjs`;
};

/**
 * @type {(
 *   meta: import("./enum.js").Meta,
 *   base: import("./enum.js").OctaneBase,
 * ) => Promise<string>}
 */
export const compileOctane = async (meta, base) => {
  /** @type {import("./transform.js").Transform} */
  const { transformBase, transformMeta } = (
    await import(`./meta/${meta}/transform.mjs`)
  ).default;
  const base_path = await compileBaseOctane(meta, base, transformBase);
  const meta_path = await compileMeta(meta, transformMeta);
  await writeFile(
    new URL(`out/${meta}-${base}-main.cjs`, import.meta.url),
    [
      `import('../meta/${meta}/setup.mjs').then(() => {`,
      `  import('../${meta_path}').then(() => {`,
      `    require('../${base_path}');`,
      "  });",
      "});",
    ].join("\n"),
    "utf8",
  );
  return `./out/${meta}-${base}-main.cjs`;
};

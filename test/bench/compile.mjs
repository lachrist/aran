import { writeFile } from "node:fs/promises";
import { bundleModule } from "./module.mjs";
import { bundleOctane } from "./octane.mjs";
import { isMeta, isModuleBase, isOctaneBase } from "./enum.mjs";

const { Error, URL } = globalThis;

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").ModuleBase,
 *   instrument: import("./instrument.d.ts").Instrument,
 * ) => Promise<string>}
 */
const compileBaseModule = async (meta, base, instrument) => {
  const path1 = `out/base-${meta}-${base}-1.mjs`;
  const path2 = `out/base-${meta}-${base}-2.mjs`;
  const code1 = await bundleModule(
    new URL(`base/${base}.mjs`, import.meta.url),
  );
  const code2 = [
    "// @ts-nocheck",
    "/* eslint-disable */",
    instrument({ path: path1, kind: "module", code: code1 }),
  ].join("\n");
  await writeFile(new URL(path1, import.meta.url), code1, "utf8");
  await writeFile(new URL(path2, import.meta.url), code2, "utf8");
  return path2;
};

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").OctaneBase,
 *   transformBase: import("./instrument.d.ts").Instrument,
 * ) => Promise<string>}
 */
const compileBaseOctane = async (meta, base, instrument) => {
  const path1 = `out/base-${meta}-${base}-1.cjs`;
  const path2 = `out/base-${meta}-${base}-2.cjs`;
  const code1 = await bundleOctane(base);
  const code2 = [
    "// @ts-nocheck",
    "/* eslint-disable */",
    instrument({ path: path1, kind: "script", code: code1 }),
  ].join("\n");
  await writeFile(new URL(path1, import.meta.url), code1, "utf8");
  await writeFile(new URL(path2, import.meta.url), code2, "utf8");
  return path2;
};

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").ModuleBase,
 * ) => Promise<string>}
 */
export const compileModule = async (meta, base) => {
  /** @type {import("./instrument.d.ts").Instrument} */
  const instrument = (await import(`./meta/${meta}/instrument.mjs`)).default;
  const base_path = await compileBaseModule(meta, base, instrument);
  await writeFile(
    new URL(`out/main-${meta}-${base}.mjs`, import.meta.url),
    [
      `await import('../meta/${meta}/main.mjs');`,
      `await import('../${base_path}');`,
      "",
    ].join("\n"),
    "utf8",
  );
  return `./out/main-${meta}-${base}.mjs`;
};

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").OctaneBase,
 * ) => Promise<string>}
 */
export const compileOctane = async (meta, base) => {
  /** @type {import("./instrument.d.ts").Instrument} */
  const instrument = (await import(`./meta/${meta}/transform.mjs`)).default;
  const base_path = await compileBaseOctane(meta, base, instrument);
  await writeFile(
    new URL(`out/main-${meta}-${base}.mjs`, import.meta.url),
    [
      "import { runInThisContext } from 'node:vm';",
      "import { readFile } from 'node:fs/promises';",
      `await import('../meta/${meta}/main.mjs');`,
      `const code = await readFile(new URL('../${base_path}', import.meta.url), 'utf8');`,
      `runInThisContext(code, { filename: '../${base_path}' });`,
    ].join("\n"),
    "utf8",
  );
  return `./out/main-${meta}-${base}.mjs`;
};

/**
 * @type {(
 *   meta: string,
 *   base: string,
 * ) => Promise<string>}
 */
export const compile = async (meta, base) => {
  if (!isMeta(meta)) {
    throw new Error(`Invalid meta: ${meta}`);
  }
  if (isOctaneBase(base)) {
    return await compileOctane(meta, base);
  }
  if (isModuleBase(base)) {
    return await compileModule(meta, base);
  }
  throw new Error(`Invalid base: ${base}`);
};

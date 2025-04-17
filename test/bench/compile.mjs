import { writeFile } from "node:fs/promises";
import { bundleModule } from "./module.mjs";
import { bundleOctane } from "./octane.mjs";
import { isMeta, isModuleBase, isOctaneBase } from "./enum.mjs";

const { Error, URL } = globalThis;

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").Base,
 *   version: 1 | 2,
 * ) => string}
 */
const toBasePath = (meta, base, version) =>
  `out/base-${meta.replaceAll("/", "-")}-${base}-${version}.mjs`;

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").Base,
 * ) => string}
 */
const toMainPath = (meta, base) =>
  `out/main-${meta.replaceAll("/", "-")}-${base}.mjs`;

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").ModuleBase,
 *   instrument: import("./instrument.d.ts").Instrument,
 * ) => Promise<string>}
 */
const compileModuleBase = async (meta, base, instrument) => {
  const path1 = toBasePath(meta, base, 1);
  const path2 = toBasePath(meta, base, 2);
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
const compileOctaneBase = async (meta, base, instrument) => {
  const path1 = toBasePath(meta, base, 1);
  const path2 = toBasePath(meta, base, 2);
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
  const base_path = await compileModuleBase(meta, base, instrument);
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
  const instrument = (await import(`./meta/${meta}/instrument.mjs`)).default;
  const base_path = await compileOctaneBase(meta, base, instrument);
  const main_path = toMainPath(meta, base);
  await writeFile(
    new URL(main_path, import.meta.url),
    [
      "import { runInThisContext } from 'node:vm';",
      "import { readFile } from 'node:fs/promises';",
      `await import('../meta/${meta}/main.mjs');`,
      `const code = await readFile(new URL('../${base_path}', import.meta.url), 'utf8');`,
      `runInThisContext(code, { filename: '../${base_path}' });`,
    ].join("\n"),
    "utf8",
  );
  return `./${main_path}`;
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

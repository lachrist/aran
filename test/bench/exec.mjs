import { argv } from "node:process";
import { compileModule, compileOctane } from "./compile.mjs";
import { isMeta, isModuleBase, isOctaneBase } from "./enum.mjs";
import { createRequire } from "node:module";

const { Error } = globalThis;

/**
 * @type {(
 *   argv: string[],
 * ) => Promise<void>}
 */
const main = async ([meta, base]) => {
  if (!isMeta(meta)) {
    throw new Error(`Invalid meta: ${meta}`);
  }
  if (isOctaneBase(base)) {
    const require = createRequire(import.meta.url);
    require(await compileOctane(meta, base));
  } else if (isModuleBase(base)) {
    await import(await compileModule(meta, base));
  } else {
    throw new Error(`Invalid base: ${base}`);
  }
};

await main(argv.slice(2));

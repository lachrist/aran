import { compileOctane } from "./compile.mjs";
import { isMeta, OCTANE_BASE_ENUM } from "./enum.mjs";
import { argv } from "node:process";

const { Error } = globalThis;

const meta = argv[2];

if (!isMeta(meta)) {
  throw new Error(`Invalid meta: ${meta}`);
}

for (const base of OCTANE_BASE_ENUM) {
  if (base !== "zlib") {
    await import(await compileOctane(meta, base));
  }
}

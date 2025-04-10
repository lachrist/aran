import { compileOctane } from "./compile.mjs";
import { OCTANE_BASE_ENUM } from "./enum.mjs";

const meta = "identity";

for (const base of OCTANE_BASE_ENUM) {
  if (base !== "zlib") {
    await import(await compileOctane(meta, "zlib"));
  }
}

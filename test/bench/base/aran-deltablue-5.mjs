import { readFile } from "node:fs/promises";
import { main } from "./aran.mjs";
const code = await readFile(`octane/deltablue.js`, "utf8");
await main(code, "module", 5);

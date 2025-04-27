import { readFile } from "node:fs/promises";
import { main } from "./auto.mjs";
const code = await readFile(`octane/deltablue.js`, "utf8");
await main(code, "script", 1);

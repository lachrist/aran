import { argv } from "node:process";
import { compile } from "./compile.mjs";
const main = await compile(argv[2], argv[3]);
await import(`../../${main}`);

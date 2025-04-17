import { argv } from "node:process";
import { compile } from "./compile.mjs";

await compile(argv[2], argv[3]);

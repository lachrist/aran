import { argv } from "node:process";
import { compile } from "./compile.mjs";
import { log } from "node:console";

log(await compile(argv[2], argv[3]));

import { argv } from "node:process";
import { compile } from "./compile.mjs";

import(await compile(argv[2], argv[3]));

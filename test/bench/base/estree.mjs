import { parse } from "acorn";
import { generate } from "astring";
import { log } from "node:console";

log(generate(parse("class foo {};", { ecmaVersion: "latest" })));

import {concat, map, join} from "array-lite";
/* eslint-disable import/no-nodejs-modules */
import {writeFileSync as writeFile} from "fs";
/* eslint-enable import/no-nodejs-modules */
import {getSyntax} from "../src/lang/ast/syntax.mjs";

const {
  undefined,
  String,
  Array,
  process: {env},
  Reflect: {getOwnPropertyDescriptor},
  JSON: {stringify: stringifyJSON},
} = globalThis;

const should_validate_node =
  getOwnPropertyDescriptor(env, "ARAN_VALIDATE_NODE") !== undefined;
const syntax = getSyntax();

const lines = [];
let length = 0;
const pushLine = (line) => {
  lines[length] = line;
  length += 1;
}
if (should_validate_node) {
  pushLine('import { validateNode } from "./validate.mjs"');
}
for (const kind in syntax) {
  for (const type in syntax[kind]) {
    const identifiers = map(
      new Array(syntax[kind][type].length),
      (element, index) => `field${String(index)}`,
    );
    const params = join(identifiers, ", ");
    let body = `[${join(concat([stringifyJSON(type)], identifiers), ", ")}]`;
    if (should_validate_node) {
      body = `validateNode(${body})`;
    }
    pushLine(`export const make${type} = (${params}) => ${body};`);
  }
  pushLine("");
}
writeFile("src/lang/ast/generated-make.mjs", join(lines, "\n"), "utf8");

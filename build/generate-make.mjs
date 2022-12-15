import { flatMap, concat, map, join } from "array-lite";
/* eslint-disable import/no-nodejs-modules */
import { writeFileSync as writeFile } from "fs";
/* eslint-enable import/no-nodejs-modules */
import { getSyntax } from "../src/ast/syntax.mjs";

const {
  String,
  Array,
  process: { argv },
  Reflect: { ownKeys },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const is_debug_mode = argv.length > 2 && argv[2] === "DEBUG";

const syntax = getSyntax();

const makeFieldArray = (kind, type) =>
  map(
    new Array(syntax[kind][type].length),
    (_element, index) => `field${String(index)}`,
  );

const makeBody = (kind, type) =>
  `[${join(
    concat([stringifyJSON(type)], makeFieldArray(kind, type), ["annotation"]),
    ", ",
  )}]`;

writeFile(
  "src/ast/generated-make.mjs",
  join(
    concat(
      is_debug_mode ? ["import {validateNode} from './validate.mjs';"] : [],
      flatMap(ownKeys(syntax), (kind) =>
        map(
          ownKeys(syntax[kind]),
          (type) =>
            `export const make${type} = (${join(
              concat(makeFieldArray(kind, type), ["annotation = null"]),
              ", ",
            )}) => ${
              is_debug_mode
                ? `validateNode(${makeBody(kind, type)})`
                : makeBody(kind, type)
            };`,
        ),
      ),
      [
        "",
        `
          import {slice} from "array-lite";
          export const annotateNode = (node, annotation) => {
            node = slice(node, 0, node.length);
            node[node.length - 1] = annotation;
            return ${is_debug_mode ? "validateNode(node)" : "node"};
          };
        `,
        "",
      ],
    ),
    "\n",
  ),
  "utf8",
);

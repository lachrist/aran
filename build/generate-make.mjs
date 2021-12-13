import {flatMap, concat, map, join} from "array-lite";
/* eslint-disable import/no-nodejs-modules */
import {writeFileSync as writeFile} from "fs";
/* eslint-enable import/no-nodejs-modules */
import {getSyntax} from "../src/ast/syntax.mjs";

const {
  undefined,
  String,
  Array,
  process: {env},
  Reflect: {getOwnPropertyDescriptor, ownKeys},
  JSON: {stringify: stringifyJSON},
} = globalThis;

const should_validate_node =
  getOwnPropertyDescriptor(env, "ARAN_VALIDATE_NODE") !== undefined;
const syntax = getSyntax();

const makeFieldArray = (kind, type) =>
  map(
    new Array(syntax[kind][type].length),
    (_element, index) => `field${String(index)}`,
  );

writeFile(
  "src/ast/generated-make.mjs",
  join(
    concat(
      should_validate_node
        ? ["import {validateNode} from './validate.mjs';"]
        : [],
      flatMap(ownKeys(syntax), (kind) =>
        map(ownKeys(syntax[kind]), (type) => {
          const identifiers = concat(
            ["annotation"],
            makeFieldArray(kind, type),
          );
          const params = join(identifiers, ", ");
          let body = `[${join(
            concat([stringifyJSON(type)], identifiers),
            ", ",
          )}]`;
          if (should_validate_node) {
            body = `validateNode(${body})`;
          }
          return `export const make${type} = (${params}) => ${body};`;
        }),
      ),
      [""],
    ),
    "\n",
  ),
  "utf8",
);

// writeFile(
//   "src/instrument/generated-make.mjs",
//   join(
//     concat(
//       ["import {"],
//       flatMap(ownKeys(syntax), (kind) =>
//         map(ownKeys(syntax[kind]), (type) => `  make${type} as makeAnnotated${type},`),
//       ),
//       ["} from './ast/index.mjs'"],
//       flatMap(ownKeys(syntax), (kind) =>
//         map(
//           ownKeys(syntax[kind]),
//           (type) =>
//             `export const make${type} = (${join(
//               makeFieldArray(kind, type),
//               ", ",
//             )}) => makeAnnotated${type}(${join(
//               concat(["null"], makeFieldArray(kind, type)),
//               ", ",
//             )});`,
//         ),
//       ),
//       [""],
//     ),
//     "\n",
//   ),
//   "utf8",
// );

//
// const push = (array, element) => {
//   array.length += 1;
//   array[array.length - 1] = element;
// };
//
// const lines1 = [];
// const lines2 = ["import {"];
// for (const kind in syntax) {
//   for (const type in syntax[kind]) {
//
//   }
// }
//
// const pushLine = (line) => {
//   lines[length] = line;
//   length += 1;
// }
// if (should_validate_node) {
//   push(lines1, 'import { validateNode } from "./validate.mjs";');
// }
// for (const kind in syntax) {
//   for (const type in syntax[kind]) {
//
//       push(lines1, );
//     }
//     {
//       push(lines2, `const {make${type} as makeAnnotated${type}} = AST;`);
//       push(lines2, `export const make${type} = (${join(fields, ", ")}) => makeAnnotated${type}(${join(concat(["null"], fields), ", ")});`);
//     }
//   }
// }
//
//
// writeFile("src/instrument/generated-make.mjs", join(lines2, "\n"), "utf8");

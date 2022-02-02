import {parse as parseAcorn} from "acorn";
import {flatMap} from "array-lite";
import {assertDeepEqual} from "../../__fixture__.mjs";
import {
  makeVoidDeclaration,
  makeImportDeclaration,
  makeFunctionDeclaration,
  makeClassDeclaration,
  makeConstDeclaration,
  checkoutDeclarationArray,
  exportDeclaration,
} from "./declaration.mjs";
import {hoistModule} from "./hoist-module.mjs";

const options = {
  ecmaVersion: 2021,
  sourceType: "module",
};

const test = (code, ...declarations) => {
  assertDeepEqual(
    checkoutDeclarationArray(
      flatMap(parseAcorn(code, options).body, hoistModule),
    ),
    declarations,
  );
};

test("debugger;");

test("export * from 'source';");
test("export * as specifier from 'source';");
test("export { specifier } from 'source';");

test(
  "const x = 123; export { x as y };",
  exportDeclaration(makeVoidDeclaration("x"), "y"),
);
test(
  "export const x = 123;",
  exportDeclaration(makeConstDeclaration("x"), "x"),
);
test(
  "export function f () {};",
  exportDeclaration(makeFunctionDeclaration("f"), "f"),
);
test("export class c {};", exportDeclaration(makeClassDeclaration("c"), "c"));

test("export default 123;");
test("export default function () {};");
test("export default class {}");
test(
  "export default function f () {};",
  exportDeclaration(makeFunctionDeclaration("f"), "default"),
);
test(
  "export default class c {};",
  exportDeclaration(makeClassDeclaration("c"), "default"),
);

test(
  "import * as x from 'source';",
  makeImportDeclaration("x", "source", null),
);
test(
  "import {x as y} from 'source';",
  makeImportDeclaration("y", "source", "x"),
);
test(
  "import x from 'source';",
  makeImportDeclaration("x", "source", "default"),
);

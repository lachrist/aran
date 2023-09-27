import { flatMap } from "array-lite";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { parseModule } from "../../__fixture__parser__.mjs";
import {
  exportDeclaration,
  makeImportDeclaration,
  makeVoidDeclaration,
  makeLetDeclaration,
} from "./declaration.mjs";
import { hoistShallow } from "./hoist-shallow.mjs";

const test = (code, ...declarations) => {
  assertDeepEqual(flatMap(parseModule(code).body, hoistShallow), declarations);
};

test("debugger;");

test("class c {}", makeLetDeclaration("c"));

test("var x = 123;");
test("let x = 123;", makeLetDeclaration("x"));

test("export * from 'source';");
test("export * as specifier from 'source';");
test("export { specifier } from 'source';");

test(
  "let x = 123; export { x as y };",
  makeLetDeclaration("x"),
  exportDeclaration(makeVoidDeclaration("x"), "y"),
);
test("export let x = 123;", exportDeclaration(makeLetDeclaration("x"), "x"));
test("export function f () {};");
test("export class c {};", exportDeclaration(makeLetDeclaration("c"), "c"));

test("export default 123;");
test("export default function () {};");
test("export default class {}");
test("export default function f () {};");
test(
  "export default class c {};",
  exportDeclaration(makeLetDeclaration("c"), "default"),
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

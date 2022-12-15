import { parse as parseAcorn } from "acorn";

import { flatMap } from "array-lite";

import { assertDeepEqual } from "../../__fixture__.mjs";

import {
  makeVoidDeclaration,
  makeVarDeclaration,
  exportDeclaration,
} from "./declaration.mjs";

import { hoistDeep } from "./hoist-deep.mjs";

const options = {
  ecmaVersion: 2021,
  sourceType: "module",
};

const test = (code, ...declarations) => {
  assertDeepEqual(
    flatMap(parseAcorn(code, options).body, hoistDeep),
    declarations,
  );
};

test("debugger;");

test("var x = 123;", makeVarDeclaration("x"));
test("let x = 123;");
test("const x = 123;");
test("function f () {}", makeVarDeclaration("f"));

test("for (;;) { var x; }", makeVarDeclaration("x"));
test(
  "for (var x;;) { var y; }",
  makeVarDeclaration("x"),
  makeVarDeclaration("y"),
);

test("for (x in 123) { var y; }", makeVarDeclaration("y"));
test(
  "for (var x in 123) { var y; }",
  makeVarDeclaration("x"),
  makeVarDeclaration("y"),
);

test("for (x of 123) { var y; }", makeVarDeclaration("y"));
test(
  "for (var x of 123) { var y; }",
  makeVarDeclaration("x"),
  makeVarDeclaration("y"),
);

test("while (123) { var x; }", makeVarDeclaration("x"));

test("switch (123) { case 456: var x; }", makeVarDeclaration("x"));

test(
  "if (123) { var x; } else { var y; }",
  makeVarDeclaration("x"),
  makeVarDeclaration("y"),
);
test("if (123) { var x; }", makeVarDeclaration("x"));

test(
  "try { var x; } catch { var y; }",
  makeVarDeclaration("x"),
  makeVarDeclaration("y"),
);
test(
  "try { var x; } finally { var y; }",
  makeVarDeclaration("x"),
  makeVarDeclaration("y"),
);

test("export * from 'source';");
test("export * as specifier from 'source';");
test("export { specifier } from 'source';");

test(
  "var x = 123; export { x as y };",
  makeVarDeclaration("x"),
  exportDeclaration(makeVoidDeclaration("x"), "y"),
);
test("export var x = 123;", exportDeclaration(makeVarDeclaration("x"), "x"));
test(
  "export function f () {};",
  exportDeclaration(makeVarDeclaration("f"), "f"),
);
test("export class c {};");

test("export default 123;");
test("export default function () {};");
test("export default class {}");
test(
  "export default function f () {};",
  exportDeclaration(makeVarDeclaration("f"), "default"),
);
test("export default class c {};");

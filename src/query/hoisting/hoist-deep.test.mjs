import {parse as parseAcorn} from "acorn";
import {flatMap} from "array-lite";
import {assertDeepEqual} from "../../__fixture__.mjs";
import {makeVarDeclaration, makeFunctionDeclaration} from "./declaration.mjs";
import {hoistDeep} from "./hoist-deep.mjs";

const options = {
  ecmaVersion: 2021,
  sourceType: "script",
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
test("function f () {}", makeFunctionDeclaration("f"));

test("for (;;) { var x; }", makeVarDeclaration("x"));
test(
  "for (var x;;) { var y; }",
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

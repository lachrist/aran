import {parse as parseAcorn} from "acorn";
import {flatMap} from "array-lite";
import {assertDeepEqual} from "../../__fixture__.mjs";
import {
  makeClassDeclaration,
  makeLetDeclaration,
  makeConstDeclaration,
} from "./declaration.mjs";
import {hoistShallow} from "./hoist-shallow.mjs";

const options = {
  ecmaVersion: 2021,
  sourceType: "script",
};

const test = (code, ...declarations) => {
  assertDeepEqual(
    flatMap(parseAcorn(code, options).body, hoistShallow),
    declarations,
  );
};

test("debugger;");
test("class c {}", makeClassDeclaration("c"));
test("var x = 123;");
test("let x = 123;", makeLetDeclaration("x"));
test("const x = 123;", makeConstDeclaration("x"));

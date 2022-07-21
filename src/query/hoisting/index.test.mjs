import {parse as parseAcorn} from "acorn";

import {assertDeepEqual} from "../../__fixture__.mjs";

import {makeVarDeclaration, makeLetDeclaration} from "./declaration.mjs";

import {hoistBodyDeep, hoistBodyShallow, hoistHead} from "./index.mjs";

const options = {
  ecmaVersion: 2021,
  sourceType: "script",
};

assertDeepEqual(hoistBodyShallow(parseAcorn("var x; let y", options).body), [
  makeLetDeclaration("y"),
]);

assertDeepEqual(hoistBodyDeep(parseAcorn("var x; let y", options).body), [
  makeVarDeclaration("x"),
  makeLetDeclaration("y"),
]);

assertDeepEqual(
  hoistHead(parseAcorn("function f (x, x) {}", options).body[0].params),
  [makeLetDeclaration("x")],
);

assertDeepEqual(
  hoistHead(parseAcorn("function f ([x, y]) {}", options).body[0].params),
  [makeLetDeclaration("x"), makeLetDeclaration("y")],
);

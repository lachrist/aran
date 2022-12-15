import { parse as parseAcorn } from "acorn";

import { assertDeepEqual } from "../../__fixture__.mjs";

import {
  makeVarDeclaration,
  makeVoidDeclaration,
  exportDeclaration,
} from "./declaration.mjs";

import {
  hoistExportSpecifier,
  hoistVariableDeclaration,
  hoistExportVariableDeclaration,
} from "./helper.mjs";

const options = {
  sourceType: "module",
  ecmaVersion: 2021,
};

assertDeepEqual(
  hoistExportSpecifier(
    parseAcorn("var variable; export {variable as specifier};", options).body[1]
      .specifiers[0],
  ),
  [exportDeclaration(makeVoidDeclaration("variable"), "specifier")],
);

assertDeepEqual(
  hoistVariableDeclaration(
    parseAcorn("var [x1, x2 = 123, ... rest] = 456;", options).body[0],
  ),
  [
    makeVarDeclaration("x1"),
    makeVarDeclaration("x2"),
    makeVarDeclaration("rest"),
  ],
);

assertDeepEqual(
  hoistVariableDeclaration(
    parseAcorn("var {x1, y:x2, ... rest} = 456;", options).body[0],
  ),
  [
    makeVarDeclaration("x1"),
    makeVarDeclaration("x2"),
    makeVarDeclaration("rest"),
  ],
);

assertDeepEqual(
  hoistExportVariableDeclaration(parseAcorn("var variable;", options).body[0]),
  [exportDeclaration(makeVarDeclaration("variable"), "variable")],
);

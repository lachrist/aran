import { assertDeepEqual } from "../../__fixture__.mjs";
import { parseModule } from "../../__fixture__parser__.mjs";
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

assertDeepEqual(
  hoistExportSpecifier(
    parseModule("var variable; export {variable as specifier};").body[1]
      .specifiers[0],
  ),
  [exportDeclaration(makeVoidDeclaration("variable"), "specifier")],
);

assertDeepEqual(
  hoistVariableDeclaration(
    parseModule("var [x1, x2 = 123, ... rest] = 456;").body[0],
  ),
  [
    makeVarDeclaration("x1"),
    makeVarDeclaration("x2"),
    makeVarDeclaration("rest"),
  ],
);

assertDeepEqual(
  hoistVariableDeclaration(
    parseModule("var {x1, y:x2, ... rest} = 456;").body[0],
  ),
  [
    makeVarDeclaration("x1"),
    makeVarDeclaration("x2"),
    makeVarDeclaration("rest"),
  ],
);

assertDeepEqual(
  hoistExportVariableDeclaration(parseModule("var variable;").body[0]),
  [exportDeclaration(makeVarDeclaration("variable"), "variable")],
);

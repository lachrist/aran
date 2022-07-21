import {assertEqual, assertDeepEqual, assertThrow} from "../../__fixture__.mjs";

import {SyntaxAranError} from "../../util/index.mjs";

import {
  makeVoidDeclaration,
  makeVarDeclaration,
  makeLetDeclaration,
  makeImportDeclaration,
  exportDeclaration,
  getDeclarationKind,
  getDeclarationVariable,
  isDeclarationImported,
  getDeclarationImportSource,
  getDeclarationImportSpecifier,
  getDeclarationExportSpecifierArray,
  checkoutDeclarationArray,
} from "./declaration.mjs";

assertEqual(
  getDeclarationVariable(makeVoidDeclaration("variable")),
  "variable",
);

assertEqual(getDeclarationKind(makeVoidDeclaration("variable")), "void");

{
  const declaration = makeImportDeclaration("variable", "source", "specifier");
  assertEqual(isDeclarationImported(declaration), true);
  assertEqual(getDeclarationImportSource(declaration), "source");
  assertEqual(getDeclarationImportSpecifier(declaration), "specifier");
}

assertDeepEqual(
  getDeclarationExportSpecifierArray(
    exportDeclaration(
      exportDeclaration(
        exportDeclaration(makeVoidDeclaration("variable"), "SPECIFIER"),
        "specifier",
      ),
      "specifier",
    ),
  ),
  ["SPECIFIER", "specifier"],
);

assertDeepEqual(
  checkoutDeclarationArray([
    exportDeclaration(makeVoidDeclaration("variable"), "specifier"),
    makeLetDeclaration("variable"),
  ]),
  [exportDeclaration(makeLetDeclaration("variable"), "specifier")],
);

assertDeepEqual(
  checkoutDeclarationArray([
    makeLetDeclaration("variable"),
    exportDeclaration(makeVoidDeclaration("variable"), "specifier"),
  ]),
  [exportDeclaration(makeLetDeclaration("variable"), "specifier")],
);

assertDeepEqual(
  checkoutDeclarationArray([
    makeVarDeclaration("variable"),
    makeVarDeclaration("variable"),
  ]),
  [makeVarDeclaration("variable")],
);

assertThrow(
  () =>
    checkoutDeclarationArray([
      makeLetDeclaration("variable"),
      makeLetDeclaration("variable"),
    ]),
  SyntaxAranError,
);

import {assertEqual, assertDeepEqual} from "../../__fixture__.mjs";

import {
  makeVoidDeclaration,
  makeVarDeclaration,
  makeLetDeclaration,
  makeConstDeclaration,
  makeImportDeclaration,
  exportDeclaration,
  getDeclarationVariable,
  isDeclarationImported,
  isDeclarationLoose,
  isDeclarationRigid,
  getDeclarationImportSource,
  getDeclarationImportSpecifier,
  getDeclarationExportSpecifierArray,
  isDeclarationWritable,
  checkoutDeclarationArray,
} from "./declaration.mjs";

assertEqual(getDeclarationVariable(makeVarDeclaration("variable")), "variable");

{
  const declaration = exportDeclaration(
    makeVarDeclaration("variable"),
    "specifier",
  );
  assertDeepEqual(getDeclarationExportSpecifierArray(declaration), [
    "specifier",
  ]);
  assertDeepEqual(
    getDeclarationExportSpecifierArray(
      exportDeclaration(declaration, "specifier"),
    ),
    ["specifier"],
  );
}

{
  const declaration = makeImportDeclaration("variable", "source", "specifier");
  assertEqual(isDeclarationImported(declaration), true);
  assertEqual(getDeclarationImportSource(declaration), "source");
  assertEqual(getDeclarationImportSpecifier(declaration), "specifier");
}

assertEqual(isDeclarationWritable(makeLetDeclaration("variable")), true);
assertEqual(isDeclarationWritable(makeConstDeclaration("variable")), false);

assertEqual(isDeclarationLoose(makeVarDeclaration("variable")), true);
assertEqual(isDeclarationLoose(makeLetDeclaration("variable")), false);

assertEqual(isDeclarationRigid(makeVarDeclaration("variable")), false);
assertEqual(isDeclarationRigid(makeLetDeclaration("variable")), true);

assertDeepEqual(
  checkoutDeclarationArray([
    makeVarDeclaration("variable"),
    makeVarDeclaration("variable"),
  ]),
  [makeVarDeclaration("variable")],
);
assertDeepEqual(
  checkoutDeclarationArray([
    exportDeclaration(makeVarDeclaration("variable"), "specifier1"),
    exportDeclaration(makeVarDeclaration("variable"), "specifier2"),
  ]),
  [
    exportDeclaration(
      exportDeclaration(makeVarDeclaration("variable"), "specifier1"),
      "specifier2",
    ),
  ],
);
assertDeepEqual(
  checkoutDeclarationArray([
    makeConstDeclaration("variable"),
    exportDeclaration(makeVoidDeclaration("variable"), "specifier"),
  ]),
  [exportDeclaration(makeConstDeclaration("variable"), "specifier")],
);
assertDeepEqual(
  checkoutDeclarationArray([
    exportDeclaration(makeVoidDeclaration("variable"), "specifier"),
    makeConstDeclaration("variable"),
  ]),
  [exportDeclaration(makeConstDeclaration("variable"), "specifier")],
);

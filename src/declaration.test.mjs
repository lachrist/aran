import {assertEqual, assertDeepEqual, assertThrow} from "./__fixture__.mjs";

import {
  VAR_DECLARATION_KIND,
  LET_DECLARATION_KIND,
  CONST_DECLARATION_KIND,
  makeNonImportDeclaration,
  makeImportDeclaration,
  addDeclarationExportSpecifier,
  getDeclarationKind,
  getDeclarationVariable,
  getDeclarationImportSource,
  getDeclarationImportSpecifier,
  getDeclarationExportSpecifierArray,
  isDeclarationWritable,
  assertDeclarationCompatibility,
} from "./declaration.mjs";

const {undefined} = globalThis;

assertEqual(
  getDeclarationKind(
    makeNonImportDeclaration(VAR_DECLARATION_KIND, "variable"),
  ),
  VAR_DECLARATION_KIND,
);

assertEqual(
  getDeclarationVariable(
    makeNonImportDeclaration(VAR_DECLARATION_KIND, "variable"),
  ),
  "variable",
);

assertDeepEqual(
  getDeclarationExportSpecifierArray(
    addDeclarationExportSpecifier(
      makeNonImportDeclaration(VAR_DECLARATION_KIND, "variable"),
      "specifier",
    ),
  ),
  ["specifier"],
);

assertEqual(
  getDeclarationImportSource(
    makeImportDeclaration("variable", "source", "specifier"),
  ),
  "source",
);

assertEqual(
  getDeclarationImportSpecifier(
    makeImportDeclaration("variable", "source", "specifier"),
  ),
  "specifier",
);

assertEqual(
  isDeclarationWritable(
    makeNonImportDeclaration(LET_DECLARATION_KIND, "variable"),
  ),
  true,
);

assertEqual(
  isDeclarationWritable(
    makeNonImportDeclaration(CONST_DECLARATION_KIND, "variable"),
  ),
  false,
);

assertEqual(
  assertDeclarationCompatibility(
    makeNonImportDeclaration(VAR_DECLARATION_KIND, "variable"),
    makeNonImportDeclaration(VAR_DECLARATION_KIND, "variable"),
  ),
  undefined,
);

assertThrow(() =>
  assertDeclarationCompatibility(
    makeNonImportDeclaration(VAR_DECLARATION_KIND, "variable"),
    makeNonImportDeclaration(LET_DECLARATION_KIND, "variable"),
  ),
);

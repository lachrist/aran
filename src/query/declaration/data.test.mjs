import {assertEqual, assertDeepEqual, assertThrow} from "../../__fixture__.mjs";

import {
  makeVarDeclaration,
  makeLetDeclaration,
  makeConstDeclaration,
  makeImportDeclaration,
  addDeclarationExportSpecifier,
  // getDeclarationKind,
  getDeclarationVariable,
  getDeclarationImportSource,
  getDeclarationImportSpecifier,
  getDeclarationExportSpecifierArray,
  isDeclarationWritable,
  assertDeclarationCompatibility,
} from "./data.mjs";

const {undefined} = globalThis;

assertEqual(getDeclarationVariable(makeVarDeclaration("variable")), "variable");

assertDeepEqual(
  getDeclarationExportSpecifierArray(
    addDeclarationExportSpecifier(makeVarDeclaration("variable"), "specifier"),
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

assertEqual(isDeclarationWritable(makeLetDeclaration("variable")), true);

assertEqual(isDeclarationWritable(makeConstDeclaration("variable")), false);

assertEqual(
  assertDeclarationCompatibility(
    makeVarDeclaration("variable"),
    makeVarDeclaration("variable"),
  ),
  undefined,
);

assertThrow(() =>
  assertDeclarationCompatibility(
    makeVarDeclaration("variable"),
    makeLetDeclaration("variable"),
  ),
);

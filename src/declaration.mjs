import {includes, concat} from "array-lite";
import {expect} from "./util.mjs";

const {SyntaxError} = globalThis;

/////////////////
// Constructor //
/////////////////

export const IMPORT_DECLARATION_KIND = "import";
export const VAR_DECLARATION_KIND = "var";
export const FUNCTION_DECLARATION_KIND = "function";
export const LET_DECLARATION_KIND = "let";
export const CONST_DECLARATION_KIND = "const";
export const CLASS_DECLARATION_KIND = "class";
export const IDENTIFIER_PARAMETER_DECLARATION_KIND = "identifier-parameter";
export const PATTERN_PARAMETER_DECLARATION_KIND = "pattern-parameter";

////////////////
// Contructor //
////////////////

export const makeNonImportDeclaration = (kind, variable) => ({
  kind,
  variable,
  import: null,
  exports: [],
});

export const makeImportDeclaration = (variable, source, specifier) => ({
  kind: IMPORT_DECLARATION_KIND,
  variable,
  import: {source, specifier},
  exports: [],
});

/////////////
// Mutator //
/////////////

export const addDeclarationExportSpecifier = (declaration, specifier) => ({
  ...declaration,
  exports: concat(declaration.exports, [specifier]),
});

//////////////
// Accessor //
//////////////

export const getDeclarationKind = ({kind}) => kind;

export const getDeclarationVariable = ({variable}) => variable;

export const getDeclarationImportSource = ({import: {source}}) => source;

export const getDeclarationImportSpecifier = ({import: {specifier}}) =>
  specifier;

export const getDeclarationExportSpecifierArray = ({exports}) => exports;

///////////
// Query //
///////////

const generateIncludesKind =
  (kinds) =>
  ({kind}) =>
    includes(kinds, kind);

export const isDeclarationWritable = generateIncludesKind([
  VAR_DECLARATION_KIND,
  CLASS_DECLARATION_KIND,
  FUNCTION_DECLARATION_KIND,
  LET_DECLARATION_KIND,
  IDENTIFIER_PARAMETER_DECLARATION_KIND,
  PATTERN_PARAMETER_DECLARATION_KIND,
]);

export const isDeclarationScriptBound = generateIncludesKind([]);

export const isDeclarationModuleBound = generateIncludesKind([
  IMPORT_DECLARATION_KIND,
  LET_DECLARATION_KIND,
  CONST_DECLARATION_KIND,
  CLASS_DECLARATION_KIND,
  VAR_DECLARATION_KIND,
  FUNCTION_DECLARATION_KIND,
]);

export const isDeclarationSloppyEvalBound = generateIncludesKind([
  LET_DECLARATION_KIND,
  CONST_DECLARATION_KIND,
  CLASS_DECLARATION_KIND,
]);

export const isDeclarationStrictEvalBound = generateIncludesKind([
  LET_DECLARATION_KIND,
  CONST_DECLARATION_KIND,
  CLASS_DECLARATION_KIND,
  VAR_DECLARATION_KIND,
  FUNCTION_DECLARATION_KIND,
]);

export const isDeclarationBlockBound = generateIncludesKind([
  CONST_DECLARATION_KIND,
  LET_DECLARATION_KIND,
  CLASS_DECLARATION_KIND,
]);

export const isDeclarationParameter = generateIncludesKind([
  IDENTIFIER_PARAMETER_DECLARATION_KIND,
  PATTERN_PARAMETER_DECLARATION_KIND,
]);

export const isDeclarationClosureBound = generateIncludesKind([
  LET_DECLARATION_KIND,
  CONST_DECLARATION_KIND,
  CLASS_DECLARATION_KIND,
  VAR_DECLARATION_KIND,
  FUNCTION_DECLARATION_KIND,
]);

///////////////
// Duplicate //
///////////////

const isDeclarationDuplicable = generateIncludesKind([
  VAR_DECLARATION_KIND,
  FUNCTION_DECLARATION_KIND,
  IDENTIFIER_PARAMETER_DECLARATION_KIND,
]);

export const assertDeclarationCompatibility = (declaration1, declaration2) => {
  expect(
    declaration1.variable !== declaration2.variable ||
      (isDeclarationDuplicable(declaration1) &&
        isDeclarationDuplicable(declaration2)),
    SyntaxError,
    `Duplicate variable declaration: %s`,
    [declaration1.variable],
  );
};

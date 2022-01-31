import {includes, concat} from "array-lite";
import {expect} from "../../util.mjs";

const {SyntaxError} = globalThis;

////////////////
// Contructor //
////////////////

const IMPORT_TYPE = "import";
const VAR_TYPE = "var";
const FUNCTION_TYPE = "function";
const LET_TYPE = "let";
const CONST_TYPE = "const";
const CLASS_TYPE = "class";
const SIMPLE_PARAMETER_TYPE = "simple-parameter";
const PARAMETER_TYPE = "pattern-parameter";

const generateMakeDeclaration = (type) => (variable) => ({
  type,
  variable,
  import: null,
  exports: [],
});

export const makeVarDeclaration = generateMakeDeclaration(VAR_TYPE);
export const makeConstDeclaration = generateMakeDeclaration(CONST_TYPE);
export const makeLetDeclaration = generateMakeDeclaration(LET_TYPE);
export const makeFunctionDeclaration = generateMakeDeclaration(FUNCTION_TYPE);
export const makeClassDeclaration = generateMakeDeclaration(CLASS_TYPE);
export const makeSimpleParameterDeclaration = generateMakeDeclaration(
  SIMPLE_PARAMETER_TYPE,
);
export const makeParameterDeclaration = generateMakeDeclaration(PARAMETER_TYPE);

export const makeImportDeclaration = (variable, source, specifier) => ({
  type: IMPORT_TYPE,
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

export const getDeclarationVariable = ({variable}) => variable;

export const getDeclarationImportSource = ({import: {source}}) => source;

export const getDeclarationImportSpecifier = ({import: {specifier}}) =>
  specifier;

export const getDeclarationExportSpecifierArray = ({exports}) => exports;

///////////
// Query //
///////////

const generateIncludesKind =
  (types) =>
  ({type}) =>
    includes(types, type);

export const isDeclarationWritable = generateIncludesKind([
  VAR_TYPE,
  CLASS_TYPE,
  FUNCTION_TYPE,
  LET_TYPE,
  SIMPLE_PARAMETER_TYPE,
  PARAMETER_TYPE,
]);

export const isDeclarationScriptBound = generateIncludesKind([]);

export const isDeclarationModuleBound = generateIncludesKind([
  IMPORT_TYPE,
  LET_TYPE,
  CONST_TYPE,
  CLASS_TYPE,
  VAR_TYPE,
  FUNCTION_TYPE,
]);

export const isDeclarationSloppyEvalBound = generateIncludesKind([
  LET_TYPE,
  CONST_TYPE,
  CLASS_TYPE,
]);

export const isDeclarationStrictEvalBound = generateIncludesKind([
  LET_TYPE,
  CONST_TYPE,
  CLASS_TYPE,
  VAR_TYPE,
  FUNCTION_TYPE,
]);

export const isDeclarationBlockBound = generateIncludesKind([
  CONST_TYPE,
  LET_TYPE,
  CLASS_TYPE,
]);

export const isDeclarationParameter = generateIncludesKind([
  SIMPLE_PARAMETER_TYPE,
  PARAMETER_TYPE,
]);

export const isDeclarationClosureBound = generateIncludesKind([
  LET_TYPE,
  CONST_TYPE,
  CLASS_TYPE,
  VAR_TYPE,
  FUNCTION_TYPE,
]);

///////////////
// Duplicate //
///////////////

const isDeclarationDuplicable = generateIncludesKind([
  VAR_TYPE,
  FUNCTION_TYPE,
  SIMPLE_PARAMETER_TYPE,
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

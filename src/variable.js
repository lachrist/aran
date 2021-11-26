"use strict";

const global_Reflect_ownKeys = global.Reflect.ownKeys;

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");

/////////////////
// Constructor //
/////////////////

const names = {
  __proto__: null,
  "import": "Import",
  "var": "Var",
  "function": "Function",
  "let": "Let",
  "const": "Const",
  "class": "Class",
  "import": "Import",
  "simple-error-param": "SimpleErrorParam",
  "complex-error-param": "ComplexErrorParam",
  "param": "Param"};

exports.getConstructorName = (kind) => names[kind];

ArrayLite.forEach(
  global_Reflect_ownKeys(names),
  (kind) => exports[names[kind]] = (identifier) => ({
    kind: kind,
    name: identifier,
    import: null,
    exports: []}));

exports.Import = (identifier, specifier, source) => ({
  kind: "import",
  name: identifier,
  import: {
    source: source,
    specifier: specifier},
  exports: []});

////////////
// Export //
////////////

exports.exportSelf = (variable) => ({
  kind: variable.kind,
  name: variable.name,
  import: variable.import,
  exports: ArrayLite.concat(variable.exports, [variable.name])});

exports.exportDefault = (variable) => ({
  kind: variable.kind,
  name: variable.name,
  import: variable.import,
  exports: ArrayLite.concat(variable.exports, ["default"])});

exports.exportNamed = (variable, specifier) => (
  variable.name === specifier.local.name ?
  {
    kind: variable.kind,
    name: variable.name,
    import: variable.import,
    exports: ArrayLite.concat(variable.exports, [specifier.exported.name])} :
  variable);

//////////////
// Accessor //
//////////////

exports.getName = (variable) => variable.name;

exports.getExportSpecifierArray = (variable) => variable.exports;

exports.isWritable = ({kind}) => (
  kind === "var" ||
  kind === "function" ||
  kind === "param" ||
  kind === "let" ||
  kind === "simple-error-param" ||
  kind === "complex-error-param");

exports.isImport = (variable) => variable.kind === "import";

exports.getImportSpecifier = (variable) => (
  Throw.assert(variable.kind === "import", null, `Not an import variable`),
  // console.assert(variable.import !== null)
  variable.import.specifier);

exports.getImportSource = (variable) => (
  Throw.assert(variable.kind === "import", null, `Not an import variable`),
  // console.assert(variable.import !== null)
  variable.import.source);

//////////////
// Hoisting //
//////////////

exports.isProgram = ({kind}) => (
  kind === "import" ||
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "var" ||
  kind === "function");

exports.isScript = ({kind}) => false;

exports.isModule = ({kind}) => (
  kind === "import" ||
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "var" ||
  kind === "function");

exports.isSloppyEval = ({kind}) => (
  kind === "let" ||
  kind === "const" ||
  kind === "class");

exports.isStrictEval = ({kind}) => (
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "var" ||
  kind === "function");

exports.isBlock = ({kind}) => (
  kind === "const" ||
  kind === "let" ||
  kind === "class");

exports.isCatchHead = ({kind}) => (
  kind === "simple-error-param" ||
  kind === "complex-error-param");

exports.isClosureHead = ({kind}) => (
  kind === "param");

exports.isClosureBody = ({kind}) => (
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "var" ||
  kind === "function");

exports.isLoose = ({kind}) => (
  kind === "var" ||
  kind === "function" ||
  kind === "param" ||
  kind === "simple-error-param");

///////////////
// Duplicate //
///////////////

exports.checkCompatibility = (variable1, variable2) => Throw.assert(
  (
    variable1.name !== variable2.name ||
    (
      exports.isLoose(variable1) &&
      exports.isLoose(variable2))),
  Throw.SyntaxError,
  `Duplicate variable declaration: ${variable1.name}`);

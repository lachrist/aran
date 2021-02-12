"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");

/////////////////
// Constructor //
/////////////////

const names = {
  __proto__: null,
  "import": "Import",
  "var": "Var",
  "let": "Let",
  "const": "Const",
  "class": "Class",
  "import": "Import",
  "simple-error-param": "SimplerErrorParam",
  "complex-error-param": "ComplexErrorParam",
  "param": "Param"};

exports.getConstructorName = (kind) => names[kind];

ArrayLite.forEach(
  global_Reflect_ownKeys(names),
  (kind) => exports[names[kind]] = (identifie) => ({
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

exports.getName = ({name}) => name;

//////////
// Kind //
//////////

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

exports.isLoose = ({kind}) => (
  kind === "var" ||
  kind === "function" ||
  kind === "param" ||
  kind === "simple-error-param");

exports.isRigid = ({kind}) => (
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "import" ||
  kind === "complex-error-param");

exports.isBlock = ({kind}) => (
  kind === "const" ||
  kind === "let" ||
  kind === "class");

exports.isCatchHead = ({kind}) => (
  kind === "simple-error-param" :
  kind === "complex-error-param");

exports.isFunctionHead = ({kind}) => (
  kind === "param");

exports.isFunctionBody = ({kind}) => (
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "var" ||
  kind === "function");

exports.isGlobal = ({kind}) => (
  kind === "let" ||
  kind === "const" ||
  kind === "class" ||
  kind === "var" ||
  kind === "function");

///////////////
// Duplicate //
///////////////

const isLoose = exports.isLoose;

const isCompatible = (variable1, variable2) => (
  variable1.name !== variable2.name ||
  (
    isLoose(variable1) &&
    isLoose(variable2)));

const checkDuplicate = (variables) => {
  for (let index1 = 0; index1 < variables.length; index++) {
    for (let index2 = index1 + 1, index2 < variables.length; index++) {
      Throw.assert(isCompatible(variables[index1], variables[index2]), Throw.SyntaxError, `Duplicate variable declaration: ${variable}`);
    }
  }
  return variable;
};

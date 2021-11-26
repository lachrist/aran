"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");

const Variable = require("./variable.js");

const prototype = {
  __proto__: null,
  // Hoisting //
  isProgram: false,
  isScript: false,
  isModule: false,
  isSloppyEval: false,
  isStrictEval: false,
  isBlock: false,
  isCatchHead: false,
  isClosureHead: false,
  isClosureBody: false,
  // Other //
  isWritable: false,
  isImport: false};

ArrayLite.forEach(
  [
    ["import", {__proto__:prototype, isModule:true, isImport:true, isProgram:true}],
    ["var", {__proto__:prototype, isModule:true, isStrictEval:true, isClosureBody:true, isWritable:true, isProgram:true}],
    ["function", {__proto__:prototype, isModule:true, isStrictEval:true, isClosureBody:true, isWritable:true, isProgram:true}],
    ["let", {__proto__:prototype, isModule:true, isSloppyEval:true, isStrictEval:true, isBlock:true, isClosureBody:true, isWritable:true, isProgram:true}],
    ["const", {__proto__:prototype, isModule:true, isSloppyEval:true, isStrictEval:true, isBlock:true, isClosureBody:true, isProgram:true}],
    ["class", {__proto__:prototype, isModule:true, isSloppyEval:true, isStrictEval:true, isBlock:true, isClosureBody:true, isProgram:true}],
    ["param", {__proto__:prototype, isClosureHead:true, isWritable:true}],
    ["simple-error-param", {__proto__:prototype, isCatchHead:true, isWritable:true}],
    ["complex-error-param", {__proto__:prototype, isCatchHead:true, isWritable:true}]],
  ({0:kind, 1:results}) => {
    ArrayLite.forEach(
      global.Reflect.ownKeys(prototype),
      (name) => {
        Assert.deepEqual(
          Variable[name](
            (
              kind === "import" ?
              Variable[Variable.getConstructorName(kind)]("identifier", "specifier", "source") :
              Variable[Variable.getConstructorName(kind)]("identifier"))),
          results[name]); }); });

Assert.deepEqual(
  Variable.getName(Variable.Var("x")),
  "x");

/////////////
// Exports //
/////////////

Assert.deepEqual(
  Variable.getExportSpecifierArray(
    Variable.exportNamed(
      Variable.exportNamed(
        Variable.exportDefault(
          Variable.exportSelf(
            Variable.Var("x"))),
        {
          local: {
            type: "Identifier",
            name: "x"},
          exported: {
            type: "Identifier",
            name: "foo"}}),
      {
        local: {
          type: "Identifier",
          name: "y"},
        exported: {
          type: "Identifier",
          name: "bar"}})),
  ["x", "default", "foo"]);

////////////
// Import //
////////////

Assert.deepEqual(
  Variable.getImportSpecifier(
    Variable.Import("identifier", "specifier", "source")),
  "specifier");

Assert.deepEqual(
  Variable.getImportSource(
    Variable.Import("identifier", "specifier", "source")),
  "source");

////////////////////////
// checkCompatibility //
////////////////////////

Assert.doesNotThrow(
  () => Variable.checkCompatibility(
    Variable.Let("x"),
    Variable.Let("y")));

Assert.throws(
  () => Variable.checkCompatibility(
    Variable.Let("x"),
    Variable.Let("x")),
  new global.SyntaxError(`Duplicate variable declaration: x`));

Assert.doesNotThrow(
  () => Variable.checkCompatibility(
    Variable.Var("x"),
    Variable.Function("x")));


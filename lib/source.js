"use strict";

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");
const Variable = require("./variable.js");

/////////////////
// Constructor //
/////////////////

// options = null | {
//   strict: "boolean",
//   mode: "program" | "constructor" | "derived-constructor" | "method" | "function"
// }
exports.make = (type, enclave, options) => (
  Throw.assert(
    (
      (type === "eval" && enclave) === 
      (options !== null)),
    null,
    `Options must only be provided for enclave eval source`),
  (
    (
      type === "module" ||
      type === "script") ?
    {type, enclave} :
    (
      enclave ?
      {
        type: "eval",
        enclave: true,
        strict: options.strict,
        mode: options.mode,
        arrow: null,
        locals: []} :
      {
        type: "eval",
        enclave: false,
        strict: false,
        mode: "program",
        arrow: false,
        locals: []})));

///////////
// Query //
///////////

exports.getType = (source) => source.type;

exports.isEnclave = (source) => source.enclave;

exports.isStrict = (source) => (
  source.type === "eval" ?
  source.strict :
  source.type === "module");

exports.getMode = (source) => (
  source.type === "eval" ?
  source.mode :
  "program");

exports.getVariablePredicate = (source, strict) => (
  source.type === "module" ?
  Variable.isModule :
  (
    source.type === "script" ?
    Variable.isScript :
    // console.assert(source.type === "eval")
    (
      (
        source.strict ||
        strict) ?
      Variable.isStrictEval :
      Variable.isSloppyEval)));

//////////////////
// updateGlobal //
//////////////////

exports.updateGlobalVariableArray = (source, globals, variables) => (
  Throw.assert(
    (source.enclave) === (globals === null),
    null,
    `Global variables are handled if and only if the program is not an enclave`),
  (
    source.type === "eval" ?
    ArrayLite.forEach(
      source.locals,
      (variable1) => ArrayLite.forEach(
        variables,
        (variable2) => Variable.checkCompatibility(variable1, variable2))) :
    null),
  (
    globals === null ?
    null :
    // console.assert(!source.enclave)
    (
      (
        source.type === "eval" &&
        (
          source.mode !== "program" ||
          // console.assert(source.arrow !== null)
          source.arrow)) ?
      globals :
      (
        ArrayLite.forEach(
          globals,
          (variable1) => ArrayLite.forEach(
            variables,
            (variable2) => Variable.checkCompatibility(variable1, variable2))),
        ArrayLite.concat(globals, variables)))));

////////////////
// Convertion //
////////////////

exports.toEval = (source) => (
  source.type === "eval" ?
  source :
  {
    type: "eval",
    enclave: source.enclave,
    strict: source.type === "module",
    mode: "program",
    arrow: false,
    locals: []});

////////////
// Extend //
////////////

const checkEval = (source) => Throw.assert(
  source.type === "eval",
  null,
  `Extension requires an eval source`);

exports.extendStrict = (source) => (
  checkEval(source),
  (
    source.strict ?
    source :
    {
      type: "eval",
      enclave: source.enclave,
      strict: true,
      mode: source.mode,
      arrow: source.arrow,
      locals: source.locals}));

exports.extendFunction = (source, mode) => (
  checkEval(source),
  {
    type: "eval",
    enclave: source.enclave,
    strict: source.strict,
    mode: mode,
    arrow: false,
    locals: []});

exports.extendArrow = (source) => (
  checkEval(source),
  {
    type: "eval",
    enclave: source.enclave,
    strict: source.strict,
    mode: source.mode,
    arrow: true,
    locals: []});

exports.extendScope = (source, variables) => (
  checkEval(source),
  {
    type: "eval",
    enclave: source.enclave,
    strict: source.strict,
    mode: source.mode,
    arrow: source.arrow,
    locals: ArrayLite.concat(source.locals, variables)});

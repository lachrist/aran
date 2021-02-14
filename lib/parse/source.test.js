"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Source = require("./source.js");

/////////////////
// Constructor //
/////////////////

Source.Module();
Source.EnclaveModule();
Source.Script();
Source.EnclaveScript();
Source.Eval();
ArrayLite.forEach(
  [true, false],
  (strict) => ArrayLite.forEach(
    [
      "program",
      "constructor",
      "derived-constructor",
      "method",
      "function"],
    (mode) => {
      Source.EnclaveEval(strict, mode); }));

///////////
// Query //
///////////

const prototype = {
  isModule: false,
  isScript: false,
  isEval: false,
  isEnclave: false,
  isStrict: false
};

[
  [Source.Module(), true, false, false],
  [Source.EnclaveModule(), true, false, false],
  [Source.Script(), false, true, false],
  [Source.EnclaveScript(), false, true, false],
  
  ({0:source, boolean1, boolean2, boolean3}) => (
    

Assert.deepEqual(
  Source.isModule(Source.Module()),
  true);

Assert.deepEqual(
  Source.isModule(Source.EnclaveModule()),
  true);

Assert.deepEqual(
  

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
const Variable = require("./variable.js");
const Source = require("./source.js");

//////////////////
// Construction //
//////////////////

const test = (source, type, enclave, strict, mode, predicate) => {
  Assert.equal(
    Source.getType(source),
    type);
  Assert.equal(
    Source.isEnclave(source),
    enclave);
  Assert.equal(
    Source.isStrict(source),
    strict);
  Assert.equal(
    Source.getMode(source),
    mode);
  Assert.equal(
    Source.getVariablePredicate(source),
    predicate); }

ArrayLite.forEach(
  [
    ["script", false, null, false, "program", Variable.isScript],
    ["script", true, null, false, "program", Variable.isScript],
    ["module", false, null, true, "program", Variable.isModule],
    ["module", true, null, true, "program", Variable.isModule],
    ["eval", false, null, false, "program", Variable.isSloppyEval],
    ["eval", true, {mode:"function", strict:false}, false,"function", Variable.isSloppyEval],
    ["eval", true, {mode:"function", strict:true}, true, "function", Variable.isStrictEval]],
  ({0:type, 1:enclave, 2:options, 3:strict, 4:mode, 5:predicate}) => {
    // make //
    const source1 = Source.make(type, enclave, options);
    test(
      source1,
      type,
      enclave,
      strict,
      mode,
      predicate);
    // toEval //
    const source2 = Source.toEval(source1);
    test(
      source2,
      "eval",
      enclave,
      strict,
      mode,
      (
        strict ?
        Variable.isStrictEval :
        Variable.isSloppyEval));
    // extendStrict //
    test(
      Source.extendStrict(source2),
      "eval",
      enclave,
      true,
      mode,
      Variable.isStrictEval);
    // extendFunction //
    test(
      Source.extendFunction(source2, "method"),
      "eval",
      enclave,
      strict,
      "method",
      (
        strict ?
        Variable.isStrictEval :
        Variable.isSloppyEval));
    // extendArrow //
    test(
      Source.extendArrow(source2, "constructor"),
      "eval",
      enclave,
      strict,
      mode,
      (
        strict ?
        Variable.isStrictEval :
        Variable.isSloppyEval));
    // extendScope //
    test(
      Source.extendScope(source2, [Variable.Var("x")]),
      "eval",
      enclave,
      strict,
      mode,
      (
        strict ?
        Variable.isStrictEval :
        Variable.isSloppyEval)); });

///////////////////////////////
// updateGlobalVariableArray //
///////////////////////////////

Assert.deepEqual(
  Source.updateGlobalVariableArray(
    Source.make("script", false, null),
    [
      Variable.Let("x")],
    [
      Variable.Let("y")]),
  [
    Variable.Let("x"),
    Variable.Let("y")]);

Assert.throws(
  () => Source.updateGlobalVariableArray(
    Source.make("script", false, null),
    [
      Variable.Let("x")],
    [
      Variable.Let("x")]),
  new global.SyntaxError(`Duplicate variable declaration: x`));

Assert.throws(
  () => Source.updateGlobalVariableArray(
    Source.extendScope(
      Source.make("eval", false, null),
      [
        Variable.Let("x")]),
    [],
    [
      Variable.Let("x")]),
  new global.SyntaxError(`Duplicate variable declaration: x`));

Assert.deepEqual(
  Source.updateGlobalVariableArray(
    Source.extendFunction(
      Source.extendScope(
        Source.make("eval", false, null),
        [
          Variable.Let("x")]),
      "function"),
    [
      Variable.Let("y")],
    [
      Variable.Let("x")]),
  [
    Variable.Let("y")]);

Assert.deepEqual(
  Source.updateGlobalVariableArray(
    Source.extendArrow(
      Source.extendScope(
        Source.make("eval", false, null),
        [
          Variable.Let("x")])),
    [
      Variable.Let("y")],
    [
      Variable.Let("x")]),
  [
    Variable.Let("y")]);

Assert.deepEqual(
  Source.updateGlobalVariableArray(
    Source.make("eval", true, {strict:true, mode:"program"}),
    null,
    [
      Variable.Let("x")]),
  null);

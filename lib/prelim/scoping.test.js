"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
const Variable = require("../variable.js");
const Source = require("../source.js");
const ExternalParser = require("../external-parser.js");
const Scoping = require("./scoping.js");

const get = (object, keys) => {
  for (let index = 0; index < keys.length; index++) {
    object = object[keys[index]];
  }
  return object;
};

const prototype = {
  globals: [],
  hoistings: [[[], []]],
  evals: [[[], false]],
  stricts: [[[], false]],
  sources: []};

const test = (code, source, globals, result, _node) => (
  _node = ExternalParser.parse(code, source),
  _result = Scoping.scopeProgram(_node, source, globals),
  Assert.deepEqual(_result.globals, result.globals),
  ArrayLite.forEach(
    ["hoistings", "evals", "stricts", "sources"],
    (key) => Assert.deepEqual(
      _result[key],
      new global.Map(
        result[key],
        ({0:keys, 1:value}) => [
          get(node, keys),
          value]))));

/////////////
// Program //
/////////////

test(
  `let x;`,
  Source.make("script", false, null),
  [
    Variable.Let("y")],
  {
    __proto__: prototype,
    globals: [
      Variable.Let("y"),
      Variable.Let("x")]});

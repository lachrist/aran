"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
const Variable = require("../variable.js");
const Source = require("../source.js");
const ExternalParser = require("../external-parser.js");
const Cache = require("../cache.js");
const Scoping = require("./scoping.js");

const get = (object, keys) => {
  for (let index = 0; index < keys.length; index++) {
    // console.log(global.Array.isArray(object) ? "array" : object.type, keys[index]);
    object = object[keys[index]];
  }
  return object;
};

const prototype = {
  getHoisting: [[[], []]],
  hasDirectEvalCall: [[[], false]],
  hasUseStrictDirective: [[[], false]],
  getSource: []};

const test = (code, source, globals, result, _node, _result) => (
  _node = ExternalParser.parse(code, source),
  _result = Scoping.scopeProgram(_node, source, globals),
  Assert.deepEqual(_result.globals, result.globals),
  ArrayLite.forEach(
    ["getHoisting", "hasDirectEvalCall", "hasUseStrictDirective", "getSource"],
    (key) => ArrayLite.forEach(
      result.cache[key],
      ({0:location, 1:value}) => Assert.deepEqual(
          Cache[key](
            (
              // console.log(`${key} >> ${global.JSON.stringify(location)} >> ${get(_node, location).type} >> ${global.JSON.stringify(value)}`),
              _result.cache),
            get(_node, location)),
          value,
          `${key} >> ${global.JSON.stringify(location)} >> ${global.JSON.stringify(value)}`))));

const testSimplified  = (type, code, locations1, locations2) => test(
  code,
  Source.make(type, false, null),
  [],
  {
    globals: [],
    cache: {
      __proto__: prototype,
      hasDirectEvalCall: [
        [[], locations1.length > 0]],
      getSource: ArrayLite.map(
        locations1,
        (location) => [
          location,
          Source.make("eval", false, null)]),
      getHoisting: ArrayLite.map(
        locations2,
        (location) => [
          location,
          []])}});

const testSimplifiedScript = (code, locations1, locations2) => testSimplified("script", code, locations1, locations2);

const testSimplifiedModule = (code, locations1, locations2) => testSimplified("module", code, locations1, locations2);

///////////////////////////
// hasUseStrictDirective //
///////////////////////////

test(
  `
    "foo";
    "bar";`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: prototype});

test(
  `
    "foo";
    "bar";
    "use strict";`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      __proto__: prototype,
      hasUseStrictDirective: [[[], true]]}});

/////////////
// Program //
/////////////

test(
  `let x;`,
  Source.make("script", false, null),
  [
    Variable.Let("y")],
  {
    globals: [
      Variable.Let("y"),
      Variable.Let("x")],
    cache: prototype});

test(
  `
    "use strict";
    var x;
    eval("foo");`,
  Source.make("eval", false, null),
  [
    Variable.Let("y")],
  {
    globals: [
      Variable.Let("y")],
    cache: {
      __proto__: prototype,
      getHoisting: [
        [
          [],
          [
            Variable.Var("x")]]],
      hasUseStrictDirective: [
        [[], true]],
      hasDirectEvalCall: [
        [[], true]],
      getSource: [
        [
          ["body", 2, "expression"],
          Source.extendScope(
            Source.extendStrict(
              Source.make("eval", false, null)),
            [
              Variable.Var("x")])]]}});

//////////////////
// Declaration  //
//////////////////

test(
  `function f () {}`,
  Source.make("script", false, null),
  [],
  {
    globals: [
      Variable.Function("f")],
    cache: {
      hasDirectEvalCall: [
        [[], false],
        [
          ["body", 0],
          false],
        [
          ["body", 0, "body"],
          false]],
      hasUseStrictDirective: [
        [[], false],
        [
          ["body", 0],
          false]],
      getHoisting: [
        [[], []],
        [
          ["body", 0],
          []],
        [
          ["body", 0, "body"],
          []]],
      getSource: []}});

test(
  `import "source";`,
  Source.make("module", false, null),
  [],
  {
    globals: [],
    cache: prototype});

test(
  `export * from "source";`,
  Source.make("module", false, null),
  [],
  {
    globals: [],
    cache: prototype});

test(
  `export default class c {};`,
  Source.make("module", false, null),
  [],
  {
    globals: [],
    cache: {
      __proto__: prototype,
      getHoisting: [
        [
          [],
          [
            Variable.exportDefault(
              Variable.Class("c"))]]]}});

test(
  `
    let x;
    export {x};`,
  Source.make("module", false, null),
  [],
  {
    globals: [],
    cache: {
      __proto__: prototype,
      getHoisting: [
        [
          [],
          [
            Variable.exportSelf(
              Variable.Let("x"))]]]}});

test(
  `export let x = eval(123);`,
  Source.make("module", false, null),
  [],
  {
    globals: [],
    cache: {
      __proto__: prototype,
      hasDirectEvalCall: [
        [[], true]],
      getSource: [
        [
          ["body", 0, "declaration", "declarations", 0, "init"],
          Source.extendScope(
            Source.extendStrict(
              Source.make("eval", false, null)),
            [
              Variable.exportSelf(
                Variable.Let("x"))])]],
      getHoisting: [
        [
          [],
          [
            Variable.exportSelf(
              Variable.Let("x"))]]]}});

/////////////
// Closure //
/////////////

test(
  `(function (x = eval(123)) {
    var y;
    return eval(456); });`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      hasDirectEvalCall: [
        [[], false],
        [
          ["body", 0, "expression"],
          true],
        [
          ["body", 0, "expression", "body"],
          true]],
      hasUseStrictDirective: [
        [[], false],
        [
          ["body", 0, "expression"],
          false]],
      getHoisting: [
        [[], []],
        [
          ["body", 0, "expression"],
          [
            Variable.Param("x")]],
        [
          ["body", 0, "expression", "body"],
          [
            Variable.Var("y")]]],
      getSource: [
        [
          ["body", 0, "expression", "params", 0, "right"],
          Source.extendScope(
            Source.extendFunction(
              Source.make("eval", false, null),
              "function"),
            [
              Variable.Param("x")])],
        [
          ["body", 0, "expression", "body", "body", 1, "argument"],
          Source.extendScope(
            Source.extendFunction(
              Source.make("eval", false, null),
              "function"),
            [
              Variable.Var("y")])]]}});

test(
  `({ m () { eval(123); } });`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      hasDirectEvalCall: [
        [[], false],
        [
          ["body", 0, "expression", "properties", 0, "value"],
          false],
        [
          ["body", 0, "expression", "properties", 0, "value", "body"],
          true]],
      hasUseStrictDirective: [
        [[], false],
        [
          ["body", 0, "expression", "properties", 0, "value"],
          false]],
      getHoisting: [
        [[], []],
        [
          ["body", 0, "expression", "properties", 0, "value"],
          []],
        [
          ["body", 0, "expression", "properties", 0, "value", "body"],
          []]],
      getSource: [
        [
          ["body", 0, "expression", "properties", 0, "value", "body", "body", 0, "expression"],
          Source.extendFunction(
            Source.make("eval", false, null),
            "method")]]}});

test(
  `(() => eval(123));`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      hasDirectEvalCall: [
        [[], false],
        [
          ["body", 0, "expression"],
          false],
        [
          ["body", 0, "expression", "body"],
          true]],
      hasUseStrictDirective: [
        [[], false],
        [
          ["body", 0, "expression"],
          false]],
      getHoisting: [
        [[], []],
        [
          ["body", 0, "expression"],
          []]],
      getSource: [
        [
          ["body", 0, "expression", "body"],
          Source.extendArrow(
            Source.make("eval", false, null))]]}});

test(
  `(() => {
    "use strict";
    eval(123);
    return; });`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      hasDirectEvalCall: [
        [[], false],
        [
          ["body", 0, "expression"],
          false],
        [
          ["body", 0, "expression", "body"],
          true]],
      hasUseStrictDirective: [
        [[], false],
        [
          ["body", 0, "expression"],
          true]],
      getHoisting: [
        [[], []],
        [
          ["body", 0, "expression"],
          []],
        [
          ["body", 0, "expression", "body"],
          []]],
      getSource: [
        [
          ["body", 0, "expression", "body", "body", 1, "expression"],
          Source.extendStrict(
            Source.extendArrow(
              Source.make("eval", false, null)))]]}});

///////////
// Class //
///////////

test(
  `
    (class extends eval(123) {
      constructor () {
        eval(456);
        super(); }});`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      hasDirectEvalCall: [
        [[], true],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          false],
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body"],
          true]],
      hasUseStrictDirective: [
        [[], false],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          false]],
      getHoisting: [
        [[], []],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          []],
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body"],
          []]],
      getSource: [
        [
          ["body", 0, "expression", "superClass"],
          Source.extendStrict(
            Source.make("eval", false, null))],
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body", "body", 0, "expression"],
          Source.extendFunction(
            Source.extendStrict(
              Source.make("eval", false, null)),
            "derived-constructor")]]}});

test(
  `
    (class {
      constructor () {
        eval(123); }});`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      hasDirectEvalCall: [
        [[], false],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          false],
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body"],
          true]],
      hasUseStrictDirective: [
        [[], false],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          false]],
      getHoisting: [
        [[], []],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          []],
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body"],
          []]],
      getSource: [
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body", "body", 0, "expression"],
          Source.extendFunction(
            Source.extendStrict(
              Source.make("eval", false, null)),
            "constructor")]]}});

test(
  `
    (class {
      m () {
        eval(123); }});`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      hasDirectEvalCall: [
        [[], false],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          false],
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body"],
          true]],
      hasUseStrictDirective: [
        [[], false],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          false]],
      getHoisting: [
        [[], []],
        [
          ["body", 0, "expression", "body", "body", 0, "value"],
          []],
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body"],
          []]],
      getSource: [
        [
          ["body", 0, "expression", "body", "body", 0, "value", "body", "body", 0, "expression"],
          Source.extendFunction(
            Source.extendStrict(
              Source.make("eval", false, null)),
            "method")]]}});

///////////////
// Statement //
///////////////

// Atomic //

testSimplifiedScript(
  `debugger;`,
  [],
  [[]]);

testSimplifiedScript(
  `;`,
  [],
  [[]]);

testSimplifiedScript(
  `throw eval(123);`,
  [
    ["body", 0, "argument"]],
  [[]]);

testSimplifiedScript(
  `eval(123);`,
  [
    ["body", 0, "expression"]],
  [[]]);

// Compound //

testSimplifiedScript(
  `{ eval(123); }`,
  [
    ["body", 0, "body", 0, "expression"]],
  [
    [],
    ["body", 0]]);

testSimplifiedScript(
  `foo: { eval(123); }`,
  [
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `with (eval(123)) { eval(456); }`,
  [
    ["body", 0, "object"],
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `if (eval(123)) { eval(456); } else { eval(789); }`,
  [
    ["body", 0, "test"],
    ["body", 0, "consequent", "body", 0, "expression"],
    ["body", 0, "alternate", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "consequent"],
    ["body", 0, "alternate"]]);

testSimplifiedScript(
  `if (eval(123)) { eval(456); }`,
  [
    ["body", 0, "test"],
    ["body", 0, "consequent", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "consequent"]]);

testSimplifiedScript(
  `l: while (123) { break l; continue l; }`,
  [],
  [
    [],
    ["body", 0, "body", "body"]]);

testSimplifiedScript(
  `while (eval(123)) { eval(456); }`,
  [
    ["body", 0, "test"],
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `do { eval(123); } while (eval(456))`,
  [
    ["body", 0, "body", "body", 0, "expression"],
    ["body", 0, "test"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `for (eval(12); eval(34); eval(56)) { eval(78); }`,
  [
    ["body", 0, "init"],
    ["body", 0, "test"],
    ["body", 0, "update"],
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `for (; eval(34); eval(56)) { eval(78); }`,
  [
    ["body", 0, "test"],
    ["body", 0, "update"],
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `for (eval(12); ; eval(56)) { eval(78); }`,
  [
    ["body", 0, "init"],
    ["body", 0, "update"],
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `for (eval(12); eval(34);) { eval(78); }`,
  [
    ["body", 0, "init"],
    ["body", 0, "test"],
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `for (eval(123).k in eval(456)) { eval(78); }`,
  [
    ["body", 0, "left", "object"],
    ["body", 0, "right"],
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `for (eval(123).k of eval(456)) { eval(78); }`,
  [
    ["body", 0, "left", "object"],
    ["body", 0, "right"],
    ["body", 0, "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "body"]]);

testSimplifiedScript(
  `try { eval(123); } catch { eval(456); } finally { eval(789); }`,
  [
    ["body", 0, "block", "body", 0, "expression"],
    ["body", 0, "handler", "body", "body", 0, "expression"],
    ["body", 0, "finalizer", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "block"],
    ["body", 0, "handler", "body"],
    ["body", 0, "finalizer"]]);

testSimplifiedScript(
  `try { eval(123); } finally { eval(456); }`,
  [
    ["body", 0, "block", "body", 0, "expression"],
    ["body", 0, "finalizer", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "block"],
    ["body", 0, "finalizer"]]);

testSimplifiedScript(
  `try { eval(123); } catch { eval(456); }`,
  [
    ["body", 0, "block", "body", 0, "expression"],
    ["body", 0, "handler", "body", "body", 0, "expression"]],
  [
    [],
    ["body", 0, "block"],
    ["body", 0, "handler", "body"]]);

test(
  `try {} catch ([e = eval(123)]) { let x; eval(456); }`,
  Source.make("script", false, null),
  [],
  {
    globals: [],
    cache: {
      __proto__: prototype,
      hasDirectEvalCall: [
        [[], true]],
      getHoisting: [
        [
          ["body", 0, "block"],
          []],
        [
          ["body", 0, "handler"],
          [
            Variable.ComplexErrorParam("e")]],
        [
          ["body", 0, "handler", "body"],
          [
            Variable.Let("x")]]],
      getSource: [
        [
          ["body", 0, "handler", "param", "elements", 0, "right"],
          Source.extendScope(
            Source.make("eval", false, null),
            [
              Variable.ComplexErrorParam("e")])],
        [
          ["body", 0, "handler", "body", "body", 1, "expression"],
          Source.extendScope(
            Source.extendScope(
              Source.make("eval", false, null),
              [
                Variable.ComplexErrorParam("e")]),
            [
              Variable.Let("x")])]]}});

testSimplifiedScript(
  `switch (eval(12)) {
    case eval(34): eval(56);
    default: eval(78); }`,
  [
    ["body", 0, "discriminant"],
    ["body", 0, "cases", 0, "test"],
    ["body", 0, "cases", 0, "consequent", 0, "expression"],
    ["body", 0, "cases", 1, "consequent", 0, "expression"]],
  [
    [],
    ["body", 0]]);

// Declaration //

////////////////
// Expression //
////////////////

// Environment //

testSimplifiedScript(
  `x;`,
  [],
  [[]]);

testSimplifiedScript(
  `({[eval(123)]: x} = eval(456));`,
  [
    ["body", 0, "expression", "left", "properties", 0, "key"],
    ["body", 0, "expression", "right"]],
  [[]]);

testSimplifiedScript(
  `(eval(123).k++);`,
  [
    ["body", 0, "expression", "argument", "object"]],
  [[]]);

testSimplifiedScript(
  `this;`,
  [],
  [[]]);

testSimplifiedModule(
  `import.meta;`,
  [],
  [[]]);

// Literal //

testSimplifiedScript(
  `123;`,
  [],
  [[]]);

testSimplifiedScript(
  `([eval(123), ...eval(456),,]);`,
  [
    ["body", 0, "expression", "elements", 0],
    ["body", 0, "expression", "elements", 1, "argument"]],
  [[]]);

testSimplifiedScript(
  `({[eval(123)]: eval(456), ... eval(789)});`,
  [
    ["body", 0, "expression", "properties", 0, "key"],
    ["body", 0, "expression", "properties", 0, "value"],
    ["body", 0, "expression", "properties", 1, "argument"]],
  [[]]);

// Control //

testSimplifiedScript(
  `(eval(123) || eval(456));`,
  [
    ["body", 0, "expression", "left"],
    ["body", 0, "expression", "right"]],
  [[]]);

testSimplifiedScript(
  `(eval(123) ? eval(456) : eval(789));`,
  [
    ["body", 0, "expression", "test"],
    ["body", 0, "expression", "consequent"],
    ["body", 0, "expression", "alternate"]],
  [[]]);

testSimplifiedScript(
  `(eval(123), eval(456))`,
  [
    ["body", 0, "expression", "expressions", 0],
    ["body", 0, "expression", "expressions", 1]],
  [[]]);

// Combination //

testSimplifiedScript(
  `(eval(123)[eval(456)]);`,
  [
    ["body", 0, "expression", "object"],
    ["body", 0, "expression", "property"]],
  [[]]);

testSimplifiedScript(
  `(!eval(123));`,
  [
    ["body", 0, "expression", "argument"]],
  [[]]);

testSimplifiedScript(
  `(eval(123) + eval(456));`,
  [
    ["body", 0, "expression", "left"],
    ["body", 0, "expression", "right"]],
  [[]]);

testSimplifiedScript(
  `(new (eval(123))(eval(456), eval(789)));`,
  [
    ["body", 0, "expression", "callee"],
    ["body", 0, "expression", "arguments", 0],
    ["body", 0, "expression", "arguments", 1]],
  [[]]);

testSimplifiedScript(
  `((eval(123))(eval(456), eval(789)));`,
  [
    ["body", 0, "expression", "callee"],
    ["body", 0, "expression", "arguments", 0],
    ["body", 0, "expression", "arguments", 1]],
  [[]]);

/////////////
// Pattern //
/////////////

testSimplifiedScript(
  `([{[eval(123)]:x} = eval(123)] = "foo");`,
  [
    ["body", 0, "expression", "left", "elements", 0, "left", "properties", 0, "key"],
    ["body", 0, "expression", "left", "elements", 0, "right"]],
  [[]]);

testSimplifiedScript(
  `({[eval(123)]:{[eval(456)]:x}} = "foo");`,
  [
    ["body", 0, "expression", "left", "properties", 0, "key"],
    ["body", 0, "expression", "left", "properties", 0, "value", "properties", 0, "key"]],
  [[]]);

testSimplifiedScript(
  `([{[eval(123)]:x},, ...[{[eval(456)]:xs}]] = "foo");`,
  [
    ["body", 0, "expression", "left", "elements", 0, "properties", 0, "key"],
    ["body", 0, "expression", "left", "elements", 2, "argument", "elements", 0, "properties", 0, "key"]],
  [[]]);

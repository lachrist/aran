"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
const Variable = require("../variable.js");
const Source = require("../source.js");
const ExternalParser = require("../external-parser.js");
const Hoisting = require("./hoisting.js");

/////////////
// collect //
/////////////

const get = (object, keys) => {
  for (let index = 0; index < keys.length; index++) {
    object = object[keys[index]];
  }
  return object;
};

const returnTrue = () => true;

const test = (node, hoistings, _hoistings) => (
  _hoistings = new global.Map,
  node = (
    typeof node === "string" ?
    ExternalParser.parse(
      node,
      Source.make("module", false, null)) :
    node),
  Assert.deepEqual(
    Hoisting.hoistProgram(node, _hoistings, returnTrue),
    []),
  Assert.equal(hoistings.length, _hoistings.size),
  ArrayLite.forEach(
    hoistings,
    ({0:keys, 1:variables}) => Assert.deepEqual(
      _hoistings.get(
        get(node, keys)),
      variables)));

const testSimplified = (code, variables) => test(code, [[[], variables]]);

/////////////
// collect //
/////////////

testSimplified(
  `let x = 123;`,
  [
    Variable.Let("x")]);

testSimplified(
  `let [x = 123, , ...xs] = 456;`,
  [
    Variable.Let("x"),
    Variable.Let("xs")]);

testSimplified(
  `let {k:x, ...o} = 123;`,
  [
    Variable.Let("x"),
    Variable.Let("o")]);

////////////
// Import //
////////////

testSimplified(
  `import * as x from "source";`,
  [
    Variable.Import("x", null, "source")]);

testSimplified(
  `import {specifier as x} from "source";`,
  [
    Variable.Import("x", "specifier", "source")]);

testSimplified(
  `import x from "source"`,
  [
    Variable.Import("x", "default", "source")]);

////////////
// Export //
////////////

testSimplified(
  `
    let x = 123;
    export {x as specifier};`,
  [
    Variable.exportNamed(
      Variable.Let("x"),
      {
        local: {
          type: "Identifier",
          name: "x"},
        exported: {
          type: "Idenifier",
          name: "specifier"}})]);

testSimplified(
  `export let x = 123;`,
  [
    Variable.exportSelf(
      Variable.Let("x"))]);

testSimplified(
  `export default function f () {};`,
  [
    Variable.exportDefault(
      Variable.Function("f"))]);

testSimplified(
  `export default class c {};`,
  [
    Variable.exportDefault(
      Variable.Class("c"))]);

testSimplified(
  `export default function () {};`,
  []);

testSimplified(
  `export default class {};`,
  []);

testSimplified(
  `export default 123;`,
  []);

testSimplified(
  `export * from "source";`,
  []);

////////////////////////////
// Hoisting (not binding) //
////////////////////////////

testSimplified(
  `
    debugger;
    ;
    123;
    throw 456;`,
  []);

testSimplified(
  `l : while (123)
    break l;`,
  []);

testSimplified(
  `l : while (123)
    continue l;`,
  []);

testSimplified(
  `l: var x;`,
  [
    Variable.Var("x")]);

testSimplified(
  `if (123) var x; else var y;`,
  [
    Variable.Var("x"),
    Variable.Var("y")]);

testSimplified(
  `if (123) var x;`,
  [
    Variable.Var("x")]);

testSimplified(
  `while (123) var x;`,
  [
    Variable.Var("x")]);

testSimplified(
  `do var x; while (123)`,
  [
    Variable.Var("x")]);

testSimplified(
  `function f () {};`,
  [
    Variable.Function("f")]);

testSimplified(
  `class c {};`,
  [
    Variable.Class("c")]);

testSimplified(
  ExternalParser.parse(
    `with (123) var x;`,
    Source.make("script", false, null)),
  [
    Variable.Var("x")]);

////////////////////////
// Hoisting (binding) //
////////////////////////

// block //

test(
  `{
    let x;
    const y = 123;
    var z;
    class c {};
    function f () {}; }`,
  [
    [
      [],
      [
        Variable.Var("z"),
        Variable.Function("f")]],
    [
      ["body", 0],
      [
        Variable.Let("x"),
        Variable.Const("y"),
        Variable.Class("c")]]]);

test(
  `switch (1) {
    case 2: let x;
    case 3: const y = 456;
    case 4: var z;
    case 5: class c {};
    case 6: function f () {}; }`,
  [
    [
      [],
      [
        Variable.Var("z"),
        Variable.Function("f")]],
    [
      ["body", 0],
      [
        Variable.Let("x"),
        Variable.Const("y"),
        Variable.Class("c")]]]);

// try //

test(
  `try { let x; } catch (e) { let y; } finally { let z; }`,
  [
    [[], []],
    [
      ["body", 0, "block"],
      [
        Variable.Let("x")]],
    [
      ["body", 0, "handler"],
      [
        Variable.SimpleErrorParam("e")]],
    [
      ["body", 0, "handler", "body"],
      [
        Variable.Let("y")]],
    [
      ["body", 0, "finalizer"],
      [
        Variable.Let("z")]]]);

test(
  `try { let x; } catch { let y; } finally { let z; }`,
  [
    [[], []],
    [
      ["body", 0, "block"],
      [
        Variable.Let("x")]],
    [
      ["body", 0, "handler"],
      []],
    [
      ["body", 0, "handler", "body"],
      [
        Variable.Let("y")]],
    [
      ["body", 0, "finalizer"],
      [
        Variable.Let("z")]]]);

test(
  `try { let x; } catch ([e1, e2]) { let y; }`,
  [
    [[], []],
    [
      ["body", 0, "block"],
      [
        Variable.Let("x")]],
    [
      ["body", 0, "handler"],
      [
        Variable.ComplexErrorParam("e1"),
        Variable.ComplexErrorParam("e2")]],
    [
      ["body", 0, "handler", "body"],
      [
        Variable.Let("y")]]]);

test(
  `try { let x; } finally { let z; }`,
  [
    [[], []],
    [
      ["body", 0, "block"],
      [
        Variable.Let("x")]],
    [
      ["body", 0, "finalizer"],
      [
        Variable.Let("z")]]]);

// for //

test(
  `for (let x;;) var y`,
  [
    [
      [],
      [
        Variable.Var("y")]],
    [
      ["body", 0],
      [
        Variable.Let("x")]]]);

test(
  `for (;;) var y`,
  [
    [
      [],
      [
        Variable.Var("y")]],
    [
      ["body", 0],
      []]]);

test(
  `for (let x in 123) var y`,
  [
    [
      [],
      [
        Variable.Var("y")]],
    [
      ["body", 0],
      [
        Variable.Let("x")]]]);

test(
  `for (x in 123) var y`,
  [
    [
      [],
      [
        Variable.Var("y")]],
    [
      ["body", 0],
      []]]);

test(
  `for (let x of 123) var y`,
  [
    [
      [],
      [
        Variable.Var("y")]],
    [
      ["body", 0],
      [
        Variable.Let("x")]]]);

test(
  `for (x of 123) var y`,
  [
    [
      [],
      [
        Variable.Var("y")]],
    [
      ["body", 0],
      []]]);

//////////////////
// hoistClosure //
//////////////////

{
  const hoistings = new global.Map();
  let node = ExternalParser.parse(
    `(function (p1, p2) {
      let x;
      const y = 123;
      var z;
      class c {};
      function f () {};
      return 456; });`,
    Source.make("script", false, null));
  node = node.body[0].expression;
  Assert.deepEqual(
    Hoisting.hoistClosure(node, hoistings, false),
    []);
  Assert.deepEqual(
    hoistings,
    new global.Map(
      [
        [
          node,
          [
            Variable.Param("p1"),
            Variable.Param("p2")]],
        [
          node.body,
          [
            Variable.Let("x"),
            Variable.Const("y"),
            Variable.Var("z"),
            Variable.Class("c"),
            Variable.Function("f")]]])); }

{
  const hoistings = new global.Map();
  let node = ExternalParser.parse(
    `(([p1, p2]) => 123);`,
    Source.make("script", false, null));
  node = node.body[0].expression;
  Assert.deepEqual(
    Hoisting.hoistClosure(node, hoistings, true),
    []);
  Assert.deepEqual(
    hoistings,
    new global.Map(
      [
        [
          node,
          [
            Variable.Param("p1"),
            Variable.Param("p2")]]])); }
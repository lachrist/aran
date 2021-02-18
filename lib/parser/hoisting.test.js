"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
const Acorn = require("acorn");
const Variable = require("./variable.js");
const Source = require("./source.js");
const Wrapper = require("./wrapper");
const Parser = require("./parser.js");
const Hoisting = require("./hoisting.js");

const get = (object, keys) => {
  for (let index = 0; index < keys.length; index++) {
    object = object[keys[index]];
  }
  return object;
};

const parse = Wrapper.wrapAcorn(Acorn);

const makeCallback = (node, iterator) => (key, value, _step) => (
  _step = iterator.next(),
  Assert.ok(!_step.done),
  Assert.equal(
    key,
    get(node, _step.value[0])),
  Assert.deepEqual(value, _step.value[1]));

const returnTrue = () => true;

const test = (node, hoistings) => (
  node = (
    typeof node === "string" ?
    Parser.parse(
      node,
      Source.make("module", false, null),
      parse,
      null) :
    node),
  hoistings = hoistings[global.Symbol.iterator](),
  Assert.deepEqual(
    Hoisting.hoistProgram(
      node,
      makeCallback(node, hoistings),
      returnTrue),
    []),
  Assert.ok(hoistings.next().done));

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
  Parser.parse(
    `with (123) var x;`,
    Source.make("script", false, null),
    parse,
    null),
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
      ["body", 0],
      [
        Variable.Let("x"),
        Variable.Const("y"),
        Variable.Class("c")]],
    [
      [],
      [
        Variable.Var("z"),
        Variable.Function("f")]]]);

test(
  `switch (1) {
    case 2: let x;
    case 3: const y = 456;
    case 4: var z;
    case 5: class c {};
    case 6: function f () {}; }`,
  [
    [
      ["body", 0],
      [
        Variable.Let("x"),
        Variable.Const("y"),
        Variable.Class("c")]],
    [
      [],
      [
        Variable.Var("z"),
        Variable.Function("f")]]]);

// try //

test(
  `try { let x; } catch (e) { let y; } finally { let z; }`,
  [
    [
      ["body", 0, "block"],
      [
        Variable.Let("x")]],
    [
      ["body", 0, "handler", "body"],
      [
        Variable.Let("y")]],
    [
      ["body", 0, "handler"],
      [
        Variable.SimpleErrorParam("e")]],
    [
      ["body", 0, "finalizer"],
      [
        Variable.Let("z")]],
    [[], []]]);

test(
  `try { let x; } catch { let y; } finally { let z; }`,
  [
    [
      ["body", 0, "block"],
      [
        Variable.Let("x")]],
    [
      ["body", 0, "handler", "body"],
      [
        Variable.Let("y")]],
    [
      ["body", 0, "handler"],
      []],
    [
      ["body", 0, "finalizer"],
      [
        Variable.Let("z")]],
    [[], []]]);

test(
  `try { let x; } catch ([e1, e2]) { let y; }`,
  [
    [
      ["body", 0, "block"],
      [
        Variable.Let("x")]],
    [
      ["body", 0, "handler", "body"],
      [
        Variable.Let("y")]],
    [
      ["body", 0, "handler"],
      [
        Variable.ComplexErrorParam("e1"),
        Variable.ComplexErrorParam("e2")]],
    [[], []]]);

test(
  `try { let x; } finally { let z; }`,
  [
    [
      ["body", 0, "block"],
      [
        Variable.Let("x")]],
    [
      ["body", 0, "finalizer"],
      [
        Variable.Let("z")]],
    [[], []]]);

// for //

test(
  `for (let x;;) var y`,
  [
    [
      ["body", 0],
      [
        Variable.Let("x")]],
    [
      [],
      [
        Variable.Var("y")]]]);

test(
  `for (;;) var y`,
  [
    [
      ["body", 0],
      []],
    [
      [],
      [
        Variable.Var("y")]]]);

test(
  `for (let x in 123) var y`,
  [
    [
      ["body", 0],
      [
        Variable.Let("x")]],
    [
      [],
      [
        Variable.Var("y")]]]);

test(
  `for (x in 123) var y`,
  [
    [
      ["body", 0],
      []],
    [
      [],
      [
        Variable.Var("y")]]]);

test(
  `for (let x of 123) var y`,
  [
    [
      ["body", 0],
      [
        Variable.Let("x")]],
    [
      [],
      [
        Variable.Var("y")]]]);

test(
  `for (x of 123) var y`,
  [
    [
      ["body", 0],
      []],
    [
      [],
      [
        Variable.Var("y")]]]);

//////////////////
// hoistClosure //
//////////////////

{
  let node = Parser.parse(
    `(function (p1, p2) {
      let x;
      const y = 123;
      var z;
      class c {};
      function f () {};
      return 456; });`,
    Source.make("script", false, null),
    parse,
    null);
  node = node.body[0].expression;
  const array = [
    [
      ["body"],
      [
        Variable.Let("x"),
        Variable.Const("y"),
        Variable.Var("z"),
        Variable.Class("c"),
        Variable.Function("f")]],
    [
      [],
      [
        Variable.Param("p1"),
        Variable.Param("p2")]]];
  const iterator = array[global.Symbol.iterator]();
  Assert.deepEqual(
    Hoisting.hoistClosure(
      node,
      makeCallback(node, iterator),
      false),
    []);
  Assert.ok(iterator.next().done); }

{
  let node = Parser.parse(
    `(([p1, p2]) => 123);`,
    Source.make("script", false, null),
    parse,
    null);
  node = node.body[0].expression;
  const array = [
    [
      [],
      [
        Variable.Param("p1"),
        Variable.Param("p2")]]];
  const iterator = array[global.Symbol.iterator]();
  Assert.deepEqual(
    Hoisting.hoistClosure(
      node,
      makeCallback(node, iterator),
      true),
    []); }
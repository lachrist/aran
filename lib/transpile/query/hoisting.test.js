"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
const ParseExternal = require("../../parse-external.js");
const Hoisting = require("./hoisting.js");

///////////////////////////////////
// _get_pattern_identifier_array //
///////////////////////////////////

{
  const test = (code, identifiers) => Assert.deepEqual(
    Hoisting._get_pattern_identifier_array(
      ParseExternal("(" + code + " = 123);", {source:"module"}).body[0].expression.left),
    identifiers);
  test(`o.k`, []);
  test(`[x = 1]`, ["x"]);
  test(`[x1,, x2,, x3,, ...xs]`, ["x1", "x2", "x3", "xs"]);
  test(`{a:x, b:y, ...o}`, ["x", "y", "o"]);}

/////////////////////////////
// _get_parameter_hoisting //
/////////////////////////////

  Assert.deepEqual(
    Hoisting._get_parameter_hoisting(
      {
        type: "Identifier",
        name: "x"}),
    [
      {
        kind: "param",
        name: "x",
        ghost: false,
        exports: []}]);

///////////////////////////
// _get_shallow_hoisting //
///////////////////////////

{
  const test = (code, variables, _nodes, _variables) => (
    _nodes = ParseExternal(code, {source:"module"}).body,
    _variables = ArrayLite.flatMap(_nodes, Hoisting._get_shallow_hoisting),
    ArrayLite.forEach(_nodes, (node) => Hoisting._completeExportLinks(node, _variables)),
    Assert.deepEqual(_variables, variables));
  test(
    `
      f();
      let [x1, x2, x3] = "foo", [x4, x5, x6] = "bar";
      const [y1, y2, y3] = "foo", [y4, y5, y6] = "bar"
      for (let z in o) {}
      class C {}`,
    [
      {kind:"let", name:"x1", ghost:false, exports:[]},
      {kind:"let", name:"x2", ghost:false, exports:[]},
      {kind:"let", name:"x3", ghost:false, exports:[]},
      {kind:"let", name:"x4", ghost:false, exports:[]},
      {kind:"let", name:"x5", ghost:false, exports:[]},
      {kind:"let", name:"x6", ghost:false, exports:[]},
      {kind:"const", name:"y1", ghost:false, exports:[]},
      {kind:"const", name:"y2", ghost:false, exports:[]},
      {kind:"const", name:"y3", ghost:false, exports:[]},
      {kind:"const", name:"y4", ghost:false, exports:[]},
      {kind:"const", name:"y5", ghost:false, exports:[]},
      {kind:"const", name:"y6", ghost:false, exports:[]},
      {kind:"class", name:"C", ghost:false, exports:[]}]);
  test(
    `
      // Declaration Export //
      export function function1 () {};
      export class class1 {};
      export let [let1, let2] = 123, [let3, let4] = 456;
      export var [var1, var2] = 789, [var3, var4] = 789;
      export const [const1, const2] = 901, [const3, const4] = 234;
      // Import //
      import import1 from "source1";
      import {key1 as import2, key2 as import3, default as import4} from "source2";
      import * as import5 from "source3";
      // Specifier Export //
      export * from "source4";
      export {foo as bar} from "source5";
      let let5;
      export {let1 as let1_spc, let2 as let2_spc, let5 as let5_spc}
      export {import1};
      export {import1 as import1_spc};`,
    [
      {kind:"class", name:"class1", ghost:false, exports:["class1"]},
      {kind:"let", name:"let1", ghost:false, exports:["let1", "let1_spc"]},
      {kind:"let", name:"let2", ghost:false, exports:["let2", "let2_spc"]},
      {kind:"let", name:"let3", ghost:false, exports:["let3"]},
      {kind:"let", name:"let4", ghost:false, exports:["let4"]},
      {kind:"const", name:"const1", ghost:false, exports:["const1"]},
      {kind:"const", name:"const2", ghost:false, exports:["const2"]},
      {kind:"const", name:"const3", ghost:false, exports:["const3"]},
      {kind:"const", name:"const4", ghost:false, exports:["const4"]},
      {kind:"import", name:"import1", ghost:true, exports:["import1", "import1_spc"], ImportExpression:"default", source:"source1"},
      {kind:"import", name:"import2", ghost:true, exports:[], ImportExpression:"key1", source:"source2"},
      {kind:"import", name:"import3", ghost:true, exports:[], ImportExpression:"key2", source:"source2"},
      {kind:"import", name:"import4", ghost:true, exports:[], ImportExpression:"default", source:"source2"},
      {kind:"import", name:"import5", ghost:true, exports:[], ImportExpression:null, source:"source3"},
      {kind:"let", name:"let5", ghost:false, exports:["let5_spc"]}]);
  // Default Export //
  test(
    `export default function name () {};`,
    []);
  test(
    `export default function () {};`,
    []);
  test(
    `export default class name {};`,
    [{kind:"class", name:"name", ghost:false, exports:["default"]}]);
  test(
    `export default class {};`,
    []);
  test(
    `export default 123;`,
    []);
  test(
    `export {foo} from "source";`,
    []);}

////////////////////////
// _get_deep_hoisting //
////////////////////////

{
  const test = (code, variables, _nodes, _variables) => (
    _nodes = ParseExternal(code, {source:"module"}).body,
    _variables = ArrayLite.flatMap(_nodes, Hoisting._get_deep_hoisting),
    ArrayLite.forEach(_nodes, (node) => Hoisting._completeExportLinks(node, _variables)),
    Assert.deepEqual(_variables, variables));
  test(
    `
      var x1 = 1, x2 = 2, x3 = 3;
      var y1 = 4, y2 = 5, y3 = 6;`,
    [
      {kind:"var", name:"x1", ghost:false, exports:[]},
      {kind:"var", name:"x2", ghost:false, exports:[]},
      {kind:"var", name:"x3", ghost:false, exports:[]},
      {kind:"var", name:"y1", ghost:false, exports:[]},
      {kind:"var", name:"y2", ghost:false, exports:[]},
      {kind:"var", name:"y3", ghost:false, exports:[]}]);
  test(
    `123;`,
    []);
  test(
    `function f () { var x = 1; }`,
    [
      {kind:"function", name:"f", ghost:false, exports:[]}]);
  test(
    `{ var x = 1; }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}]);
  test(
    `foo: { var x = 1; }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}]);
  test(
    `if (123) { var x = 1; }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}]);
  test(
    `if (123) { var x = 1; } else { var y = 2; }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `while (123) { var x = 1; }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}]);
  test(
    `do { var x = 1; } while (123);`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}]);
  test(
    `try { var x = 1; } catch { var y = 2; } finally { var z = 3 }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]},
      {kind:"var", name:"z", ghost:false, exports:[]}]);
  test(
    `try { var x = 1; } finally { var z = 3 }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"z", ghost:false, exports:[]}]);
  test(
    `try { var x = 1; } catch { var y = 2; }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (; 456; 789) { var y = 1 }`,
    [
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (123; 456; 789) { var y = 1 }`,
    [
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (let x = 123; 456; 789) { var y = 1 }`,
    [
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (var x = 123; 456; 789) { var y = 1 }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (x in o) { var y = 1 }`,
    [
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (let x in o) { var y = 1 }`,
    [
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (var x in o) { var y = 1 }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (x of o) { var y = 1 }`,
    [
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (let x of o) { var y = 1 }`,
    [
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `for (var x of o) { var y = 1 }`,[
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]}]);
  test(
    `switch (123) {
      case 456: var x = 1;
      case 789: var y = 2;
      default: var z = 3; }`,
    [
      {kind:"var", name:"x", ghost:false, exports:[]},
      {kind:"var", name:"y", ghost:false, exports:[]},
      {kind:"var", name:"z", ghost:false, exports:[]}]);
  test(
    `export default 123;`,
    []);
  test(
    `export {foo} from "source";`,
    []);
  test(
    `export default function () {};`,
    []);
  test(
    `export default function f () {};`,
    [
      {kind:"function", name:"f", ghost:false, exports:["default"]}]);
  test(
    `export default class {};`,
    []);
  test(
    `export default class c {};`,
    []);
  test(
    `export let x = 123;`,
    []);
  test(
    `export const x = 123;`,
    []);
  test(
    `export var x = 123;`,
    [{kind:"var", name:"x", ghost:false, exports:["x"]}])};

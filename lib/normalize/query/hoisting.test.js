"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ArrayLite = require("array-lite");
const Parse = require("../../parse.js");
const Hoisting = require("./hoisting.js");

/////////////////////////////
// _get_parameter_hoisting //
/////////////////////////////

{
  const test = (code, identifiers) => Assert.deepEqual(
    Hoisting._get_parameter_hoisting(
      [Parse.module("(" + code + " = 123);").body[0].expression.left]),
    ArrayLite.map(identifiers, (identifier) => ({
      kind: "param",
      name: identifier})));
  test(`[x = 1]`, ["x"]);
  test(`[x1,, x2,, x3,, ...xs]`, ["x1", "x2", "x3", "xs"]);
  test(`{a:x, b:y, ...o}`, ["x", "y", "o"]);}

/////////////////////////
// _get_block_hoisting //
/////////////////////////

{
  const test = (code, variables) => Assert.deepEqual(
    Hoisting._get_block_hoisting(
      Parse.module(code).body),
    variables);
  test(
    `
      f();
      let [x1, x2, x3] = "foo", [x4, x5, x6] = "bar";
      const [y1, y2, y3] = "foo", [y4, y5, y6] = "bar"
      for (let z in o) {}
      class C {}`,
    [
      {kind:"let", name:"x1"},
      {kind:"let", name:"x2"},
      {kind:"let", name:"x3"},
      {kind:"let", name:"x4"},
      {kind:"let", name:"x5"},
      {kind:"let", name:"x6"},
      {kind:"const", name:"y1"},
      {kind:"const", name:"y2"},
      {kind:"const", name:"y3"},
      {kind:"const", name:"y4"},
      {kind:"const", name:"y5"},
      {kind:"const", name:"y6"},
      {kind:"class", name:"C"}]);
  test(
    `
      // Named Export //
      export function function1 () {};
      export class class1 {};
      export let [let1, let2] = 123, [let3, let4] = 456;
      export var [var1, var2] = 789, [var3, var4] = 789;
      export const [const1, const2] = 901, [const3, const4] = 234;
      // Import //
      import import1 from "source1";
      import {key1 as import2, key2 as import3, default as import4} from "source2";
      import * as import5 from "source3";`,
    [
      {kind:"class", name:"class1"},
      {kind:"let", name:"let1"},
      {kind:"let", name:"let2"},
      {kind:"let", name:"let3"},
      {kind:"let", name:"let4"},
      {kind:"const", name:"const1"},
      {kind:"const", name:"const2"},
      {kind:"const", name:"const3"},
      {kind:"const", name:"const4"},
      {kind:"import", name:"import1"},
      {kind:"import", name:"import2"},
      {kind:"import", name:"import3"},
      {kind:"import", name:"import4"},
      {kind:"import", name:"import5"}]);
  // Default Export //
  test(
    `export default function name () {};`,
    []);
  test(
    `export default function () {};`,
    []);
  test(
    `export default class name {};`,
    [{kind:"class", name:"name"}]);
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
  const test = (code, variables) => Assert.deepEqual(
    Hoisting._get_closure_hoisting(
      Parse.module(code).body),
    variables);
  test(
    `
      var x1 = 1, x2 = 2, x3 = 3;
      var y1 = 4, y2 = 5, y3 = 6;`,
    [
      {kind:"var", name:"x1"},
      {kind:"var", name:"x2"},
      {kind:"var", name:"x3"},
      {kind:"var", name:"y1"},
      {kind:"var", name:"y2"},
      {kind:"var", name:"y3"}]);
  test(
    `123;`,
    []);
  test(
    `function f () { var x = 1; }`,
    [
      {kind:"function", name:"f"}]);
  test(
    `{ var x = 1; }`,
    [
      {kind:"var", name:"x"}]);
  test(
    `foo: { var x = 1; }`,
    [
      {kind:"var", name:"x"}]);
  test(
    `if (123) { var x = 1; }`,
    [
      {kind:"var", name:"x"}]);
  test(
    `if (123) { var x = 1; } else { var y = 2; }`,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"}]);
  test(
    `while (123) { var x = 1; }`,
    [
      {kind:"var", name:"x"}]);
  test(
    `do { var x = 1; } while (123);`,
    [
      {kind:"var", name:"x"}]);
  test(
    `try { var x = 1; } catch { var y = 2; } finally { var z = 3 }`,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"},
      {kind:"var", name:"z"}]);
  test(
    `try { var x = 1; } finally { var z = 3 }`,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"z"}]);
  test(
    `try { var x = 1; } catch { var y = 2; }`,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"}]);
  test(
    `for (; 456; 789) { var y = 1 }`,
    [
      {kind:"var", name:"y"}]);
  test(
    `for (123; 456; 789) { var y = 1 }`,
    [
      {kind:"var", name:"y"}]);
  test(
    `for (let x = 123; 456; 789) { var y = 1 }`,
    [
      {kind:"var", name:"y"}]);
  test(
    `for (var x = 123; 456; 789) { var y = 1 }`,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"}]);
  test(
    `for (x in o) { var y = 1 }`,
    [
      {kind:"var", name:"y"}]);
  test(
    `for (let x in o) { var y = 1 }`,
    [
      {kind:"var", name:"y"}]);
  test(
    `for (var x in o) { var y = 1 }`,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"}]);
  test(
    `for (x of o) { var y = 1 }`,
    [
      {kind:"var", name:"y"}]);
  test(
    `for (let x of o) { var y = 1 }`,
    [
      {kind:"var", name:"y"}]);
  test(
    `for (var x of o) { var y = 1 }`,[
      {kind:"var", name:"x"},
      {kind:"var", name:"y"}]);
  test(
    `switch (123) {
      case 456: var x = 1;
      case 789: var y = 2;
      default: var z = 3; }`,
    [
      {kind:"var", name:"x"},
      {kind:"var", name:"y"},
      {kind:"var", name:"z"}]);
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
      {kind:"function", name:"f"}]);
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
    [{kind:"var", name:"x"}])};

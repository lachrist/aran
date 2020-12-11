"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Parse = require("./parse/index.js");
const Generate = require("./generate.js");

// Program //
{
  const test = (code) => Assert.deepEqual(
    Generate._indented_program(
      "    ",
      Parse._program(code)),
    code);
  test(`import * from "source1";
    import function from "source2";
    export var;
    aggregate * from "source3";
    aggregate * from "source4" as class;
    aggregate if from "source5" as while;
    {
      123;}`);
}

// Block //
{
  const test = (code) => Assert.deepEqual(
    Generate._indented_block(
      "  ",
      Parse.BLOCK(code)),
    code);
  test(`{
    123;
    456;}`);
  test(`{
    let x, y;
    123;
    456;}`);
}

// Statement //
{
  const test = (code) => Assert.deepEqual(
    Generate._indented_statement(
      "    ",
      Parse.Statement(code)),
    code);
  // Lift //
  test(`
    123;`);
  // Return //
  test(`
    return 123;`);
  // Break //
  test(`
    break l;`);
  // Continue //
  test(`
    continue l;`);
  // Debugger //
  test(`
    debugger;`);
  // Bundle //
  test(`
    123;
    456;`);
  // Lone //
  test(`
    k: l: {
      123;}`);
  // If //
  test(`
    k: l: if (
      123)
    /* then */ {
      456;}
    else {
      789;}`);
  // While //
  test(`
    k: l: while (
      123)
    /* do */ {
      456;}`);
  // Try //
  test(`
    k: l: try {
      123;}
    catch {
      456;}
    finally {
      789;}`);}

// Expression //
{
  const test = (code) => Assert.deepEqual(
    Generate._indented_expression(
      "  ",
      Parse.expression(code)),
    code);
  // is_simple_expression (export) //
  test(`(123, export x = 456)`);
  test(`(
    123,
    export x = (456 + 789))`);
  // is_simple_expression (write) //
  test(`(123, x = 456)`);
  test(`(
    123,
    x = (456 + 789))`);
  // is_simple_expression (throw) //
  test(`(123, throw 456)`);
  test(`(
    123,
    throw (456 + 789))`);
  // is_simple_expression (eval) //
  test(`(123, eval 456)`);
  test(`(
    123,
    eval (456 + 789))`);
  // is_simple_expression (require) //
  test(`(123, require 456)`);
  test(`(
    123,
    eval (456 + 789))`);
  // is_simple_expression (apply) //
  test(`(123, 456())`);
  test(`(
    123,
    (
      (456 + 789)
      ()))`);
  test(`(
    123,
    456(@789))`);
  test(`(
    123,
    456(789))`);
  // is_simple_expression (construct) //
  test(`(123, new 456())`);
  test(`(
    123,
    (
      new (456 + 789)
      ()))`);
  test(`(
    123,
    new 456(789))`);
  // is_simple_expression(unary) //
  test(`(123, ! 456)`);
  test(`(
    123,
    ! (456 + 789))`);
  // is_simple_expression(object) //
  test(`(123, {__proto__:456})`);
  test(`(
    123,
    {
      __proto__: (456 + 789)})`);
  test(`(
    123,
    {
      __proto__: 456,
      ["foo"]: 789})`);
  // primitive //
  test(`123`);
  test(`"foo"`);
  test(`void 0`);
  // builtin //
  test(`#global`);
  test(`#"%foo%"`);
  // arrow //
  test(`() => {
    123;}`);
  // function //
  test(`function () {
    123;}`);
  // method //
  test(`method () {
    123;}`);
  // constructor //
  test(`constructor () {
    123;}`);
  // read //
  test(`foo`);
  // export //
  test(`export foo = 123`);
  // write //
  test(`foo = 123`);
  // sequence //
  test(`(123, 456)`);
  test(`(
    (123 + 456),
    789)`);
  test(`(
    123,
    (456 + 789))`);
  // conditional //
  test(`(123 ? 456 : 789)`);
  test(`(
    (123 + 0) ?
    456 :
    789)`);
  test(`(
    123 ?
    (456 + 0) :
    789)`);
  test(`(
    123 ?
    456 :
    (789 + 0))`);
  // throw //
  test(`throw 123`);
  // eval //
  test(`eval 123`);
  // apply //
  test(`123(@456, 789)`);
  test(`123(456)`);
  test(`123(
    (456 + 0))`);
  test(`(
    (123 + 0)
    (@456, 789))`);
  test(`123(
    @(456 + 0),
    789)`);
  test(`123(
    @456,
    (789 + 0))`);
  test(`(
    (123 + 0)
    (
      @(456 + 0),
      (798 + 0)))`);
  // construct //
  test(`new 123(456, 789)`);
  test(`(
    new (123 + 0)
    (456, 789))`);
  test(`new 123(
    (456 + 0),
    789)`);
  test(`new 123(
    456,
    (789 + 0))`);
  test(`(
    new (123 + 0)
    (
      (456 + 0),
      (798 + 0)))`);
  // Import //
  test(`import var from "yo"`);
  test(`import * from "yo"`);
  // require //
  test(`require 123`);
  // unary //
  test(`! 123`);
  // binary //
  test(`(123 + 456)`);
  test(`(
    (123 + 0),
    456)`);
  test(`(
    123 +
    (456 + 0))`);
  // object //
  test(`{__proto__:123}`);
  test(`{
    __proto__: 12,
    ["foo"]: 34,
    [("foo" + "bar")]:
    (56 + 78)}`);}

// Zero-Indended //
Assert.deepEqual(Generate._program(Parse._program(`export var; {123;}`)), `export var;
{
  123;}`);
Assert.deepEqual(Generate._prelude(Parse._prelude(`export var;`)), `export var;
`);
Assert.deepEqual(Generate._block(Parse.BLOCK(`{123;}`)), `{
  123;}`);
Assert.deepEqual(Generate._statement(Parse.Statement(`123;`)), `
123;`);
Assert.deepEqual(Generate._expression(Parse.expression(`(123 + (456 + 789))`)), `(
  123 +
  (456 + 789))`);

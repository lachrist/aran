"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Generate = require("./generate.js");
const Parse = require("./parse/index.js");

{
  const test = (code) => Assert.deepEqual(
    Generate._indented_expression(
      "    ",
      Parse.expression(code)),
    code);
  // primitive //
  test(`123`);
  test(`"foo"`);
  test(`void 0`);
  // builtin //
  test(`#global`);
  // arrow //
  test(`() => {
    123;}`);
  // function //
  test(`function () {
    123;}`);
  // read //
  test(`foo`);
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
  test(`eval(§foo, §bar, 123)`);
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
  // unary //
  test(`!123`);
  test(`typeof 123`);
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
    __proto__: 123,
    foo: 456}`);
  
}

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Parse = require("./parse/index.js");
const Generate = require("./generate.js");

// Program //
{
  const test = (code) => Assert.deepEqual(
    Generate._generate_indented(
      Parse._parse_program(code),
      "    "),
    code);
  test(`
    import * from "source1";
    import function from "source2";
    export var;
    aggregate * from "source3";
    aggregate if from "source5" as while;
    {
      123; }`);
}

// Block //
{
  const test = (code) => Assert.deepEqual(
    Generate._generate_indented(
      Parse.PARSE_BLOCK(code),
      "    "),
    code);
  test(`
    {
      123;
      456; }`);
  test(`
    { let x, y;
      123;
      456; }`);
}

// Statement //
{
  const test = (code) => Assert.deepEqual(
    Generate._generate_indented(
      Parse.ParseStatement(code),
      "    "),
    code);
  // Lift //
  test(`
    123;`);
  // Return //
  test(`
    return
      123;`);
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
    /* bundle */
      123;
      456;`);
  // Lone //
  test(`
    k: l: /* lone */
      {
        123; }`);
  // If //
  test(`
    k: l: if (
      123)
      {
        456; } else
      {
        789; }`);
  // While //
  test(`
    k: l: while (
      123)
      {
        456; }`);
  // Try //
  test(`
    k: l: try
      {
        123; } catch
      {
        456; } finally
      {
        789; }`);}

// Expression //
{
  const test = (code) => Assert.deepEqual(
    Generate._generate_indented(
      Parse.parse_expression(code),
      "    "),
    code);
  // primitive //
  test(`
    123`);
  test(`
    "foo"`);
  test(`
    void 0`);
  // intrinsic //
  test(`
    #global`);
  test(`
    #"%foo%"`);
  // arrow //
  test(`
    arrow ()
      {
        123; }`);
  // function //
  test(`
    function ()
      {
        123; }`);
  // method //
  test(`
    method ()
      {
        123; }`);
  // constructor //
  test(`
    constructor ()
      {
        123; }`);
  // read //
  test(`
    foo`);
  // export //
  test(`
    export foo
      123`);
  // write //
  test(`
    foo =
      123`);
  // enclave-read //
  test(`
    enclave foo`);
  // enclave-typeof //
  test(`
    enclave typeof foo`);
  // enclave-write //
  test(`
    enclave foo !=
      123`);
  test(`
    enclave foo ?=
      123`);
  // enclave-super-call //
  test(`
    enclave super(...
      123)`);
  // enclave-super-member //
  test(`
    enclave super[
      123]`);
  // enclave-super-invoke //
  test(`
    enclave super[
      123](...
      456)`);
  // sequence //
  test(`
    (
      123,
      456)`);
  // conditional //
  test(`
    (
      123 ?
      456 :
      789)`);
  // throw //
  test(`
    throw
      123`);
  // eval //
  test(`
    eval
      123`);
  // apply //
  test(`
    (
      123(@
      456,
      789))`);
  test(`
    (
      123(@
      456))`);
  test(`
    (
      123(
      456))`);
  test(`
    (
      123())`);
  // construct //
  test(`
    new
      123(
      456,
      789)`);
  // Import //
  test(`
    import var from "yo"`);
  test(`
    import * from "yo"`);
  // require //
  test(`
    require
      123`);
  // unary //
  test(`
    !
      123`);
  // binary //
  test(`
    (
      123 +
      456)`);
  // object //
  test(`
    {__proto__:
      123}`);
  test(`
    {__proto__:
      12,[
      "foo"]:
      34,[
      (
        "foo" +
        "bar")]:
      (
        56 +
        78)}`);}

// Zero-Indended //
Assert.deepEqual(Generate._generate(Parse.ParseStatement(`123;`)), `
123;`);

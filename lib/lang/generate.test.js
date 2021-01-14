"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js").toggleDebugMode();

const Parse = require("./parse/index.js");
const Generate = require("./generate.js");

const test = (type, code) => Assert.deepEqual(
  Generate.generate(
    Parse[`parse${type}`](code),
    {depth:1}),
  code);

////////////////////
// Program & Link //
////////////////////
test("Program", `
  import * from "source1";
  import function from "source2";
  export var;
  aggregate * from "source3";
  aggregate if from "source5" as while;
  { let x;
    456;
    completion
      123; }`);

///////////
// Block //
///////////
test("Block", `
  {
    123;
    456;
    completion
      789; }`);
test("Block", `
  { let x, y;
    123;
    456;
    completion
      789; }`);

////////////
// Branch //
////////////

test("Branch", `
  k: l:
    {
      completion
        123; }`);

test("Branch", `
  {
    completion
      123; }`);

///////////////
// Statement //
///////////////

// Expression //
test("SingleStatement", `
  123;`);
// Return //
test("SingleStatement", `
  return
    123;`);
// Break //
test("SingleStatement", `
  break l;`);
// EnclaveDeclare //
test("SingleStatement", `
  enclave var x =
    123;`);
// Debugger //
test("SingleStatement", `
  debugger;`);
// List //
test("SingleStatement", `
  123;`);
// Lone //
test("SingleStatement", `
  k: l:
    {
      completion
        123; }`);
// If //
test("SingleStatement", `
  if (
    123)
    l:
      {
        completion
          456; } else
    m:
      {
        completion
          789; }`);
// While //
test("SingleStatement", `
  while (
    123)
    l:
      {
        completion
          456; }`);
// Try //
test("SingleStatement", `
  try
    l:
      {
        completion
          123; } catch
    m:
      {
        completion
          456; } finally
    n:
      {
        completion
          789; }`);

////////////////
// Expression //
////////////////

// primitive //
test("Expression", `
  123`);
test("Expression", `
  "foo"`);
test("Expression", `
  void 0`);
// intrinsic //
test("Expression", `
  #global`);
test("Expression", `
  #"%foo%"`);
["arrow", "function", "constructor", "method"].forEach((sort) => {
test("Expression", `
  ${sort} ()
    {
      completion
        123; }`);
test("Expression", `
  async ${sort} ()
    {
      completion
        123; }`);
test("Expression", `
  async ${sort} ()
    {
      completion
        123; }`);
test("Expression", `
  async ${sort} * ()
    {
      completion
        123; }`); });
// read //
test("Expression", `
  foo`);
// export //
test("Expression", `
  export foo
    123`);
// write //
test("Expression", `
  foo =
    123`);
// enclave-read //
test("Expression", `
  enclave foo`);
// enclave-typeof //
test("Expression", `
  enclave typeof foo`);
// enclave-write //
test("Expression", `
  enclave foo !=
    123`);
test("Expression", `
  enclave foo ?=
    123`);
// enclave-super-call //
test("Expression", `
  enclave super(...
    123)`);
// enclave-super-member //
test("Expression", `
  enclave super[
    123]`);
// sequence //
test("Expression", `
  (
    123,
    456)`);
// conditional //
test("Expression", `
  (
    123 ?
    456 :
    789)`);
// throw //
test("Expression", `
  throw
    123`);
// eval //
test("Expression", `
  eval
    123`);
// apply //
test("Expression", `
  (
    123(@
    456,
    789))`);
test("Expression", `
  (
    123(@
    456))`);
test("Expression", `
  (
    123(
    456))`);
test("Expression", `
  (
    123())`);
// construct //
test("Expression", `
  new
    123(
    456,
    789)`);
// Import //
test("Expression", `
  import var from "yo"`);
test("Expression", `
  import * from "yo"`);
// await //
test("Expression", `
  await
    123`);
// yield //
test("Expression", `
  yield
    123`);
test("Expression", `
  yield *
    123`);
// require //
test("Expression", `
  require
    123`);
// unary //
test("Expression", `
  !
    123`);
// binary //
test("Expression", `
  (
    123 +
    456)`);
// object //
test("Expression", `
  {__proto__:
    123}`);
test("Expression", `
  {__proto__:
    12,[
    "foo"]:
    34,[
    (
      "foo" +
      "bar")]:
    (
      56 +
      78)}`);

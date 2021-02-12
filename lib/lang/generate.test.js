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

/////////////
// Program //
/////////////

test("Program", `module;
  export foo;
  export bar;
  { let qux;
    completion
      123; }`);
test("Program", `enclave module;
  export foo;
  export bar;
  { let qux;
    completion
      123; }`);

test("Program", `script;
  completion
    123;`);
test("Program", `enclave script;
  completion
    123;`);

test("Program", `eval;
  { let qux;
    completion
      123; }`);
test("Program", `eval; let foo, bar;
  { let qux;
    completion
      123; }`);
test("Program", `enclave eval confined; let foo, bar;
  { let qux;
    completion
      123; }`);

//////////
// Link //
//////////
test("Link", `
  import * from "source1";`);
test("Link", `
  import function from "source2";`);
test("Link", `
  export var;`);
test("Link", `
  aggregate * from "source3";`);
test("Link", `
  aggregate if from "source5" as while;`);

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
  #Function.prototype.arguments@get`);
// closure //
test("Expression", `
  function ()
    {
      completion
        123; }`);
test("Expression", `
  async function ()
    {
      completion
        123; }`);
test("Expression", `
  async function ()
    {
      completion
        123; }`);
test("Expression", `
  async function * ()
    {
      completion
        123; }`);
// read //
test("Expression", `
  foo`);
// export //
test("Expression", `
  (
    export foo
      123,
    456)`);
// write //
test("Expression", `
  (
    foo =
      123,
    456)`);
// enclave-read //
test("Expression", `
  enclave foo`);
// enclave-typeof //
test("Expression", `
  enclave typeof foo`);
// enclave-write //
test("Expression", `
  (
    enclave foo !=
      123,
    456)`);
test("Expression", `
  (
    enclave foo ?=
      123,
    456)`);
// enclave-super-call //
test("Expression", `
  enclave super(...
    123)`);
// enclave-super-get //
test("Expression", `
  enclave super[
    123]`);
// enclave-super-set //
test("Expression", `
  enclave super[
    123] = 
    456`);
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
  eval (foo, bar,
    123)`);
test("Expression", `
  enclave eval confined (foo, bar,
    123)`);
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

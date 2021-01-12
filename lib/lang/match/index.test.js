"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Tree = require("../../tree.js");
const Parse = require("../parse/index.js");
const Mapping = require("./mapping.js");
const Match = require("./index.js");

// Assert.deepEqual(
//   Match._match(
//     Tree.PrimitiveExpression(123),
//     Tree.PrimitiveExpression(123),
//     (success, message) => (
//       Assert.deepEqual(success, true),
//       Assert.deepEqual(message, null),
//       "foobar")),
//   "foobar");
// 
// Assert.deepEqual(
//   Match._match(
//     Tree.PrimitiveExpression(123),
//     Tree.PrimitiveExpression(456),
//     (success, message) => (
//       Assert.deepEqual(success, false),
//       Assert.match(message, /^Structural mismatch at .* between 123 and 456\n/),
//       "foobar")),
//   "foobar");

const success = (type, code1, code2, mapping1, mapping2) => Assert.deepEqual(
  Match.match(
    Parse[`parse${type}`](code1),
    Parse[`parse${type}`](code2),
    (success, result) => (
      Assert.deepEqual(success, true),
      Assert.deepEqual(
        result,
        {
          identifier: mapping1,
          label: mapping2}),
      "success")),
  "success");

const failure = (type, code1, code2, regexp) => Assert.deepEqual(
  Match.match(
    Parse[`parse${type}`](code1),
    Parse[`parse${type}`](code2),
    (success, result) => (
      Assert.deepEqual(success, false),
      Assert.match(result, regexp),
      "failure")),
  "failure");

/////////////
// Program //
/////////////
failure(
  "Program",
  `export foo; { completion 123; }`,
  `{ completion 123; }`,
  /^Structural mismatch .* 1 and 0\n/);
failure(
  "Program",
  `export foo; { completion 123; }`,
  `export bar; { completion 123; }`,
  /^Structural mismatch .* "foo" and "bar"\n/);
failure(
  "Program",
  `export foo; { completion 123; }`,
  `export foo; { completion 456; }`,
  /^Structural mismatch .* 123 and 456\n/);
success(
  "Program",
  `export foo; { completion 123; }`,
  `export foo; { completion 123; }`,
  Mapping.Empty(),
  Mapping.Empty());

/////////////
// Link //
/////////////

// Import //
success(
  "Link",
  `import foo from "bar";`,
  `import foo from "bar";`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Link",
  `import foo from "bar";`,
  `import qux from "bar";`,
  /^Structural mismatch .* "foo" and "qux"\n/);
failure(
  "Link",
  `import foo from "bar";`,
  `import foo from "qux";`,
  /^Structural mismatch .* "bar" and "qux"\n/);
// Export //
success(
  "Link",
  `export foo;`,
  `export foo;`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Link",
  `export foo;`,
  `export bar;`,
  /^Structural mismatch .* "foo" and "bar"\n/);
// Aggregate //
success(
  "Link",
  `aggregate foo from "bar" as qux;`,
  `aggregate foo from "bar" as qux;`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Link",
  `aggregate foo from "bar" as qux;`,
  `aggregate taz from "bar" as qux;`,
  /^Structural mismatch .* "foo" and "taz"\n/);
failure(
  "Link",
  `aggregate foo from "bar" as qux;`,
  `aggregate foo from "taz" as qux;`,
  /^Structural mismatch .* "bar" and "taz"\n/);
failure(
  "Link",
  `aggregate foo from "bar" as qux;`,
  `aggregate foo from "bar" as taz;`,
  /^Structural mismatch .* "qux" and "taz"\n/);

///////////
// Block //
///////////
success(
  "Block",
  `{ let x1, y1; x1; z1; completion t1; }`,
  `{ let x2, y2; x2; z2; completion t2; }`,
  Mapping.combine(
    "path",
    Mapping.Single("z1", "z2"),
    Mapping.Single("t1", "t2")),
  Mapping.Empty());
failure(
  "Block",
  `{ let x1, y1; x1; z1; completion 123; }`,
  `{ let x2, z2; x2; z2; completion 123; }`,
  /^Binding mismatch at .* between z1 and z2\n/);

///////////////
// Statement //
///////////////
failure(
  "Statement",
  `break l;`,
  `return x;`,
  /^Structural mismatch at .* "BreakStatement" and "ReturnStatement"\n/);
// BlockLess //
// EnclaveDeclare //
success(
  "Statement",
  `enclave var foo = x1;`,
  `enclave var foo = x2;`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
failure(
  "Statement",
  `enclave var foo = 123;`,
  `enclave let foo = 123;`,
  /^Structural mismatch .* between "var" and "let"\n/);
failure(
  "Statement",
  `enclave var foo = 123;`,
  `enclave var bar = 123;`,
  /^Structural mismatch .* between "foo" and "bar"\n/);
// ExpressionStatement //
success(
  "Statement",
  `x1;`, `x2;`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
// Return //
success(
  "Statement",
  `return x1;`,
  `return x2;`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
// Break //
success(
  "Statement",
  `break k;`,
  `break l;`,
  Mapping.Empty(),
  Mapping.Single("k", "l"));
// Debugger //
success(
  "Statement",
  `debugger;`,
  `debugger;`,
  Mapping.Empty(),
  Mapping.Empty());
// BlockFull //
// Lone //
success(
  "Statement",
  `k1: { x1; break k1; break l1; completion 123; }`,
  `k2: { x2; break k2; break l2; completion 123; }`,
  Mapping.Single("x1", "x2"),
  Mapping.Single("l1", "l2"));
// If //
success(
  "Statement",
  `if (x1) k1: {y1; break k1; break l1; completion 123;} else k1: {z1; break k1; break l1; completion 456;}`,
  `if (x2) k2: {y2; break k2; break l2; completion 123;} else k2: {z2; break k2; break l2; completion 456;}`,
  {
    __proto__: null,
    x1: "x2",
    y1: "y2",
    z1: "z2"},
  Mapping.Single("l1", "l2"));
// While //
success(
  "Statement",
  `while (x1) k1: {y1; break k1; break l1; completion 123;}`,
  `while (x2) k2: {y2; break k2; break l2; completion 123;}`,
  {
    __proto__: null,
    x1: "x2",
    y1: "y2"},
  Mapping.Single("l1", "l2"));
// Try //
success(
  "Statement",
  `try k1: {x1; break k1; break l1; completion 123;} catch k1: {y1; break k1; break l1; completion 456;} finally k1: {z1; break k1; break l1; completion 789;}`,
  `try k2: {x2; break k2; break l2; completion 123;} catch k2: {y2; break k2; break l2; completion 456;} finally k2: {z2; break k2; break l2; completion 789;}`,
  {
    __proto__: null,
    x1: "x2",
    y1: "y2",
    z1: "z2"},
  Mapping.Single("l1", "l2"));

////////////////
// Expression //
////////////////
failure(
  "Expression",
  `123`,
  `#global`,
  /^Structural mismatch at root.type between "PrimitiveExpression" and "IntrinsicExpression"\n/);
failure(
  "Expression",
  `(123, (x1, x1))`,
  `(123, (x2, y2))`,
  /^Combination mismatch .* x2 and y2 for x1\n/);
// Producers //
// import //
success(
  "Expression",
  `import x from "source"`,
  `import x from "source"`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Expression",
  `import * from "foo"`,
  `import * from "bar"`,
  /^Structural mismatch .* "foo" and "bar"\n/);
failure(
  "Expression",
  `import x from "source"`,
  `import y from "source"`,
  /^Structural mismatch .* "x" and "y"\n/);
// primitive //
success(
  "Expression",
  `123`,
  `123`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Expression",
  `123`,
  `456`,
  /^Structural mismatch .* 123 and 456\n/);
// intrinsic //
success(
  "Expression",
  `#global`,
  `#global`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Expression",
  `#Reflect.get`,
  `#Reflect.set`,
  /^Structural mismatch .* "Reflect.get" and "Reflect.set"\n/);
// closure //
success(
  "Expression",
  `arrow () { x1; completion 123; }`,
  `arrow () { x2; completion 123; }`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
failure(
  "Expression",
  `arrow () { x1; completion 123; }`,
  `function () { x2; completion 123; }`,
  /^Structural mismatch .* "arrow" and "function"\n/);
failure(
  "Expression",
  `arrow () { x1; completion 123; }`,
  `async arrow () { x2; completion 123; }`,
  /^Structural mismatch .* false and true\n/);
failure(
  "Expression",
  `arrow () { x1; completion 123; }`,
  `arrow * () { x2; completion 123; }`,
  /^Structural mismatch .* false and true\n/);
// function //
success(
  "Expression",
  `function () { x1; completion 123; }`,
  `function () { x2; completion 123; }`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
// method //
success(
  "Expression",
  `method () { x1; completion 123; }`,
  `method () { x2; completion 123; }`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
// constructor //
success(
  "Expression",
  `constructor () { x1; completion 123; }`,
  `constructor () { x2; completion 123; }`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
// read //
success(
  "Expression",
  `x1`, `x2`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
success(
  "Expression",
  `input`,
  `input`,
  Mapping.Empty(),
  Mapping.Empty());
// Consumers //
// export //
success(
  "Expression",
  `export x 123`,
  `export x 123`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Expression",
  `export x 123`,
  `export y 123`,
  /^Structural mismatch .* "x" and "y"\n/);
// write //
success(
  "Expression",
  `x1 = y1`,
  `x2 = y2`,
  Mapping.combine(
    null,
    Mapping.Single("x1", "x2"),
    Mapping.Single("y1", "y2")),
  Mapping.Empty());
success(
  "Expression",
  `input = 123`,
  `input = 123`,
  Mapping.Empty(),
  Mapping.Empty());
// enclave-read //
success(
  "Expression",
  `enclave x`,
  `enclave x`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Expression",
  `enclave x`,
  `enclave y`,
  /^Structural mismatch .* "x" and "y"\n/);
// enclave-typeof //
success(
  "Expression",
  `enclave typeof x`,
  `enclave typeof x`,
  Mapping.Empty(),
  Mapping.Empty());
failure(
  "Expression",
  `enclave typeof x`,
  `enclave typeof y`,
  /^Structural mismatch .* "x" and "y"\n/);
// enclave-write //
success(
  "Expression",
  `enclave x ?= y`,
  `enclave x ?= z`,
  Mapping.Single("y", "z"),
  Mapping.Empty());
failure(
  "Expression",
  `enclave x ?= 123`,
  `enclave y ?= 123`,
  /^Structural mismatch .* "x" and "y"\n/);
failure(
  "Expression",
  `enclave x ?= 123`,
  `enclave x != 123`,
  /^Structural mismatch .* false and true\n/);
// enclave-super-call //
success(
  "Expression",
  `enclave super(...x)`,
  `enclave super(...y)`,
  Mapping.Single("x", "y"),
  Mapping.Empty());
// enclave-super-member //
success(
  "Expression",
  `enclave super[x]`,
  `enclave super[y]`,
  Mapping.Single("x", "y"),
  Mapping.Empty());
// sequence //
success(
  "Expression",
  `(x1, y1)`,
  `(x2, y2)`,
  Mapping.combine(
    null,
    Mapping.Single("x1", "x2"),
    Mapping.Single("y1", "y2")),
  Mapping.Empty());
// conditional //
success(
  "Expression",
  `(x1 ? y1 : z1)`,
  `(x2 ? y2 : z2)`,
  Mapping.combine(
    null,
    Mapping.Single("x1", "x2"),
    Mapping.combine(
      null,
      Mapping.Single("y1", "y2"),
      Mapping.Single("z1", "z2"))),
  Mapping.Empty());
// throw //
success(
  "Expression",
  `throw x1`,
  `throw x2`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
// yield //
success(
  "Expression",
  `yield x1`,
  `yield x2`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
success(
  "Expression",
  `yield * x1`,
  `yield * x2`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
failure(
  "Expression",
  `yield x1`,
  `yield * x2`,
  /^Structural mismatch .* false and true\n/);
// await //
success(
  "Expression",
  `await x1`,
  `await x2`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
// eval //
success(
  "Expression",
  `eval x1`,
  `eval x2`,
  Mapping.Single("x1", "x2"),
  Mapping.Empty());
// Combiners //
// apply //
success(
  "Expression",
  `f1(@t1, x1, y1)`,
  `f2(@t2, x2, y2)`,
  {__proto__:null, f1:"f2", t1:"t2", x1:"x2", y1:"y2"},
  {__proto__:null});
// construct //
success(
  "Expression",
  `new f1(x1, y1)`,
  `new f2(x2, y2)`,
  {__proto__:null, f1:"f2", x1:"x2", y1:"y2"},
  {__proto__:null});
// require //
success(
  "Expression",
  `require x1`,
  `require x2`,
  {__proto__:null, x1:"x2"},
  {__proto__:null});
// unary //
failure(
  "Expression",
  `!x1`,
  `~x2`,
  /^Structural mismatch at .* between "!" and "~"\n/);
success(
  "Expression",
  `!x1`,
  `!x2`,
  {__proto__:null, x1:"x2"},
  {__proto__:null});
// binary //
failure(
  "Expression",
  `(x1 + y1)`,
  `(x2 - y2)`,
  /^Structural mismatch at .* between "\+" and "-"\n/);
success(
  "Expression",
  `(x1 + y1)`,
  `(x2 + y2)`,
  {__proto__:null, x1:"x2", y1:"y2"},
  {__proto__:null});
// object //
failure(
  "Expression",
  `{__proto__:x1, foo:y1, bar:z1}`,
  `{__proto__:x2, foo:y2}`,
  /^Structural mismatch at .* between 2 and 1\n/);
success(
  "Expression",
  `{__proto__:x1, foo:y1, bar:z1}`,
  `{__proto__:x2, foo:y2, bar:z2}`,
  {__proto__:null, x1:"x2", y1:"y2", z1:"z2"},
  {__proto__:null});

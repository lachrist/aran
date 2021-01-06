"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Parse = require("../parse/index.js");
const Mapping = require("./mapping.js");
const Match = require("./index.js");

Assert.deepEqual(
  Match._match(
    Tree.primitive(123),
    Tree.primitive(123),
    (success, message) => (
      Assert.deepEqual(success, true),
      Assert.deepEqual(message, null),
      "foobar")),
  "foobar");

Assert.deepEqual(
  Match._match(
    Tree.primitive(123),
    Tree.primitive(456),
    (success, message) => (
      Assert.deepEqual(success, false),
      Assert.match(message, /^Structural mismatch at .* between 123 and 456\n/),
      "foobar")),
  "foobar");

const make_success = (parse) => (code1, code2, mapping1, mapping2) => Assert.deepEqual(
  Match._match_test(
    parse(code1),
    parse(code2),
    (mapping3, mapping4) => (
       Assert.deepEqual(mapping3, mapping1),
       Assert.deepEqual(mapping4, mapping2),
       "success"),
    (message) => Assert.fail()),
  "success");

const make_failure = (parse) => (code1, code2, regexp) => Assert.deepEqual(
  Match._match_test(
    parse(code1),
    parse(code2),
    (mapping1, mapping2) => Assert.fail(),
    (message) => (
      Assert.match(message, regexp),
      "failure")),
  "failure");

/////////////
// Program //
/////////////
{
  const success = make_success(Parse._parse_program);
  const failure = make_failure(Parse._parse_program);
  failure(`export foo; { 123; }`, `{ 123; }`, /^Structural mismatch .* 1 and 0$/);
  failure(`export foo; { 123; }`, `export bar; { 123; }`, /^Structural mismatch .* "foo" and "bar"$/);
  failure(`export foo; { 123; }`, `export foo; { 456; }`, /^Structural mismatch .* 123 and 456$/);
  success(`export foo; { 123; }`, `export foo; { 123; }`, Mapping._empty(), Mapping._empty()); }

/////////////
// Prelude //
/////////////
{
  const success = make_success(Parse._parse_prelude);
  const failure = make_failure(Parse._parse_prelude);
  // Import //
  success(`import foo from "bar";`, `import foo from "bar";`, Mapping._empty(), Mapping._empty());
  failure(`import foo from "bar";`, `import qux from "bar";`, /^Structural mismatch .* "foo" and "qux"$/);
  failure(`import foo from "bar";`, `import foo from "qux";`, /^Structural mismatch .* "bar" and "qux"$/);
  // Export //
  success(`export foo;`, `export foo;`, Mapping._empty(), Mapping._empty());
  failure(`export foo;`, `export bar;`, /^Structural mismatch .* "foo" and "bar"$/);
  // Aggregate //
  success(`aggregate foo from "bar" as qux;`, `aggregate foo from "bar" as qux;`, Mapping._empty(), Mapping._empty());
  failure(`aggregate foo from "bar" as qux;`, `aggregate taz from "bar" as qux;`, /^Structural mismatch .* "foo" and "taz"$/);
  failure(`aggregate foo from "bar" as qux;`, `aggregate foo from "taz" as qux;`, /^Structural mismatch .* "bar" and "taz"$/);
  failure(`aggregate foo from "bar" as qux;`, `aggregate foo from "bar" as taz;`, /^Structural mismatch .* "qux" and "taz"$/); }

///////////
// Block //
///////////
{
  const success = make_success(Parse.PARSE_BLOCK);
  const failure = make_failure(Parse.PARSE_BLOCK);
  // failure(`{let x1, y1;}`, `{let x2;}`, /^Binding length mismatch at .*$/);
  success(`{let x1, y1; x1; z1;}`, `{let x2, y2; x2; z2;}`, Mapping._single("z1", "z2"), Mapping._empty());
  failure(`{let x1, y1; x1; z1;}`, `{let x2, z2; x2; z2;}`, /^Binding mismatch at .* between z1 and z2$/);
  failure(`{123;}`, `{456;}`, /^Structural mismatch at .* between 123 and 456$/); }

///////////////
// Statement //
///////////////
{
  const success = make_success(Parse.ParseStatement);
  const failure = make_failure(Parse.ParseStatement);
  failure(`break l;`, `return x;`, /^Structural mismatch at .* "Break" and "Return"$/);
  // BlockLess //
  // Lift //
  success(`x1;`, `x2;`, Mapping._single("x1", "x2"), Mapping._empty());
  // Return //
  success(`return x1;`, `return x2;`, Mapping._single("x1", "x2"), Mapping._empty());
  // Break //
  success(`break k;`, `break l;`, Mapping._empty(), Mapping._single("k", "l"));
  // Debugger //
  success(`debugger;`, `debugger;`, Mapping._empty(), Mapping._empty());
  // BlockFull //
  // Lone //
  success(
    `k1: {x1; break k1; break l1;}`,
    `k2: {x2; break k2; break l2;}`,
    Mapping._single("x1", "x2"),
    Mapping._single("l1", "l2"));
  // If //
  success(
    `if (x1) k1: {y1; break k1; break l1;} else k1: {z1; break k1; break l1;}`,
    `if (x2) k2: {y2; break k2; break l2;} else k2: {z2; break k2; break l2;}`,
    {
      __proto__: null,
      x1: "x2",
      y1: "y2",
      z1: "z2"},
    Mapping._single("l1", "l2"));
  // While //
  success(
    `while (x1) k1: {y1; break k1; break l1;}`,
    `while (x2) k2: {y2; break k2; break l2;}`,
    {
      __proto__: null,
      x1: "x2",
      y1: "y2"},
    Mapping._single("l1", "l2"));
  // Try //
  success(
    `try k1: {x1; break k1; break l1;} catch k1: {y1; break k1; break l1;} finally k1: {z1; break k1; break l1;}`,
    `try k2: {x2; break k2; break l2;} catch k2: {y2; break k2; break l2;} finally k2: {z2; break k2; break l2;}`,
    {
      __proto__: null,
      x1: "x2",
      y1: "y2",
      z1: "z2"},
    Mapping._single("l1", "l2")); }

////////////////
// Expression //
////////////////
{
  const success = make_success(Parse.parse_expression);
  const failure = make_failure(Parse.parse_expression);
  failure(`123`, `#global`, /^Structural mismatch at root.type between "primitive" and "intrinsic"$/);
  failure(`(123, (x1, x1))`, `(123, (x2, y2))`, /^Combination mismatch .* x2 and y2 for x1$/);
  // Producers //
  // import //
  success(
    `import x from "source"`,
    `import x from "source"`,
    Mapping._empty(),
    Mapping._empty());
  failure(
    `import * from "foo"`,
    `import * from "bar"`,
    /^Structural mismatch .* "foo" and "bar"$/);
  failure(
    `import x from "source"`,
    `import y from "source"`,
    /^Structural mismatch .* "x" and "y"$/);
  // primitive //
  success(
    `123`,
    `123`,
    Mapping._empty(),
    Mapping._empty());
  failure(
    `123`,
    `456`,
    /^Structural mismatch .* 123 and 456$/);
  // intrinsic //
  success(
    `#global`,
    `#global`,
    Mapping._empty(),
    Mapping._empty());
  failure(
    `#Reflect.get`,
    `#Reflect.set`,
    /^Structural mismatch .* "Reflect.get" and "Reflect.set"$/);
  // arrow //
  success(
    `arrow () {x1;}`,
    `arrow () {x2;}`,
    Mapping._single("x1", "x2"),
    Mapping._empty());
  // function //
  success(
    `function () {x1;}`,
    `function () {x2;}`,
    Mapping._single("x1", "x2"),
    Mapping._empty());
  // method //
  success(
    `method () {x1;}`,
    `method () {x2;}`,
    Mapping._single("x1", "x2"),
    Mapping._empty());
  // constructor //
  success(
    `constructor () {x1;}`,
    `constructor () {x2;}`,
    Mapping._single("x1", "x2"),
    Mapping._empty());
  // read //
  success(
    `x1`, `x2`,
    Mapping._single("x1", "x2"),
    Mapping._empty());
  success(
    `input`,
    `input`,
    Mapping._empty(),
    Mapping._empty());
  // Consumers //
  // export //
  success(
    `export x 123`,
    `export x 123`,
    Mapping._empty(),
    Mapping._empty());
  failure(
    `export x 123`,
    `export y 123`,
    /^Structural mismatch .* "x" and "y"$/);
  // write //
  success(
    `x1 = y1`,
    `x2 = y2`,
    Mapping._combine(
      null,
      Mapping._single("x1", "x2"),
      Mapping._single("y1", "y2")),
    Mapping._empty());
  success(
    `input = 123`,
    `input = 123`,
    Mapping._empty(),
    Mapping._empty());
  // enclave-read //
  success(
    `enclave x`,
    `enclave x`,
    Mapping._empty(),
    Mapping._empty());
  failure(
    `enclave x`,
    `enclave y`,
    /^Structural mismatch .* "x" and "y"$/);
  // enclave-typeof //
  success(
    `enclave typeof x`,
    `enclave typeof x`,
    Mapping._empty(),
    Mapping._empty());
  failure(
    `enclave typeof x`,
    `enclave typeof y`,
    /^Structural mismatch .* "x" and "y"$/);
  // enclave-write //
  success(
    `enclave x ?= y`,
    `enclave x ?= z`,
    Mapping._single("y", "z"),
    Mapping._empty());
  failure(
    `enclave x ?= 123`,
    `enclave y ?= 123`,
    /^Structural mismatch .* "x" and "y"$/);
  failure(
    `enclave x ?= 123`,
    `enclave x != 123`,
    /^Structural mismatch .* false and true$/);
  // enclave-super-call //
  success(
    `enclave super(...x)`,
    `enclave super(...y)`,
    Mapping._single("x", "y"),
    Mapping._empty());
  // enclave-super-member //
  success(
    `enclave super[x]`,
    `enclave super[y]`,
    Mapping._single("x", "y"),
    Mapping._empty());
  // sequence //
  success(
    `(x1, y1)`,
    `(x2, y2)`,
    Mapping._combine(
      null,
      Mapping._single("x1", "x2"),
      Mapping._single("y1", "y2")),
    Mapping._empty());
  // conditional //
  success(
    `(x1 ? y1 : z1)`,
    `(x2 ? y2 : z2)`,
    Mapping._combine(
      null,
      Mapping._single("x1", "x2"),
      Mapping._combine(
        null,
        Mapping._single("y1", "y2"),
        Mapping._single("z1", "z2"))),
    Mapping._empty());
  // throw //
  success(
    `throw x1`,
    `throw x2`,
    Mapping._single("x1", "x2"),
    Mapping._empty());
  // eval //
  success(
    `eval x1`,
    `eval x2`,
    Mapping._single("x1", "x2"),
    Mapping._empty());
  // Combiners //
  // apply //
  success(
    `f1(@t1, x1, y1)`,
    `f2(@t2, x2, y2)`,
    {__proto__:null, f1:"f2", t1:"t2", x1:"x2", y1:"y2"},
    {__proto__:null});
  // construct //
  success(
    `new f1(x1, y1)`,
    `new f2(x2, y2)`,
    {__proto__:null, f1:"f2", x1:"x2", y1:"y2"},
    {__proto__:null});
  // require //
  success(
    `require x1`,
    `require x2`,
    {__proto__:null, x1:"x2"},
    {__proto__:null});
  // unary //
  failure(
    `!x1`,
    `~x2`,
    /^Structural mismatch at .* between "!" and "~"$/);
  success(
    `!x1`,
    `!x2`,
    {__proto__:null, x1:"x2"},
    {__proto__:null});
  // binary //
  failure(
    `(x1 + y1)`,
    `(x2 - y2)`,
    /^Structural mismatch at .* between "\+" and "-"$/);
  success(
    `(x1 + y1)`,
    `(x2 + y2)`,
    {__proto__:null, x1:"x2", y1:"y2"},
    {__proto__:null});
  // object //
  failure(
    `{__proto__:x1, foo:y1, bar:z1}`,
    `{__proto__:x2, foo:y2}`,
    /^Structural mismatch at .* between 2 and 1$/);
  success(
    `{__proto__:x1, foo:y1, bar:z1}`,
    `{__proto__:x2, foo:y2, bar:z2}`,
    {__proto__:null, x1:"x2", y1:"y2", z1:"z2"},
    {__proto__:null});
}

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Parse = require("../parse/index.js");
const Mapping = require("./mapping.js");
const Match = require("./index.js");

const make_success = (parse) => (code1, code2, mapping1, mapping2) => Assert.deepEqual(
  Match._match(
    parse(code1),
    parse(code2),
    (success, result2) => (
      Assert.ok(success),
      Assert.deepEqual(result2, [mapping1, mapping2]),
      "success")),
  "success");

const make_failure = (parse) => (code1, code2, regexp) => Assert.deepEqual(
  Match._match(
    parse(code1),
    parse(code2),
    (success, message) => (
      Assert.ok(!success),
      Assert.match(message, regexp),
      "failure")),
  "failure");

/////////////
// Program //
/////////////
// {
//   const success = make_success(Parse._parse_program);
//   const failure = make_failure(Parse._parse_program);
//   failure(`export foo; { 123; }`, `{ 123; }`, /^Structural mismatch .* 1 and 0\n/);
//   failure(`export foo; { 123; }`, `export bar; { 123; }`, /^Structural mismatch .* "foo" and "bar"\n/);
//   failure(`export foo; { 123; }`, `export foo; { 456; }`, /^Structural mismatch .* 123 and 456\n/);
//   success(`export foo; { 123; }`, `export foo; { 123; }`, Mapping._empty(), Mapping._empty()); }

/////////////
// Prelude //
/////////////
// {
//   const success = make_success(Parse._parse_prelude);
//   const failure = make_failure(Parse._parse_prelude);
//   // Import //
//   success(`import foo from "bar";`, `import foo from "bar";`, Mapping._empty(), Mapping._empty());
//   failure(`import foo from "bar";`, `import qux from "bar";`, /^Structural mismatch .* "foo" and "qux"\n/);
//   failure(`import foo from "bar";`, `import foo from "qux";`, /^Structural mismatch .* "bar" and "qux"\n/);
//   // Export //
//   success(`export foo;`, `export foo;`, Mapping._empty(), Mapping._empty());
//   failure(`export foo;`, `export bar;`, /^Structural mismatch .* "foo" and "bar"\n/);
//   // Aggregate //
//   success(`aggregate foo from "bar" as qux;`, `aggregate foo from "bar" as qux;`, Mapping._empty(), Mapping._empty());
//   failure(`aggregate foo from "bar" as qux;`, `aggregate taz from "bar" as qux;`, /^Structural mismatch .* "foo" and "taz"\n/);
//   failure(`aggregate foo from "bar" as qux;`, `aggregate foo from "taz" as qux;`, /^Structural mismatch .* "bar" and "taz"\n/);
//   failure(`aggregate foo from "bar" as qux;`, `aggregate foo from "bar" as taz;`, /^Structural mismatch .* "qux" and "taz"\n/); }

///////////
// Block //
///////////
{
  const success = make_success(Parse.PARSE_BLOCK);
  const failure = make_failure(Parse.PARSE_BLOCK);
  // failure(`{let x1, y1;}`, `{let x2;}`, /^Binding length mismatch at .*\n/);
  success(`{let x1, y1; x1; z1;}`, `{let x2, y2; x2; z2;}`, Mapping._single("z1", "z2"), Mapping._empty());
  failure(`{let x1, y1; x1; z1;}`, `{let x2, z2; x2; z2;}`, /^Binding mismatch at .* between z1 and z2\n/);
  failure(`{123;}`, `{456;}`, /^Structural mismatch at .* between 123 and 456\n/); }

///////////////
// Statement //
///////////////
{
  const success = make_success(Parse.ParseStatement);
  const failure = make_failure(Parse.ParseStatement);
  failure(`break l;`, `continue l;`, /^Structural mismatch at .* "Break" and "Continue"\n/);
  // BlockLess //
  // Lift //
  success(`x1;`, `x2;`, Mapping._single("x1", "x2"), Mapping._empty());
  // Return //
  success(`return x1;`, `return x2;`, Mapping._single("x1", "x2"), Mapping._empty());
  // Break //
  success(`break k;`, `break l;`, Mapping._empty(), Mapping._single("k", "l"));
  // Continue //
  success(`continue k;`, `continue l;`, Mapping._empty(), Mapping._single("k", "l"));
  // Debugger //
  success(`debugger;`, `debugger;`, Mapping._empty(), Mapping._empty());
  // BlockFull //
  // Lone //
  failure(`k1: {x1; break k1; break l1;}`, `k2: {x2; break k2; break l2;}`, Mapping._single("x1", "x2"), Mapping._single("l1", "l2"));
  // If //
  failure(`k1: if (x1) {y1; break k1; break l1;} else {z1; break k1; break l1;}`, `k2: if (x2) {y2; break k2; break l2;} else {z2; break k2; break l2;}`, );
  failure(`k: k: if (x1) {y1;} else {z1;}`, `k: l: if (x2) {y2;} else {z2;}`, /^Structural mismatch .* "k" and "l"\n/);
  success(`k: l: if (x1) {y1;} else {z1;}`, `k: l: if (x2) {y2;} else {z2;}`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
  // While //
  failure(`k: l: while (x1) {y1;}`, `k: while (x2) {y2;}`, /^Structural mismatch .* 2 and 1\n/);
  failure(`k: k: while (x1) {y1;}`, `k: l: while (x2) {y2;}`, /^Structural mismatch .* "k" and "l"\n/);
  success(`k: l: while (x1) {y1;}`, `k: l: while (x2) {y2;}`, {__proto__:null, x1:"x2", y1:"y2"});
  // Try //
  failure(`k: l: try {x1;} catch {y1;} finally {z1;}`, `k: try {x2;} catch {y2;} finally {z2;}`, /^Structural mismatch .* 2 and 1\n/);
  failure(`k: k: try {x1;} catch {y1;} finally {z1;}`, `k: l: try {x2;} catch {y2;} finally {z2;}`, /^Structural mismatch .* "k" and "l"\n/);
  success(`k: l: try {x1;} catch {y1;} finally {z1;}`, `k: l: try {x2;} catch {y2;} finally {z2;}`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
}

////////////////
// Expression //
////////////////
{
  const success = (code1, code2, mapping1) => Assert.deepEqual(
    Match._match(
      Parse.parse_expression(code1),
      Parse.parse_expression(code2),
      (success, mapping2) => (
        Assert.ok(success),
        Assert.deepEqual(mapping1, mapping2),
        "foo")),
    "foo");
  const failure = (code1, code2, regexp) => Assert.deepEqual(
    Match._match(
      Parse.parse_expression(code1),
      Parse.parse_expression(code2),
      (success, reason) => (
        Assert.ok(!success),
        Assert.match(reason, regexp),
        "foo")),
    "foo");
  failure(`123`, `#global`, /^Type mismatch .* primitive and intrinsic\n/);
  failure(`(123, (x1, x1))`, `(123, (x2, y2))`, /^Combination mismatch .* x2 and y2 for x1\n/);
  // Producers //
  // import //
  success(`import x from "source"`, `import x from "source"`, {__proto__:null});
  failure(`import * from "foo"`, `import * from "bar"`, /^Structural mismatch .* "foo" and "bar"\n/);
  failure(`import x from "source"`, `import y from "source"`, /^Structural mismatch .* "x" and "y"\n/);
  // primitive //
  success(`123`, `123`, {__proto__:null});
  failure(`123`, `456`, /^Structural mismatch .* 123 and 456\n/);
  // intrinsic //
  success(`#global`, `#global`, {__proto__:null});
  failure(`#Reflect.get`, `#Reflect.set`, /^Structural mismatch .* "Reflect.get" and "Reflect.set"\n/);
  // arrow //
  success(`arrow () {x1;}`, `arrow () {x2;}`, {__proto__:null, x1:"x2"});
  // function //
  success(`function () {x1;}`, `function () {x2;}`, {__proto__:null, x1:"x2"});
  // method //
  success(`method () {x1;}`, `method () {x2;}`, {__proto__:null, x1:"x2"});
  // constructor //
  success(`constructor () {x1;}`, `constructor () {x2;}`, {__proto__:null, x1:"x2"});
  // read //
  success(`x1`, `x2`, {__proto__:null, x1:"x2"});
  success(`input`, `input`, {__proto__:null});
  // Consumers //
  // export //
  success(`export x 123`, `export x 123`, {__proto__:null});
  failure(`export x 123`, `export y 123`, /^Structural mismatch .* "x" and "y"\n/);
  // write //
  success(`x1 = y1`, `x2 = y2`, {__proto__:null, x1:"x2", y1:"y2"});
  success(`input = 123`, `input = 123`, {__proto__:null});
  // enclave-read //
  success(`enclave x`, `enclave x`, {__proto__:null});
  failure(`enclave x`, `enclave y`, /^Structural mismatch .* "x" and "y"\n/);
  // enclave-typeof //
  success(`enclave typeof x`, `enclave typeof x`, {__proto__:null});
  failure(`enclave typeof x`, `enclave typeof y`, /^Structural mismatch .* "x" and "y"\n/);
  // enclave-write //
  success(`enclave x ?= y`, `enclave x ?= z`, {__proto__:null, y:"z"});
  failure(`enclave x ?= 123`, `enclave y ?= 123`, /^Structural mismatch .* "x" and "y"\n/);
  failure(`enclave x ?= 123`, `enclave x != 123`, /^Structural mismatch .* false and true\n/);
  // enclave-super-call //
  success(`enclave super(...x)`, `enclave super(...y)`, {__proto__:null, x:"y"});
  // enclave-super-member //
  success(`enclave super[x]`, `enclave super[y]`, {__proto__:null, x:"y"});
  // sequence //
  success(`(x1, y1)`, `(x2, y2)`, {__proto__:null, x1:"x2", y1:"y2"});
  // conditional //
  success(`(x1 ? y1 : z1)`, `(x2 ? y2 : z2)`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
  // throw //
  success(`throw x1`, `throw x2`, {__proto__:null, x1:"x2"});
  // eval //
  success(`eval(x1)`, `eval(x2)`, {__proto__:null, x1:"x2"});
  // Combiners //
  // apply //
  failure(`f1(@t1, x1, y1)`, `f2(@t2, x2)`, /^Structural mismatch .* 2 and 1\n/);
  success(`f1(@t1, x1, y1)`, `f2(@t2, x2, y2)`, {__proto__:null, f1:"f2", t1:"t2", x1:"x2", y1:"y2"});
  // construct //
  failure(`new f1(x1, y1)`, `new f2(x2)`, /^Structural mismatch .* 2 and 1\n/);
  success(`new f1(x1, y1)`, `new f2(x2, y2)`, {__proto__:null, f1:"f2", x1:"x2", y1:"y2"});
  // require //
  success(`require x1`, `require x2`, {__proto__:null, x1:"x2"});
  // unary //
  failure(`!x1`, `~x2`, /^Structural mismatch .* "!" and "~"\n/);
  success(`!x1`, `!x2`, {__proto__:null, x1:"x2"});
  // binary //
  failure(`(x1 + y1)`, `(x2 - y2)`, /^Structural mismatch .* "\+" and "-"\n/);
  success(`(x1 + y1)`, `(x2 + y2)`, {__proto__:null, x1:"x2", y1:"y2"});
  // object //
  failure(`{__proto__:x1, foo:y1, bar:z1}`, `{__proto__:x2, foo:y2}`, /^Structural mismatch .* 2 and 1\n/);
  success(`{__proto__:x1, foo:y1, bar:z1}`, `{__proto__:x2, foo:y2, bar:z2}`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
}

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Parse = require("./parse/index.js");
const Match = require("./match.js");

/////////////
// Program //
/////////////
{
  const success = (code1, code2, mapping1) => Assert.deepEqual(
    Match._program(
      Parse._program(code1),
      Parse._program(code2),
      (success, mapping2) => (
        Assert.ok(success),
        Assert.deepEqual(mapping1, mapping2),
        "foo")),
    "foo");
  const failure = (code1, code2, regexp) => Assert.deepEqual(
    Match._program(
      Parse._program(code1),
      Parse._program(code2),
      (success, reason) => (
        Assert.ok(!success),
        Assert.ok(regexp.test(reason)),
        "foo")),
    "foo");
  failure(`export foo; { 123; }`, `{ 123; }`, /^Structural mismatch .* 1 and 0\n/);
  failure(`export foo; { 123; }`, `export bar; { 123; }`, /^Structural mismatch .* "foo" and "bar"\n/);
  failure(`export foo; { 123; }`, `export foo; { 456; }`, /^Structural mismatch .* 123 and 456\n/);
  success(`export foo; { 123; }`, `export foo; { 123; }`, {__proto__:null}); }

/////////////
// Prelude //
/////////////
{
  const success = (code1, code2, mapping1) => Assert.deepEqual(
    Match._prelude(
      Parse._prelude(code1),
      Parse._prelude(code2),
      (success, mapping2) => (
        Assert.ok(success),
        Assert.deepEqual(mapping1, mapping2),
        "foo")),
    "foo");
  const failure = (code1, code2, regexp) => Assert.deepEqual(
    Match._prelude(
      Parse._prelude(code1),
      Parse._prelude(code2),
      (success, reason) => (
        Assert.ok(!success),
        Assert.ok(regexp.test(reason)),
        "foo")),
    "foo");
  // Import //
  success(`import foo from "bar";`, `import foo from "bar";`, {__proto__:null});
  failure(`import foo from "bar";`, `import qux from "bar";`, /^Structural mismatch .* "foo" and "qux"\n/);
  failure(`import foo from "bar";`, `import foo from "qux";`, /^Structural mismatch .* "bar" and "qux"\n/);
  // Export //
  success(`export foo;`, `export foo;`, {__proto__:null});
  failure(`export foo;`, `export bar;`, /^Structural mismatch .* "foo" and "bar"\n/);
  // Aggregate //
  success(`aggregate foo from "bar" as qux;`, `aggregate foo from "bar" as qux;`, {__proto__:null});
  failure(`aggregate foo from "bar" as qux;`, `aggregate taz from "bar" as qux;`, /^Structural mismatch .* "foo" and "taz"\n/);
  failure(`aggregate foo from "bar" as qux;`, `aggregate foo from "taz" as qux;`, /^Structural mismatch .* "bar" and "taz"\n/);
  failure(`aggregate foo from "bar" as qux;`, `aggregate foo from "bar" as taz;`, /^Structural mismatch .* "qux" and "taz"\n/); }

///////////
// Block //
///////////
{
  const success = (code1, code2, mapping1) => Assert.deepEqual(
    Match._block(
      Parse.BLOCK(code1),
      Parse.BLOCK(code2),
      (success, mapping2) => (
        Assert.ok(success),
        Assert.deepEqual(mapping1, mapping2),
        "foo")),
    "foo");
  const failure = (code1, code2, regexp) => Assert.deepEqual(
    Match._block(
      Parse.BLOCK(code1),
      Parse.BLOCK(code2),
      (success, reason) => (
        Assert.ok(!success),
        Assert.ok(regexp.test(reason)),
        "foo")),
    "foo");
  failure(`{let x1, y1;}`, `{let x2;}`, /^Structural mismatch .* 2 and 1\n/);
  success(`{let x1, y1; x1; z1;}`, `{let x2, y2; x2; z2;}`, {__proto__:null, z1:"z2"});
  failure(`{let x1, y1; x1; z1;}`, `{let x2, z2; x2; z2;}`, /^Binding mismatch .* z1 and z2\n/);
  failure(`{123;}`, `{456;}`, /^Structural mismatch .* 123 and 456\n/); }

///////////////
// Statement //
///////////////
{
  const success = (code1, code2, mapping1) => Assert.deepEqual(
    Match._statement(
      Parse.Statement(code1),
      Parse.Statement(code2),
      (success, mapping2) => (
        Assert.ok(success),
        Assert.deepEqual(mapping1, mapping2),
        "foo")),
    "foo");
  const failure = (code1, code2, regexp) => Assert.deepEqual(
    Match._statement(
      Parse.Statement(code1),
      Parse.Statement(code2),
      (success, reason) => (
        Assert.ok(!success),
        Assert.ok(regexp.test(reason)),
        "foo")),
    "foo");
  failure(`break l;`, `continue l;`, /^Type mismatch .* Break and Continue\n/);
  // BlockLess //
  // Lift //
  success(`x1;`, `x2;`, {__proto__:null, x1:"x2"});
  // Return //
  success(`return x1;`, `return x2;`, {__proto__:null, x1:"x2"});
  // Break //
  failure(`break k;`, `break l;`, /^Structural mismatch .* "k" and "l"\n/);
  success(`break l;`, `break l;`, {__proto__:null});
  // Continue //
  failure(`continue k;`, `continue l;`, /^Structural mismatch .* "k" and "l"\n/);
  success(`continue l;`, `continue l;`, {__proto__:null});
  // Debugger //
  success(`debugger;`, `debugger;`, {__proto__:null});
  // BlockFull //
  // Lone //
  failure(`k: l: {x1;}`, `k: {x2;}`, /^Structural mismatch .* 2 and 1\n/);
  failure(`k: k: {x1;}`, `k: l: {x2;}`, /^Structural mismatch .* "k" and "l"\n/);
  success(`k: l: {x1;}`, `k: l: {x2;}`, {__proto__:null, x1:"x2"});
  // If //
  failure(`k: l: if (x1) {y1;} else {z1;}`, `k: if (x2) {y2;} else {z2;}`, /^Structural mismatch .* 2 and 1\n/);
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
    Match._expression(
      Parse.expression(code1),
      Parse.expression(code2),
      (success, mapping2) => (
        Assert.ok(success),
        Assert.deepEqual(mapping1, mapping2),
        "foo")),
    "foo");
  const failure = (code1, code2, regexp) => Assert.deepEqual(
    Match._expression(
      Parse.expression(code1),
      Parse.expression(code2),
      (success, reason) => (
        Assert.ok(!success),
        Assert.ok(regexp.test(reason)),
        "foo")),
    "foo");
  failure(`123`, `#global`, /^Type mismatch .* primitive and builtin\n/);
  failure(`(123, (x1, x1))`, `(123, (x2, y2))`, /^Combination mismatch .* x2 and y2 for x1\n/);
  // Producers //
  // import //
  success(`import x from "source"`, `import x from "source"`, {__proto__:null});
  failure(`import * from "foo"`, `import * from "bar"`, /^Structural mismatch .* "foo" and "bar"\n/);
  failure(`import x from "source"`, `import y from "source"`, /^Structural mismatch .* "x" and "y"\n/);
  // primitive //
  success(`123`, `123`, {__proto__:null});
  failure(`123`, `456`, /^Structural mismatch .* 123 and 456\n/);
  // builtin //
  success(`#global`, `#global`, {__proto__:null});
  failure(`#Reflect.get`, `#Reflect.set`, /^Structural mismatch .* "Reflect.get" and "Reflect.set"\n/);
  // arrow //
  success(`() => {x1;}`, `() => {x2;}`, {__proto__:null, x1:"x2"});
  // function //
  success(`function () {x1;}`, `function () {x2;}`, {__proto__:null, x1:"x2"});
  // method //
  success(`method () {x1;}`, `method () {x2;}`, {__proto__:null, x1:"x2"});
  // constructor //
  success(`constructor () {x1;}`, `constructor () {x2;}`, {__proto__:null, x1:"x2"});
  // read //
  success(`x1`, `x2`, {__proto__:null, x1:"x2"});
  success(`arguments`, `arguments`, {__proto__:null});
  // Consumers //
  // export //
  success(`export x 123`, `export x 123`, {__proto__:null});
  failure(`export x 123`, `export y 123`, /^Structural mismatch .* "x" and "y"\n/);
  // write //
  success(`x1 = y1`, `x2 = y2`, {__proto__:null, x1:"x2", y1:"y2"});
  success(`arguments = 123`, `arguments = 123`, {__proto__:null});
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

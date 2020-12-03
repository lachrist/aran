"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Parse = require("./parse/index.js");
const Match = require("./match.js");

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
  failure(`{123;}`, `{456;}`, /^Structural mismatch .* 123 and 456\n/);
}

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
  // Aggregate //
  failure(`export * from "foo";`, `export * from "bar";`, /^Structural mismatch .* "foo" and "bar"\n/);
  success(`export * from "foo";`, `export * from "foo";`, {__proto__:null});
  // Import //
  failure(`import * as arguments from "foo";`, `import * as this from "foo";`, /^Structural mismatch .* "arguments" and "this"\n/);
  failure(`import * as foo from "qux";`, `import * as bar from "taz";`, /^Structural mismatch .* "qux" and "taz"\n/);
  success(`import * as foo from "qux";`, `import * as bar from "qux";`, {__proto__:null, foo: "bar"});
  // Exports //
  failure(`export foo 123;`, `export bar 123;`, /^Structural mismatch .* "foo" and "bar"\n/);
  success(`export foo 123;`, `export foo 123;`, {__proto__:null});
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
  // import //
  success(`import x1`, `import x2`, {__proto__:null, x1:"x2"});
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

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Lang = require("../lang.js");
const Match = require("./match.js");
const Parser = require("./parser/index.js");

///////////
// Block //
///////////
{
  const success = (code1, code2, mapping) => Assert.deepEqual(
    Match._match_block(
      Parser.PARSE(code1),
      Parser.PARSE(code2)),
    mapping);
  const failure = (code1, code2, regexp) => Assert.throws(
    () => Match._match_block(
      Parser.PARSE(code1),
      Parser.PARSE(code2)),
    regexp);
  failure(`{let x1, y1;}`, `{let x2;}`, /^Error: Structural missmatch .* 2 and 1$/);
  success(`{let x1, y1; x1; z1;}`, `{let x2, y2; x2; z2;}`, {__proto__:null, z1:"z2"});
  failure(`{let x1, y1; x1; z1;}`, `{let x2, z2; x2; z2;}`, /^Error: Binding mismatch .* z1 and z2$/);
}

///////////////
// Statement //
///////////////
{
  const success = (code1, code2, mapping) => Assert.deepEqual(
    Match._match_statement(
      Parser.Parse(code1),
      Parser.Parse(code2)),
    mapping);
  const failure = (code1, code2, regexp) => Assert.throws(
    () => Match._match_statement(
      Parser.Parse(code1),
      Parser.Parse(code2)),
    regexp);
  failure(`break l;`, `continue l;`, /^Error: Type mismatch .* Break and Continue$/);
  // BlockLess //
  // Lift //
  success(`x1;`, `x2;`, {__proto__:null, x1:"x2"});
  // Return //
  success(`return x1;`, `return x2;`, {__proto__:null, x1:"x2"});
  // Break //
  failure(`break k;`, `break l;`, /^Error: Structural missmatch .* "k" and "l"$/);
  success(`break l;`, `break l;`, {__proto__:null});
  // Continue //
  failure(`continue k;`, `continue l;`, /^Error: Structural missmatch .* "k" and "l"$/);
  success(`continue l;`, `continue l;`, {__proto__:null});
  // Debugger //
  success(`debugger;`, `debugger;`, {__proto__:null});
  // BlockFull //
  // Lone //
  failure(`k: l: {x1;}`, `k: {x2;}`, /^Error: Structural missmatch .* 2 and 1$/);
  failure(`k: k: {x1;}`, `k: l: {x2;}`, /^Error: Structural missmatch .* "k" and "l"$/);
  success(`k: l: {x1;}`, `k: l: {x2;}`, {__proto__:null, x1:"x2"});
  // If //
  failure(`k: l: if (x1) {y1;} else {z1;}`, `k: if (x2) {y2;} else {z2;}`, /^Error: Structural missmatch .* 2 and 1$/);
  failure(`k: k: if (x1) {y1;} else {z1;}`, `k: l: if (x2) {y2;} else {z2;}`, /^Error: Structural missmatch .* "k" and "l"$/);
  success(`k: l: if (x1) {y1;} else {z1;}`, `k: l: if (x2) {y2;} else {z2;}`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
  // While //
  failure(`k: l: while (x1) {y1;}`, `k: while (x2) {y2;}`, /^Error: Structural missmatch .* 2 and 1$/);
  failure(`k: k: while (x1) {y1;}`, `k: l: while (x2) {y2;}`, /^Error: Structural missmatch .* "k" and "l"$/);
  success(`k: l: while (x1) {y1;}`, `k: l: while (x2) {y2;}`, {__proto__:null, x1:"x2", y1:"y2"});
  // Try //
  failure(`k: l: try {x1;} catch {y1;} finally {z1;}`, `k: try {x2;} catch {y2;} finally {z2;}`, /^Error: Structural missmatch .* 2 and 1$/);
  failure(`k: k: try {x1;} catch {y1;} finally {z1;}`, `k: l: try {x2;} catch {y2;} finally {z2;}`, /^Error: Structural missmatch .* "k" and "l"$/);
  success(`k: l: try {x1;} catch {y1;} finally {z1;}`, `k: l: try {x2;} catch {y2;} finally {z2;}`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
}

////////////////
// Expression //
////////////////
{
  const success = (code1, code2, mapping) => Assert.deepEqual(
    Match._match_expression(
      Parser.parse(code1),
      Parser.parse(code2)),
    mapping);
  const failure = (code1, code2, regexp) => Assert.throws(
    () => Match._match_expression(
      Parser.parse(code1),
      Parser.parse(code2)),
    regexp);
  failure(`123`, `#global`, /^Error: Type mismatch .* primitive and builtin/);
  failure(`(x1, x1)`, `(x2, y2)`, /^Error: Combination mismatch .* x2 and y2 for x1$/);
  // Producers //
  // primitive //
  success(`123`, `123`, {__proto__:null});
  failure(`123`, `456`, /^Error: Structural missmatch .* 123 and 456$/);
  // builtin //
  success(`#global`, `#global`, {__proto__:null});
  failure(`#Reflect.get`, `#Reflect.set`, /^Error: Structural missmatch .* "Reflect.get" and "Reflect.set"$/);
  // arrow //
  success(`() => {x1;}`, `() => {x2;}`, {__proto__:null, x1:"x2"});
  // function //
  success(`function () {x1;}`, `function () {x2;}`, {__proto__:null, x1:"x2"});
  // read //
  success(`x1`, `x2`, {__proto__:null, x1:"x2"});
  // Consumers //
  // write //
  success(`x1 = y1`, `x2 = y2`, {__proto__:null, x1:"x2", y1:"y2"});
  // sequence //
  success(`(x1, y1)`, `(x2, y2)`, {__proto__:null, x1:"x2", y1:"y2"});
  // conditional //
  success(`(x1 ? y1 : z1)`, `(x2 ? y2 : z2)`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
  // throw //
  success(`throw x1`, `throw x2`, {__proto__:null, x1:"x2"});
  // eval //
  failure(`eval(x1, §y1, §z1)`, `eval(x1, §y2)`, /^Error: Structural missmatch .* 2 and 1$/);
  success(`eval(x1, §y1, §z1)`, `eval(x2, §y2, §z2)`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
  // Combiners //
  // apply //
  failure(`f1(@t1, x1, y1)`, `f2(@t2, x2)`, /^Error: Structural missmatch .* 2 and 1$/);
  success(`f1(@t1, x1, y1)`, `f2(@t2, x2, y2)`, {__proto__:null, f1:"f2", t1:"t2", x1:"x2", y1:"y2"});
  // construct //
  failure(`new f1(x1, y1)`, `new f2(x2)`, /^Error: Structural missmatch .* 2 and 1$/);
  success(`new f1(x1, y1)`, `new f2(x2, y2)`, {__proto__:null, f1:"f2", x1:"x2", y1:"y2"});
  // unary //
  failure(`!x1`, `~x2`, /^Error: Structural missmatch .* "!" and "~"$/);
  success(`!x1`, `!x2`, {__proto__:null, x1:"x2"});
  // binary //
  failure(`x1 + y1`, `x2 - y2`, /^Error: Structural missmatch .* "\+" and "-"$/);
  success(`x1 + y1`, `x2 + y2`, {__proto__:null, x1:"x2", y1:"y2"});
  // object //
  failure(`{__proto__:x1, foo:y1, bar:z1}`, `{__proto__:x2, foo:y2}`, /^Error: Structural missmatch .* 2 and 1$/);
  success(`{__proto__:x1, foo:y1, bar:z1}`, `{__proto__:x2, foo:y2, bar:z2}`, {__proto__:null, x1:"x2", y1:"y2", z1:"z2"});
}

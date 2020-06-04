"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Lang = require("../lang.js");
const Match = require("./match.js");
const Parser = require("./parser/index.js");

///////////
// Block //
///////////

///////////////
// Statement //
///////////////
// BlockLess //
// Lift //
// Return //
// Break //
// Continue //
// Debugger //
// Bundle //
// BlockFull //
// Lone //
// If //
// While //
// Try //

///////////////
// Producers //
///////////////
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
// Producers //
// primitive //
success(`123`, `123`, {__proto__:null});
failure(`123`, `456`, /^Error: Structural missmatch .* 123 !== 456$/);
// builtin //
success(`#global`, `#global`, {__proto__:null});
failure(`#Reflect.get`, `#Reflect.set`, /^Error: Structural missmatch .* "Reflect.get" !== "Reflect.set"$/);
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
// Combiners //
// apply //
// construct //
// unary //
// binary //
// object //

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Lang = require("./lang.js");
const State = require("./state.js");
const Parser = require("../../test/parser/index.js");

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};

State._run_session({nodes, serials, scopes}, [], () => {
  Assert.throws(() => Lang.read("x"), new Error("Forbidden construction of scope-related node"));
  // Block //
  Assert.deepEqual(Lang.__BLOCK__(["x", "y"], [Lang.Break("l")]), Parser.PARSE("{ let x, y; break l; }"));
  // Statement //
  Assert.deepEqual(Lang.Debugger(), Parser.Parse("debugger;"));
  Assert.deepEqual(Lang.Break("l"), Parser.Parse("break l;"));
  Assert.deepEqual(Lang.Lone(["l", "m"], Lang.__BLOCK__(["x", "y"], [Lang.Break("l")])), Parser.Parse("l: m: { let x, y; break l; }"));
  Assert.deepEqual(Lang.While(["l", "m"], Lang.__read__("x"), Lang.__BLOCK__(["y", "z"], [Lang.Break("l")])), Parser.Parse("l: m: while (x) { let y, z; break l; }"));
  Assert.deepEqual(Lang.If(["l", "m"], Lang.__read__("x"), Lang.__BLOCK__(["y"], [Lang.Break("l")]), Lang.__BLOCK__(["z"], [Lang.Break("m")])), Parser.Parse("l: m: if (x) { let y; break l; } else { let z; break m; }"));
  // Expression //
  Assert.deepEqual(Lang.__read__("x"), Parser.parse("x"));
  Assert.deepEqual(Lang.__write__("x", Lang.__read__("y")), Parser.parse("(x = y)"));
  Assert.deepEqual(Lang.conditional(Lang.__read__("x"), Lang.__read__("y"), Lang.__read__("z")), Parser.parse("(x ? y : z)"));
});

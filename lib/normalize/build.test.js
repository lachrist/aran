"use strict";

const Assert = require("assert").strict;
const Build = require("./build.js");
const State = require("./state.js");
const Parser = require("../../test/parser/index.js");

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};
const program = {
  sourceType: "script",
  type: "Program",
  body: []
};

State.session({nodes, serials, scopes}, program, () => {
  Assert.throws(() => Build.read("x"), new Error("Forbidden construction of scope-related node"));
  // Block //
  Assert.deepEqual(Build.__BLOCK__(["x", "y"], Build.Break("l")), Parser.PARSE("{ let x, y; break l; }"));
  // Statement //
  Assert.deepEqual(Build.Debugger(), Parser.Parse("debugger;"));
  Assert.deepEqual(Build.Break("l"), Parser.Parse("break l;"));
  Assert.deepEqual(Build.Lone(["l", "m"], Build.__BLOCK__(["x", "y"], Build.Break("l"))), Parser.Parse("l: m: { let x, y; break l; }"));
  Assert.deepEqual(Build.While(["l", "m"], Build.__read__("x"), Build.__BLOCK__(["y", "z"], Build.Break("l"))), Parser.Parse("l: m: while (x) { let y, z; break l; }"));
  Assert.deepEqual(Build.If(["l", "m"], Build.__read__("x"), Build.__BLOCK__(["y"], Build.Break("l")), Build.__BLOCK__(["z"], Build.Break("m"))), Parser.Parse("l: m: if (x) { let y; break l; } else { let z; break m; }"));
  // Expression //
  Assert.deepEqual(Build.__read__("x"), Parser.parse("x"));
  Assert.deepEqual(Build.__write__("x", Build.__read__("y")), Parser.parse("(x = y)"));
  Assert.deepEqual(Build.conditional(Build.__read__("x"), Build.__read__("y"), Build.__read__("z")), Parser.parse("(x ? y : z)"));
});

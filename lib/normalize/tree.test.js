"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Tree = require("./tree.js");
const State = require("./state.js");
const Parser = require("../test/parser/index.js");

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};

State._run_session({nodes, serials, scopes}, [], () => {
  Assert.throws(() => Tree.read("x"), new Error("Forbidden construction of scope-related node"));
  // Block //
  Assert.deepEqual(Tree.__BLOCK__(["x", "y"], [Tree.Break("l")]), Parser.PARSE("{ let x, y; break l; }"));
  // Statement //
  Assert.deepEqual(Tree.Debugger(), Parser.Parse("debugger;"));
  Assert.deepEqual(Tree.Break("l"), Parser.Parse("break l;"));
  Assert.deepEqual(Tree.Lone(["l", "m"], Tree.__BLOCK__(["x", "y"], [Tree.Break("l")])), Parser.Parse("l: m: { let x, y; break l; }"));
  Assert.deepEqual(Tree.While(["l", "m"], Tree.__read__("x"), Tree.__BLOCK__(["y", "z"], [Tree.Break("l")])), Parser.Parse("l: m: while (x) { let y, z; break l; }"));
  Assert.deepEqual(Tree.If(["l", "m"], Tree.__read__("x"), Tree.__BLOCK__(["y"], [Tree.Break("l")]), Tree.__BLOCK__(["z"], [Tree.Break("m")])), Parser.Parse("l: m: if (x) { let y; break l; } else { let z; break m; }"));
  // Expression //
  Assert.deepEqual(Tree.__read__("x"), Parser.parse("x"));
  Assert.deepEqual(Tree.__write__("x", Tree.__read__("y")), Parser.parse("(x = y)"));
  Assert.deepEqual(Tree.conditional(Tree.__read__("x"), Tree.__read__("y"), Tree.__read__("z")), Parser.parse("(x ? y : z)"));
});

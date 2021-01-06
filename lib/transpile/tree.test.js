"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Tree = require("./tree.js");
const State = require("./state.js");
const Lang = require("../lang/index.js");

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};

State._run_session({nodes, serials, scopes}, () => {
  Assert.throws(() => Tree.read("x"), new Error("Forbidden construction"));
  // Block //
  Assert.deepEqual(Tree.__BLOCK__(["l", "m"], ["x", "y"], [Tree.Break("l")]), Lang.PARSE_BLOCK("l: m: { let x, y; break l; }"));
  // Statement //
  Assert.deepEqual(Tree.Debugger(), Lang.ParseStatement("debugger;"));
  Assert.deepEqual(Tree.Break("l"), Lang.ParseStatement("break l;"));
  Assert.deepEqual(Tree.Lone(Tree.__BLOCK__(["l", "m"], ["x", "y"], [Tree.Break("l")])), Lang.ParseStatement("l: m: { let x, y; break l; }"));
  Assert.deepEqual(Tree.While(Tree.__read__("x"), Tree.__BLOCK__(["l", "m"], ["y", "z"], [Tree.Break("l")])), Lang.ParseStatement("while (x) l: m: { let y, z; break l; }"));
  Assert.deepEqual(Tree.If(Tree.__read__("x"), Tree.__BLOCK__(["l", "m"], ["y"], [Tree.Break("l")]), Tree.__BLOCK__(["l", "m"], ["z"], [Tree.Break("m")])), Lang.ParseStatement("if (x) l: m: { let y; break l; } else l: m: { let z; break m; }"));
  // Expression //
  Assert.deepEqual(Tree.__read__("x"), Lang.parse_expression("x"));
  Assert.deepEqual(Tree.__write__("x", Tree.__read__("y")), Lang.parse_expression("(x = y)"));
  Assert.deepEqual(Tree.conditional(Tree.__read__("x"), Tree.__read__("y"), Tree.__read__("z")), Lang.parse_expression("(x ? y : z)"));
}, []);

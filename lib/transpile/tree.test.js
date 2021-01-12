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
  Assert.throws(() => Tree.ReadExpression("x"), new Error("Forbidden construction"));
  // Block //
  Assert.deepEqual(Tree.__Block__(["x", "y"], [Tree.BreakStatement("l")], Tree.PrimitiveExpression(123)), Lang.parseBlock("let x, y; break l; completion 123;"));
  // Statement //
  Assert.deepEqual(Tree.DebuggerStatement(), Lang.parseStatement("debugger;"));
  Assert.deepEqual(Tree.BreakStatement("l"), Lang.parseStatement("break l;"));
  Assert.deepEqual(Tree.BlockStatement(Tree.__Block__(["x", "y"], [Tree.BreakStatement("l")], Tree.PrimitiveExpression(123))), Lang.parseStatement("let x, y; break l; completion 123;"));
  Assert.deepEqual(Tree.WhileStatement(Tree.__read__("x"), Tree.__Block__(["l", "m"], ["y", "z"], [Tree.BreakStatement("l")])), Lang.parseStatement("while (x) l: m: { let y, z; break l; }"));
  Assert.deepEqual(Tree.IfStatement(Tree.__read__("x"), Tree.__Block__(["l", "m"], ["y"], [Tree.BreakStatement("l")]), Tree.__Block__(["l", "m"], ["z"], [Tree.BreakStatement("m")])), Lang.parseStatement("if (x) l: m: { let y; break l; } else l: m: { let z; break m; }"));
  // Expression //
  Assert.deepEqual(Tree.__read__("x"), Lang.parseExpression("x"));
  Assert.deepEqual(Tree.__write__("x", Tree.__read__("y")), Lang.parseExpression("(x = y)"));
  Assert.deepEqual(Tree.ConditionalExpression(Tree.__read__("x"), Tree.__read__("y"), Tree.__read__("z")), Lang.parseExpression("(x ? y : z)"));
  Assert.deepEqual(Tree.ClosureExpression("arrow", false, false, Tree.__Block__(["l"], ["x"], [])), Lang.parseExpression("(arrow () l: { let x; })"));
}, []);

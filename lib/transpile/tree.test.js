"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Tree = require("./tree.js");
const State = require("./state.js");
const Lang = require("../lang/index.js");

const nodes = [];
const serials = new Map();
const scopes = {__proto__:null};

State.runSession({nodes, serials, scopes}, () => {
  let counter = 0;
  Assert.throws(() => Tree.ReadExpression("x"), new Error("Forbidden construction of ReadExpression"));
  // 0 //
  Assert.deepEqual(Tree.DebuggerStatement(), Lang.parseStatement("debugger;"));
  Assert.deepEqual(serials.size, counter += 1);
  // 1 //
  Assert.deepEqual(Tree.BreakStatement("l"), Lang.parseStatement("break l;"));
  Assert.deepEqual(serials.size, counter += 1);
  // 2 //
  Assert.deepEqual(Tree.UnaryExpression("!", Tree.PrimitiveExpression(123)), Lang.parseExpression("!123"));
  Assert.deepEqual(serials.size, counter += 2);
  // 3 //
  Assert.deepEqual(Tree.BinaryExpression("+", Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456)), Lang.parseExpression("(123 + 456)"));
  Assert.deepEqual(serials.size, counter += 3);
  // 4 //
  Assert.deepEqual(Tree.ClosureExpression("function", true, true, Tree.__Block__(["x"], [], Tree.PrimitiveExpression(123))), Lang.parseExpression("async function * () { let x; completion 123; }"));
  Assert.deepEqual(serials.size, counter += 3);
}, []);

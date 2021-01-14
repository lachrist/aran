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
  Assert.throws(
    () => Tree.ReadExpression("x"),
    new Error("Forbidden construction of ReadExpression"));
  // 0 //
  Lang.match(
    Tree.DebuggerStatement(),
    Lang.parseSingleStatement("debugger;"),
    Assert);
  Assert.deepEqual(serials.size, counter += 1);
  // 1 //
  Lang.match(
    Tree.BreakStatement("l"),
    Lang.parseSingleStatement("break l;"),
    Assert);
  Assert.deepEqual(serials.size, counter += 1);
  // 2 //
  Lang.match(
    Tree.UnaryExpression(
      "!",
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression("!123"),
    Assert);
  Assert.deepEqual(serials.size, counter += 2);
  // 3 //
  Lang.match(
    Tree.BinaryExpression(
      "+",
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456)),
    Lang.parseExpression("(123 + 456)"),
    Assert);
  Assert.deepEqual(serials.size, counter += 3);
  // 4 //
  Lang.match(
    Tree.ClosureExpression(
      "function",
      true,
      true,
      Tree.__Block__(
        ["x"],
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(123)))),
    Lang.parseExpression("async function * () { let x; completion 123; }"),
    Assert);
  Assert.deepEqual(serials.size, counter += 4);
}, []);

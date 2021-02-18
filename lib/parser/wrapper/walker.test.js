"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Walker = require("./walker.js");
const Acorn = require("acorn");

const trace = [];

Walker.walk(
  Acorn.parse(`if ([this,,123]) ;`, {ecmaVersion:2021, sourceType:"script"}),
  (node, options) => (
    Assert.deepEqual(options, {foo:"bar"}),
    trace[trace.length] = node.type),
  {foo:"bar"});

Assert.deepEqual(
  trace,
  [
    "Program",
    "IfStatement",
    "ArrayExpression",
    "ThisExpression",
    "Literal",
    "EmptyStatement"]);

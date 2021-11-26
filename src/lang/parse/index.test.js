"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Parse = require("./index.js");
const Tree = require("../../tree.js");

Assert.throws(
  () => Parse.parseExpression("%"));
Assert.deepEqual(
  Parse.parseExpression(`123`),
  Tree.PrimitiveExpression(123));
Assert.deepEqual(
  Parse.parse("Expression", `123`),
  Tree.PrimitiveExpression(123));
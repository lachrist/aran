"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ParseExternal = require("../../parse-external.js");
const Lang = require("../../lang");
const Tree = require("../tree.js");
const State = require("../state.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const default_context = {foo:"bar"};

Assert.deepEqual(
  Visit.initializeTest(
    [
      {
        literal: (scope, node, context) => (
          Assert.deepEqual(context, default_context),
          Assert.deepEqual(node.type, "Literal"),
          Tree.PrimitiveExpression(node.value))}]),
  void 0);

Assert.throws(
  () => Visit.initializeTest([]),
  new global.Error(`Visit is already initialized`));

State.runSession({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {
  Lang.match(
    Visit.literal(
      Scope.RootScope(),
      ParseExternal(`123;`).body[0].expression,
      default_context),
    Tree.PrimitiveExpression(123),
    Assert);
});

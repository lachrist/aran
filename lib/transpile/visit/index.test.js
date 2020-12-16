"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Parse = require("../../parse.js");
const Lang = require("../../lang");
const Tree = require("../tree.js");
const State = require("../state.js");
const Scope = require("../scope");
const Visit = require("./index.js");

const default_context = {foo:"bar"};

Assert.deepEqual(
  Visit._test_init(
    [
      {
        literal: (scope, node, context) => (
          Assert.deepEqual(context, default_context),
          Assert.deepEqual(node.type, "Literal"),
          Tree.primitive(node.value))}]),
  void 0);

Assert.throws(
  () => Visit._test_init([]),
  new global.Error(`Visit is already initialized`));

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {
  Lang._match(
    Visit.literal(
      Scope._make_root(),
      Parse.script(`123;`).body[0].expression,
      default_context),
    Tree.primitive(123),
    Assert);
});

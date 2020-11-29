"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Parse = require("../parse.js");
const Lang = require("../lang/index.js");
const State = require("./state.js");

const estree_node = Parse.script(`123;`).body[0].expression;
const aran_node = Lang.parse_expression(`456`);
const state = {
  scopes: {__proto__:null},
  serials: new Map(),
  nodes: []
};
Assert.deepEqual(State._run_session(state, (x, y) => {
  Assert.deepEqual(x, "foo");
  Assert.deepEqual(y, "bar");
  Assert.throws(
    () => State._run_session(state, [], () => Assert.fail()),
    new Error("Another script is already being normalized (two scripts cannot be normalized concurrently)."));
  Assert.deepEqual(State._visit(estree_node, (x, y) => {
    Assert.deepEqual(x, "foo");
    Assert.deepEqual(y, "bar");
    Assert.deepEqual(state.nodes.length, 1);
    Assert.equal(state.nodes[0], estree_node);
    Assert.deepEqual(State._visit(null, (...args) => {
      Assert.deepEqual(args, [1,2,3]);
      Assert.equal(State._register_node(aran_node), aran_node);
      return 4;
    }, [1,2,3]), 4);
    Assert.deepEqual(state.serials.size, 1);
    Assert.deepEqual(state.serials.get(aran_node), 0);
    State._register_scope([]);
    Assert.deepEqual(state.scopes, {__proto__:null, 0:[]});
    return "qux";
  }, ["foo", "bar"]), "qux");
  return "qux";
}, ["foo", "bar"]), "qux");

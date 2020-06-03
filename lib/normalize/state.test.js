"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Acorn = require("acorn");
const Parser = require("../../test/parser/index.js");
const State = require("./state.js");

const estree_node = Acorn.parse(`123;`).body[0].expression;
const aran_node = Parser.parse(`456`);
const state = {
  evals: {__proto__:null},
  serials: new Map(),
  nodes: []
};
Assert.deepEqual(State._run_session(state, ["foo", "bar"], (x, y) => {
  Assert.deepEqual(x, "foo");
  Assert.deepEqual(y, "bar");
  Assert.throws(
    () => State._run_session(state, [], () => Assert.fail()),
    new Error("Another script is already being normalized (two scripts cannot be normalized concurrently)."));
  Assert.deepEqual(State._visit(estree_node, ["foo", "bar"], (x, y) => {
    Assert.deepEqual(x, "foo");
    Assert.deepEqual(y, "bar");
    Assert.deepEqual(state.nodes.length, 1);
    Assert.equal(state.nodes[0], estree_node);
    Assert.equal(State._register_node(aran_node), aran_node);
    Assert.deepEqual(state.serials.size, 1);
    Assert.deepEqual(state.serials.get(aran_node), 0);
    State._register_scope([]);
    Assert.deepEqual(state.evals, {__proto__:null, 0:[]});
    return "qux";
  }), "qux");
  return "qux";
}), "qux");

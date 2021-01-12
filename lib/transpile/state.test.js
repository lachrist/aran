"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ParseExternal = require("../parse-external.js");
const Lang = require("../lang/index.js");
const State = require("./state.js");

const estree_node_1 = ParseExternal(`123;`).body[0].expression;
const estree_node_2 = ParseExternal(`123;`).body[0].expression;
const aran_node = Lang.parseExpression(`456`);
const state = {
  scopes: {},
  serials: new Map(),
  nodes: []
};
Assert.deepEqual(State._run_session(state, (...args) => {
  Assert.deepEqual(args, []);
  Assert.throws(
    () => State._run_session(state, [], () => Assert.fail()),
    new Error("Another script is already being normalized (two scripts cannot be normalized concurrently)."));
  Assert.deepEqual(State._visit(estree_node_1, (...args) => {
    Assert.deepEqual(args, ["foo", "bar", "qux"]);
    Assert.deepEqual(State._register_node(aran_node), aran_node);
    Assert.deepEqual(State._register_scope(null), void 0);
    Assert.deepEqual(state, {
      nodes: [estree_node_1],
      serials: new Map([[aran_node, 0]]),
      scopes: {[0]: null}
    });
    Assert.deepEqual(State._visit(estree_node_2, (...args) => {
      Assert.deepEqual(args, [1, 2, 3]);
      Assert.deepEqual(state.nodes, [estree_node_1, estree_node_2]);
      Assert.deepEqual(State._visit(estree_node_2, (...args) => {
        Assert.deepEqual(args, [1, 2, 3]);
        Assert.deepEqual(state.nodes, [estree_node_1, estree_node_2]);
        return 4;
      }, 1, 2, 3), 4);
      return 4;
    }, 1, 2, 3), 4);
    Assert.deepEqual(state.nodes, [estree_node_1]);
    return "taz";
  }, "foo", "bar", "qux"), "taz");
  return "qux";
}), "qux");
Assert.deepEqual(state, {
  nodes: [estree_node_1],
  serials: new Map([[aran_node, 0]]),
  scopes: {[0]: null}
});

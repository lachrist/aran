"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Tree = require("../tree.js");
const State = require("./state.js");

const estree_node_1 = {
  type: "Literal",
  value: 12
};
const estree_node_2 = {
  type: "Literal",
  value: 34
};
const aran_node_1 = Tree.PrimitiveExpression(56);
const aran_node_2 = Tree.PrimitiveExpression(78);
const state = {
  evals: {},
  serials: new Map(),
  nodes: []
};
Assert.deepEqual(State.runSession(state, "cache", (...args) => {
  Assert.deepEqual(args, []);
  Assert.deepEqual(
    State.getCache(),
    "cache");
  Assert.throws(
    () => State.runSession(state, [], () => Assert.fail()),
    new Error("Another script is already being normalized (two scripts cannot be normalized concurrently)."));
  Assert.deepEqual(State.visit(estree_node_1, (...args) => {
    Assert.deepEqual(args, ["foo", "bar", "qux"]);
    Assert.deepEqual(State.registerNode(aran_node_1), aran_node_1);
    Assert.deepEqual(State.registerEvalNode(aran_node_2, "source", "scope"), aran_node_2);
    Assert.deepEqual(state, {
      nodes: [estree_node_1],
      serials: new Map([[aran_node_1, 0], [aran_node_2, 0]]),
      evals: {[0]: {source:"source", scope:"scope"}}
    });
    Assert.deepEqual(State.visit(estree_node_2, (...args) => {
      Assert.deepEqual(args, [1, 2, 3]);
      Assert.deepEqual(state.nodes, [estree_node_1, estree_node_2]);
      Assert.deepEqual(State.visit(estree_node_2, (...args) => {
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
  serials: new Map([[aran_node_1, 0], [aran_node_2, 0]]),
  evals: {[0]: {source:"source", scope:"scope"}}
});

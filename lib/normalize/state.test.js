"use strict";

const Assert = require("assert").strict;
const State = require("./state.js");
const Parser = require("../../test/parser/index.js");

const nodes = [];
const serials = new Map();
const evals = {__proto__:null};
const program = {
  sourceType: "script",
  type: "Program",
  body: []
};
const node = {
  type: "Literal",
  value: 123
};
const aran_node = Parser.parse("456");

State.session({nodes, serials, evals}, program, () => {
  Assert.throws(
    () => State.session({nodes, serials, evals}, program, Assert.fail.bind(Assert)),
    new Error("Another script is already being normalized (two scripts cannot be normalized concurrently)."));
  Assert.deepEqual(nodes, [program]);
  Assert.equal(State.visit(node, () => {
    Assert.deepEqual(nodes, [program, node]);
    Assert.strictEqual(State.tag(aran_node), aran_node);
    Assert.deepEqual(serials, new Map([[aran_node, 1]]));
    return "foo";
  }), "foo");
  State.register_eval([]);
  Assert.deepEqual(evals, {__proto__:null, 0:[]});
});

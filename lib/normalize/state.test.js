"use strict";

const Tap = require("tap");
const State = require("./state.js");

// Tap.strictEqual(State.is_locked(), false);
// Tap.throws(() => State.unlock(), new Error("State already unlocked"));

const nodes = [];
const serials = new Map();
const evals = {__proto__:null};
const program = {__proto__:null, foo:123};
const node = {__proto__:null, bar:456}
const aran_node = {__proto__:null, qux:789};

State.session({nodes, serials, evals}, program, () => {
  Tap.throws(
    () => State.session({__proto__:null}, null, () => {}),
    new Error("Another script is already being normalized (two scripts cannot be normalized concurrently)."));
  Tap.strictSame(nodes, [program]);
  State.visit(node, () => {
    Tap.strictSame(nodes, [program, node]);
    Tap.strictEquals(State.tag(aran_node), aran_node);
    Tap.strictSame(serials, new Map([[aran_node, 1]]));
  });
  State.register_eval("foobar");
  Tap.strictSame(evals, {__proto__:null, 0:"foobar"});
});

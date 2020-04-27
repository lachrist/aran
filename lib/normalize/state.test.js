"use strict";

const Tap = require("tap");
const State = require("./state.js");

// Tap.strictEqual(State.is_locked(), false);
// Tap.throws(() => State.unlock(), new Error("State already unlocked"));

const esnodes = [];
const serials = new Map();
const scopes = {__proto__:null};
const esprogram = {__proto__:null, foo:123};
const esnode = {__proto__:null, bar:456}
const node = {__proto__:null, qux:789};

State.session({esnodes, serials, scopes}, esprogram, () => {
  Tap.throws(
    () => State.session({__proto__:null}, null, () => {}),
    new Error("Another script is already being normalized (two scripts cannot be normalized concurrently)."));
  Tap.strictSame(esnodes, [esprogram]);
  State.visit(esnode, () => {
    Tap.strictSame(esnodes, [esprogram, esnode]);
    Tap.strictEquals(State.associate_current_serial_to_node(node), node);
    Tap.strictSame(serials, new Map([[node, 1]]));
  });
  State.associate_scope_to_current_serial("foobar");
  Tap.strictSame(scopes, {__proto__:null, 0:"foobar"});
});

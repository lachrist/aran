"use strict";

const Tap = require("tap");
const Build = require("./build.js");
const State = require("./state.js");

const nodes = ["foo", "bar", "qux"];
const serials = new Map();
const scopes = {__proto__:null};
const program = {__proto__:null};

State.session({nodes, serials, scopes}, program, () => {
  Tap.throws(() => Build.read("foo"), new Error("Forbidden construction of scope-related node"));
  const aran_node1 = Build.Debugger();
  Tap.strictSame(aran_node1, ["Debugger"]);
  const aran_node2 = Build._read("foo");
  Tap.strictSame(aran_node2, ["read", "foo"]);
  const aran_node3 = Build._write("foo", "bar");
  Tap.strictSame(aran_node3, ["write", "foo", "bar"]);
  const aran_node4 = Build.conditional("foo", "bar", "qux");
  Tap.strictSame(aran_node4, ["conditional", "foo", "bar", "qux"]);
  const aran_node5 = Build.If("foo", "bar", "qux", "taz");
  Tap.strictSame(aran_node5, ["If", "foo", "bar", "qux", "taz"]);
  Tap.strictSame(serials, new Map([
    [aran_node1, 3],
    [aran_node2, 3],
    [aran_node3, 3],
    [aran_node4, 3],
    [aran_node5, 3],
  ]));
});

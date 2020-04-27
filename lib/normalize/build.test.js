"use strict";

const Tap = require("tap");
const Build = require("./build.js");
const State = require("./state.js");

const esnodes = ["foo", "bar", "qux"];
const serials = new Map();
const scopes = {__proto__:null};
const esprogram = {__proto__:null};

State.session({esnodes, serials, scopes}, esprogram, () => {
  Tap.throws(() => Build.read("foo"), new Error("Forbidden construction of scope-related node"));
  const node1 = Build.Debugger();
  Tap.strictSame(node1, ["Debugger"]);
  const node2 = Build._read("foo");
  Tap.strictSame(node2, ["read", "foo"]);
  const node3 = Build._write("foo", "bar");
  Tap.strictSame(node3, ["write", "foo", "bar"]);
  const node4 = Build.conditional("foo", "bar", "qux");
  Tap.strictSame(node4, ["conditional", "foo", "bar", "qux"]);
  const node5 = Build.If("foo", "bar", "qux", "taz");
  Tap.strictSame(node5, ["If", "foo", "bar", "qux", "taz"]);
  Tap.strictSame(serials, new Map([
    [node1, 3],
    [node2, 3],
    [node3, 3],
    [node4, 3],
    [node5, 3],
  ]));
});

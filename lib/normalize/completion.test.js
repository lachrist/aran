"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Completion = require("./completion.js");
const Scope = require("./scope/index.js");
const Tree = require("./tree.js");
const State = require("./state.js");
const Acorn = require("acorn");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

// _is_last && _set_not_last //
Assert.deepEqual(Completion._is_last(Completion._make_empty()), false);
Assert.deepEqual(Completion._is_last(Completion._make_full()), true);
Assert.deepEqual(Completion._is_last(Completion._set_not_last(Completion._make_empty(), "l")), false);
Assert.deepEqual(Completion._is_last(Completion._set_not_last(Completion._make_full())), false);
// _register_label //
Assert.deepEqual(Completion._register_label(Completion._make_empty()), Completion._make_empty());
Assert.notDeepEqual(Completion._register_label(Completion._make_full()), Completion._make_full());
Assert.deepEqual(
  Completion._register_label(Completion._extend(Completion._make_full(), parse(`123; 456;`).body, 0), "l"),
  Completion._extend(Completion._make_full(), parse(`123; 456;`).body, 0));
// _extend //
Assert.throws(() => Completion._extend(Completion._make_empty(), parse(`123;`).body, -1), new Error("Out-of-range offset"));
Assert.throws(() => Completion._extend(Completion._make_empty(), parse(`123;`).body, 1), new Error("Out-of-range offset"));
Assert.deepEqual(Completion._extend(Completion._make_empty(), parse(`123;`).body, 0), Completion._make_empty());
// Assert.deepEqual(Completion._extend(Completion._make(), parse(`var x;`).body, 0), null);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._make_full(), parse(`123; 456;`).body, 0)), false);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._make_full(), parse(`123; var x;`).body, 0)), true);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._register_label(Completion._make_full(), "l"), parse(`k: { 123; break k; }`).body[0].body.body, 0)), false);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._register_label(Completion._make_full(), "l"), parse(`l: { 123; break l; }`).body[0].body.body, 0)), true);

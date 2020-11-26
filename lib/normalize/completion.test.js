"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Completion = require("./completion.js");
const Scope = require("./scope/index.js");
const Tree = require("./tree.js");
const State = require("./state.js");

// _is_last && _set_not_last //
Assert.deepEqual(Completion._is_last(Completion._make_empty()), false);
Assert.deepEqual(Completion._is_last(Completion._make_full()), true);
Assert.deepEqual(Completion._is_last(Completion._set_not_last(Completion._make_empty(), "l")), false);
Assert.deepEqual(Completion._is_last(Completion._set_not_last(Completion._make_full())), false);
// _register_label //
Assert.deepEqual(Completion._register_label(Completion._make_empty()), Completion._make_empty());
Assert.notDeepEqual(Completion._register_label(Completion._make_full()), Completion._make_full());
Assert.deepEqual(
  Completion._register_label(Completion._extend(Completion._make_full(), Parse.module(`123; 456;`).body, 0), "l"),
  Completion._extend(Completion._make_full(), Parse.module(`123; 456;`).body, 0));
// _extend //
Assert.throws(() => Completion._extend(Completion._make_empty(), Parse.module(`123;`).body, -1), new Error("Out-of-range offset"));
Assert.throws(() => Completion._extend(Completion._make_empty(), Parse.module(`123;`).body, 1), new Error("Out-of-range offset"));
Assert.deepEqual(Completion._extend(Completion._make_empty(), Parse.module(`123;`).body, 0), Completion._make_empty());
// Assert.deepEqual(Completion._extend(Completion._make(), Parse.module(`var x;`).body, 0), null);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._make_full(), Parse.module(`123; 456;`).body, 0)), false);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._make_full(), Parse.module(`123; var x;`).body, 0)), true);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._register_label(Completion._make_full(), "l"), Parse.module(`k: { 123; break k; }`).body[0].body.body, 0)), false);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._register_label(Completion._make_full(), "l"), Parse.module(`l: { 123; break l; }`).body[0].body.body, 0)), true);

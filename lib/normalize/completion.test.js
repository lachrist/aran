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
Assert.deepEqual(Completion._is_last(null), false);
Assert.deepEqual(Completion._is_last(Completion._make()), true);
Assert.deepEqual(Completion._is_last(Completion._set_not_last(null, "l")), false);
Assert.deepEqual(Completion._is_last(Completion._set_not_last(Completion._make())), false);
// _register_label //
Assert.deepEqual(Completion._register_label(null), null);
Assert.notDeepEqual(Completion._register_label(Completion._make()), Completion._make());
Assert.deepEqual(
  Completion._register_label(Completion._extend(Completion._make(), parse(`123; 456;`).body, 0), "l"),
  Completion._extend(Completion._make(), parse(`123; 456;`).body, 0));
// _extend //
Assert.throws(() => Completion._extend(null, parse(`123;`).body, -1), new Error("Out-of-range offset"));
Assert.throws(() => Completion._extend(null, parse(`123;`).body, 1), new Error("Out-of-range offset"));
Assert.deepEqual(Completion._extend(null, parse(`123;`).body, 0), null);
// Assert.deepEqual(Completion._extend(Completion._make(), parse(`var x;`).body, 0), null);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._make(), parse(`123; 456;`).body, 0)), false);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._make(), parse(`123; var x;`).body, 0)), true);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._register_label(Completion._make(), "l"), parse(`k: { 123; break k; }`).body[0].body.body, 0)), false);
Assert.deepEqual(Completion._is_last(Completion._extend(Completion._register_label(Completion._make(), "l"), parse(`l: { 123; break l; }`).body[0].body.body, 0)), true);

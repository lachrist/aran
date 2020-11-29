"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Completion = require("./completion.js");

// Empty //

Assert.deepEqual(Completion._is_last(Completion._make_empty()), false);
Assert.deepEqual(Completion._is_last(Completion._anticipate(Completion._make_empty(), false)), false);
Assert.deepEqual(Completion._is_last(Completion._anticipate(Completion._make_empty(), true)), false);
Assert.deepEqual(Completion._register_label(Completion._make_empty()), Completion._make_empty());
Assert.deepEqual(Completion._is_last(Completion._anticipate(Completion._make_empty(), null)), false);

// Full //

Assert.deepEqual(Completion._is_last(Completion._make_full()), true);
Assert.deepEqual(Completion._is_last(Completion._anticipate(Completion._make_full(), false)), true);
Assert.deepEqual(Completion._is_last(Completion._anticipate(Completion._make_full(), true)), false);
Assert.deepEqual(Completion._is_last(Completion._anticipate(Completion._make_full(), null)), false);

Assert.deepEqual(
  Completion._is_last(
    Completion._anticipate(
      Completion._register_label(
        Completion._make_full(),
        null),
      null)),
  true);

Assert.deepEqual(
  Completion._is_last(
    Completion._anticipate(
      Completion._register_label(
        Completion._anticipate(
          Completion._make_full(),
          true),
        null),
      null)),
  false);

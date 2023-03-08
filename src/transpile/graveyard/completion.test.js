"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Completion = require("./completion.js");

// Empty //

Assert.deepEqual(Completion.isLast(Completion.Empty()), false);
Assert.deepEqual(Completion.isLast(Completion.anticipateValuation(Completion.Empty(), false)), false);
Assert.deepEqual(Completion.isLast(Completion.anticipateValuation(Completion.Empty(), true)), false);
Assert.deepEqual(Completion.registerLabel(Completion.Empty()), Completion.Empty());
Assert.deepEqual(Completion.isLast(Completion.anticipateValuation(Completion.Empty(), null)), false);

// Full //

Assert.deepEqual(Completion.isLast(Completion.Full()), true);
Assert.deepEqual(Completion.isLast(Completion.anticipateValuation(Completion.Full(), false)), true);
Assert.deepEqual(Completion.isLast(Completion.anticipateValuation(Completion.Full(), true)), false);
Assert.deepEqual(Completion.isLast(Completion.anticipateValuation(Completion.Full(), null)), false);

Assert.deepEqual(
  Completion.isLast(
    Completion.anticipateValuation(
      Completion.registerLabel(
        Completion.Full(),
        null),
      null)),
  true);

Assert.deepEqual(
  Completion.isLast(
    Completion.anticipateValuation(
      Completion.registerLabel(
        Completion.anticipateValuation(
          Completion.Full(),
          true),
        null),
      null)),
  false);

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Throw = require("./throw.js");

Assert.throws(
  Throw.DeadClosure("foo"),
  new global.Error(`Closure at foo is never supposed to be called, got: []`));
Assert.throws(
  () => Throw.abort(null, `foo`),
  new global.Error(`foo`));
Assert.throws(
  () => Throw.abort(Throw.InvalidOptionsAranError, `foo`),
  new Throw.InvalidOptionsAranError(`foo`));
Assert.deepEqual(
  Throw.assert(true, null, `foo`),
  true);
Assert.throws(
  () => Throw.assert(false, null, `foo`),
  new global.Error(`foo`));
Assert.deepEqual(
  Throw.inspect("foo"),
  `"foo"`);
Assert.deepEqual(
  Throw.inspect(null),
  "null");
Assert.deepEqual(
  Throw.inspect([1, 2, 3]),
  "[object Array]");

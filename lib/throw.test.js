"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Throw = require("./throw.js");

Assert.throws(
  () => Throw.abort(null, `foo`),
  new global.Error(`foo`));
Assert.throws(
  () => Throw.abort(Throw.MissingFeatureAranError, `foo`, `bar`),
  new Throw.MissingFeatureAranError(`foo`, `bar`));
Assert.throws(
  () => Throw.abort(Throw.InvalidArgumentAranError, `foo`),
  new Throw.InvalidArgumentAranError(`foo`));
Assert.deepEqual(
  Throw.assert(true, null, `foo`),
  true);
Assert.throws(
  () => Throw.assert(false, null, `foo`),
  new global.Error(`foo`));

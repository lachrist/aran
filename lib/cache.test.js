"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Variable = require("./variable.js");
const Cache = require("./cache.js");

const cache = Cache.make();

const node = {};

Cache.setSource(cache, node, "foo");
Assert.deepEqual(
  Cache.getSource(cache, node),
  "foo");

Cache.setUseStrictDirective(cache, node, true);
Assert.deepEqual(
  Cache.hasUseStrictDirective(cache, node),
  true);

Cache.setDirectEvalCall(cache, node, true);
Assert.deepEqual(
  Cache.hasDirectEvalCall(cache, node),
  true);

Cache.setHoisting(cache, node, [
  Variable.Var("x")]);
Assert.deepEqual(
  Cache.getHoisting(cache, node),
  [
    Variable.Var("x")]);

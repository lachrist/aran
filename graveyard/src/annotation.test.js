"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
const Annotation = require("./annotation.js");

const annotation = Annotation.make();

Assert.deepEqual(
  Annotation.setDirectEvalCall(annotation, true),
  void 0);

Assert.deepEqual(
  Annotation.hasDirectEvalCall(annotation),
  true);

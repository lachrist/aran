"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Source = require("./source.js");
const ExternalParser = require("./external-parser.js");

ExternalParser.parse(
  `import.meta;`,
  Source.make("module", false, null));

ExternalParser.parse(
  `new.target;`,
  Source.make("eval", true, {strict:false, mode:"function"}));

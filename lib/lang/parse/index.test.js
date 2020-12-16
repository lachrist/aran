"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Parse = require("./index.js");
const Tree = require("../../tree.js");

Assert.throws(
  () => Parse.parse_expression("%"));
Assert.deepEqual(
  Parse.parse_expression(`123`),
  Tree.primitive(123));

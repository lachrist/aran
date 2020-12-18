"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const ParseExternal = require("./parse-external.js");

ParseExternal(`import.meta;`, {source:"module"});
Assert.throws(
  () => ParseExternal(`delete foo;`, {source:"module"}),
  SyntaxError);

ParseExternal(`delete foo;`, {source:"script"});
Assert.throws(
  () => ParseExternal(`import.meta;`, {source:"script"}),
  SyntaxError);

ParseExternal(`new.target;`, {source:"eval", context:{"new-target":true}});
Assert.throws(
  () => ParseExternal(`new.target;`, {source:"eval"}),
  SyntaxError);

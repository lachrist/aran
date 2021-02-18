"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Esprima = require("./esprima.js");

const node1 = Esprima.wrap(require("esprima"), false)(
  ";",
  "script",
  {range:true, loc:true},
  null);

Assert.deepEqual(node1.type, "Program");
Assert.deepEqual(node1.range, [0, 1]);
Assert.deepEqual(node1.loc.start.line, 1);
Assert.deepEqual(node1.loc.start.column, 0);
Assert.deepEqual(node1.loc.end.line, 1);
Assert.deepEqual(node1.loc.end.column, 1);

Assert.deepEqual(node1.body.length, 1);

Assert.deepEqual(node1.body[0].type, "EmptyStatement");
Assert.deepEqual(node1.range, [0, 1]);
Assert.deepEqual(node1.body[0].loc.start.line, 1);
Assert.deepEqual(node1.body[0].loc.start.column, 0);
Assert.deepEqual(node1.body[0].loc.end.line, 1);
Assert.deepEqual(node1.body[0].loc.end.column, 1);

const node2 = Esprima.wrap(require("esprima"), true)(
  "{\n;\n\n}",
  "script",
  {range:true, loc:true},
  {
    range: {start:2, end:3},
    line: {start:1, end:2}});

node2.body = node2.body[0].body;

Assert.deepEqual(node2, node1);

const node3 = Esprima.wrap(require("esprima"), true)(";", "script", null, {range:{start:0, end:0}, line:{start:0, end:0}});

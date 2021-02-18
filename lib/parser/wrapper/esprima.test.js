"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Esprima = require("./esprima.js");

const node1 = Esprima.wrap(require("esprima"), false)(
  ";\n",
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
  " \n;\n  \n\n",
  "script",
  {range:true, loc:true},
  {
    range: {start:2, end:4},
    line: {start:1, end:2}});

Assert.deepEqual(node2, node1);

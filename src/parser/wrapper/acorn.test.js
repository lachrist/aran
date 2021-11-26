"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Acorn = require("./acorn.js");

const node1 = Acorn.wrap(require("acorn"), false)(
  ";\n",
  "script",
  {ranges:true, locations:true},
  null);

Assert.deepEqual(node1.type, "Program");
Assert.deepEqual(node1.start, 0);
Assert.deepEqual(node1.end, 2);
Assert.deepEqual(node1.range, [0, 2]);
Assert.deepEqual(node1.loc.start.line, 1);
Assert.deepEqual(node1.loc.start.column, 0);
Assert.deepEqual(node1.loc.end.line, 2);
Assert.deepEqual(node1.loc.end.column, 0);

Assert.deepEqual(node1.body.length, 1);

Assert.deepEqual(node1.body[0].type, "EmptyStatement");
Assert.deepEqual(node1.body[0].start, 0);
Assert.deepEqual(node1.body[0].end, 1);
Assert.deepEqual(node1.body[0].range, [0, 1]);
Assert.deepEqual(node1.body[0].loc.start.line, 1);
Assert.deepEqual(node1.body[0].loc.start.column, 0);
Assert.deepEqual(node1.body[0].loc.end.line, 1);
Assert.deepEqual(node1.body[0].loc.end.column, 1);

const node2 = Acorn.wrap(require("acorn"), true)(
  "{\n;\n\n}\n",
  "script",
  {ranges:true, locations:true},
  {
    range: {start:2, end:3},
    line: {start:1, end:2}});

node2.body = node2.body[0].body;

Assert.deepEqual(node2, node1);

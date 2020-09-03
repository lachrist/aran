"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
const Acorn = require("acorn");

const Query = require("./index.js");

const test = (code, hoisting) => Assert.deepEqual(
  Query._get_implicit_hoisting(
    Acorn.parse(code).body[0]),
  hoisting);

test(`function f () {}`, {__proto__:null});

test(
  `function f () { eval("foo"); }`,
  {
    __proto__: null,
    "f": true,
    "arguments": true,
    "this": false,
    "new.target": false});

test(`function f () { this; }`, {__proto__:null, "this":false});

test(`function f () { new.target; }`, {__proto__:null, "new.target":false});

test(`function f () { f; }`, {__proto__:null, "f":true});
test(`function f () { f = "foo"; }`, {__proto__:null, "f":true});

test(`function f () { arguments; }`, {__proto__:null, "arguments":true});
test(`function f () { arguments = "foo"; }`, {__proto__:null, "arguments":true});


"use strict";

const Assert = require("assert").strict;
const Acorn = require("acorn");
const Access = require("./access.js");

Error.stackTraceLimit = 1/0;

const default_access = {
  is_this_read: false,
  is_new_target_read: false,
  is_arguments_read: false,
  is_arguments_written: false,
  is_callee_read: false,
  is_callee_written: false
};

const test = (code, expected_access) => {
  expected_access = Object.assign({}, default_access, expected_access);
  const program = Acorn.parse(code);
  // console.dir(program, {depth:1/0});
  if (program.body.length !== 1) {
    throw new Error("Invalid program body length");
  }
  if (program.body[0].type === "ExpressionStatement") {
    Assert.deepEqual(Access(program.body[0].expression), expected_access);
  } else if (program.body[0].type === "FunctionDeclaration") {
    Assert.deepEqual(Access(program.body[0]), expected_access);
  } else {
    throw new Error("Invalid program body");
  }
};

// test("function f () {}", {});

/////////////
// Pattern //
/////////////

test(`function f () { arguments = 123; }`, {is_arguments_written:true});
test(`function f () { let arguments = 123; }`, {});
test(`function f () { var arguments = 123; }`, {});
test(`function f () { f = 123; }`, {is_callee_written:true});
test(`function f () { let f = 123; }`, {});
test(`function f () { var f = 123; }`, {});

test(`function f () { [f=123].foo = 456; }`, {is_callee_written:true});
test(`function f () { [f] = [123]; }`, {is_callee_written:true});
test(`function f () { [x, ...f] = [123]; }`, {is_callee_written:true});
test(`function f () { [,f] = [123]; }`, {is_callee_written:true});
test(`function f () { ({foo:f} = {foo:123}); }`, {is_callee_written:true});
test(`function f () { ({["foo"]:f} = {foo:123}); }`, {is_callee_written:true});
test(`function f () { ({["foo"]:f=123} = {foo:456}); }`, {is_callee_written:true});
test(`function f () { ({foo, ...f} = {foo:456}); }`, {is_callee_written:true});

/////////////////
// Expresssion //
/////////////////

test(`function f () { new.target; }`, {is_new_target_read:true});
// test(`function f () { import.meta; }`, {});
test(`function f () { this; }`, {is_this_read:true});
test(`function f () { arguments; }`, {is_arguments_read:true});
test(`function f () { f; }`, {is_callee_read:true});



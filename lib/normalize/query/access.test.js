
"use strict";

const Assert = require("assert").strict;
const Acorn = require("acorn");
const Access = require("./access.js");

Error.stackTraceLimit = 1/0;

const nope = {
  is_this_read: false,
  is_new_target_read: false,
  is_arguments_read: false,
  is_arguments_written: false,
  is_callee_read: false,
  is_callee_written: false
};

const test = (code, accesses) => {
  const expected = Object.assign({}, nope);
  accesses.forEach((access) => { expected[access] = true; });
  const program = Acorn.parse(code);
  // console.dir(program, {depth:1/0});
  if (program.body.length !== 1) {
    throw new Error("Invalid program body length");
  }
  if (program.body[0].type === "ExpressionStatement") {
    Assert.deepEqual(Access._access(program.body[0].expression), expected);
  } else if (program.body[0].type === "FunctionDeclaration") {
    Assert.deepEqual(Access._access(program.body[0]), expected);
  } else {
    throw new Error("Invalid program body");
  }
};

/////////
// Top //
/////////

test(`(function () {});`, []);
test(`function f () {}`, []);
test(`function f () { f; arguments; }`, ["is_callee_read", "is_arguments_read"]);
test(`function f (f, arguments) { f; arguments; }`, []);
test(`function f (f, ...arguments) { f; arguments; }`, []);
test(`function arguments () { arguments; }`, ["is_callee_read"]);
Assert.throws(() => Access._access({
  type: "DebuggerStatement"
}), new Error("Invalid input node"));

/////////////
// Pattern //
/////////////

test(`function f () { arguments = 123; }`, ["is_arguments_written"]);
test(`function f () { let arguments = 123; }`, []);
test(`function f () { var arguments = 123; }`, []);
test(`function f () { f = 123; }`, ["is_callee_written"]);
test(`function f () { let f = 123; }`, []);
test(`function f () { var f = 123; }`, []);

test(`function f () { [f=123].foo = 456; }`, ["is_callee_written"]);
test(`function f () { [f] = [123]; }`, ["is_callee_written"]);
test(`function f () { [x, ...f] = [123]; }`, ["is_callee_written"]);
test(`function f () { [,f] = [123]; }`, ["is_callee_written"]);
test(`function f () { ({foo:f} = {foo:123}); }`, ["is_callee_written"]);
test(`function f () { ({["foo"]:f} = {foo:123}); }`, ["is_callee_written"]);
test(`function f () { ({["foo"]:f=123} = {foo:456}); }`, ["is_callee_written"]);
test(`function f () { ({foo, ...f} = {foo:456}); }`, ["is_callee_written"]);

/////////////////
// Expresssion //
/////////////////

// Primitive //
test(`function f () { 123; }`, []);
// Environment //
test(`function f () { foo; }`, []);
test(`function f () { new.target; }`, ["is_new_target_read"]);
test(`function f () { this; }`, ["is_this_read"]);
test(`function f () { arguments; }`, ["is_arguments_read"]);
test(`function f () { f; }`, ["is_callee_read"]);
test(`function f () { f = 123; }`, ["is_callee_written"]);
test(`function f () { f++; }`, ["is_callee_written"]);
// Control //
test(`function f () { (f, this) }`, ["is_callee_read", "is_this_read"]);
test(`function f () { f && this; }`, ["is_callee_read", "is_this_read"]);
test(`function f () { f ? this : new.target; }`, ["is_callee_read", "is_this_read", "is_new_target_read"]);
// Operator //
test(`async function f () { await f; }`, ["is_callee_read"]);
test(`function * f () { yield f; }`, ["is_callee_read"]);
test(`function f () { !f; }`, ["is_callee_read"]);
test(`function f () { f + this; }`, ["is_callee_read", "is_this_read"]);
test(`function f () { f[this]; }`, ["is_callee_read", "is_this_read"]);
test(`function f () { f.this; }`, ["is_callee_read"]);
// Construction //
test(`function f () { (class {}); }`, []);
test(`function f () { (class extends f {}); }`, ["is_callee_read"]);
test(`function f () { (class { f () {} }); }`, []);
test(`function f () { (class { [f] () {} }); }`, ["is_callee_read"]);
test(`function f () { (class f { [f] () {} }); }`, []);
test(`function f () { \`foo\${f}bar\${this}qux\`; }`, ["is_callee_read", "is_this_read"]);
test(`function f () { f\`foobar\`; }`, ["is_callee_read"]);
test(`function f () { [f,, this, ...new.target]; }`, ["is_callee_read", "is_this_read", "is_new_target_read"]);
test(`function f () { ({f:123, [this]:456, ... new.target}); }`, ["is_this_read", "is_new_target_read"]);
test(`function f () { (function () {}); }`, ["is_callee_read", "is_callee_written"]);
test(`function f () { (() => { f; }); }`, ["is_callee_read"]);
test(`function f () { (() => f); }`, ["is_callee_read"]);
test(`function f () { ((f) => { f; }); }`, []);
test(`function f () { ((arguments) => { arguments; }); }`, []);
// Application //
test(`function f () { eval(123) }`, ["is_callee_read", "is_callee_written", "is_arguments_read", "is_arguments_written", "is_this_read", "is_new_target_read"]);
test(`function f () { eval(...123) }`, []);
test(`function f () { f(this, ...new.target) }`, ["is_callee_read", "is_this_read", "is_new_target_read"]);
test(`function f () { new f(this, ...new.target) }`, ["is_callee_read", "is_this_read", "is_new_target_read"]);
// Invalid //
Assert.throws(() => Access._access({
  type: "FunctionExpression",
  id: null,
  async: false,
  generator: false,
  params: [],
  body: {
    type: "BlockStatement",
    body: [{
      type: "ExpressionStatement",
      expression: {
        type: "ImportExpression",
        source: {
          type: "Literal",
          value: 123
        }
      }
    }]
  }
}), new Error("Invalid expression type"));

///////////////
// Statement //
///////////////

// Embedded //
test(`function f () { ; }`, []);
test(`function f () { f; }`, ["is_callee_read"]);
test(`function f () { return f; }`, ["is_callee_read"]);
test(`function f () { return; }`, []);
test(`function f () { throw f; }`, ["is_callee_read"]);
// Label //
test(`function f () { foo: f; }`, ["is_callee_read"]);
test(`function f () { foo: { break foo; } }`, []);
test(`function f () { foo: while (123) { continue foo; } }`, []);
// Blocks //
test(`function f () { { let f; f; this; } }`, ["is_this_read"]);
test(`function f () { { let f; f; this; } f; }`, ["is_this_read", "is_callee_read"]);
test(`function f () { if (arguments) { let f; f; this; } }`, ["is_arguments_read", "is_this_read"]);
test(`function f () { if (arguments) { let f; f; this; } else { let f; f; new.target } }`, ["is_arguments_read", "is_this_read", "is_new_target_read"]);
test(`function f () { while (arguments) { let f; f; this; } }`, ["is_arguments_read", "is_this_read"]);
test(`function f () { do { let f; f; this; } while (arguments); }`, ["is_arguments_read", "is_this_read"]);
test(`function f () { with (arguments) { let f; f; this; } }`, ["is_arguments_read", "is_this_read"]);
test(`function f () { try { f; } catch { this; } finally { new.target; } }`, ["is_callee_read", "is_this_read", "is_new_target_read"]);
test(`function f () { try { this; } finally { f; } }`, ["is_this_read", "is_callee_read"]);
test(`function f () { try { this; } catch (f) { f; } }`, ["is_this_read"]);
test(`function f () { try { this; } catch (f) { f; } f; }`, ["is_this_read", "is_callee_read"]);
test(`function f () { switch (f) {
  case arguments:
    this;
    new.target;
  default:;
} }`, ["is_callee_read", "is_arguments_read", "is_this_read", "is_new_target_read"])
// For Loops //
test(`function f () { for (let x = f; this; new.target) { arguments; } }`, ["is_callee_read", "is_arguments_read", "is_this_read", "is_new_target_read"]);
test(`function f () { for (f; this; new.target) { arguments; } }`, ["is_callee_read", "is_arguments_read", "is_this_read", "is_new_target_read"]);
test(`function f () { for (; this; new.target) { arguments; } }`, ["is_arguments_read", "is_this_read", "is_new_target_read"]);
test(`function f () { for (let x = f;; new.target) { arguments; } }`, ["is_callee_read", "is_arguments_read", "is_new_target_read"]);
test(`function f () { for (let x = f; this;) { arguments; } }`, ["is_callee_read", "is_arguments_read", "is_this_read"]);
test(`function f () { for (let f; f; f) { f; } }`, []);
test(`function f () { for (let f; f; f) { f; } f; }`, ["is_callee_read"]);
test(`function f () { for (let x in this) { new.target; } }`, ["is_this_read", "is_new_target_read"]);
test(`function f () { for (f in 123) { 456; } }`, ["is_callee_written"]);
test(`function f () { for (let f in 123) { f; } }`, []);
test(`function f () { for (let f in 123) { f; } f; }`, ["is_callee_read"]);
test(`function f () { for (let x of this) { new.target; } }`, ["is_this_read", "is_new_target_read"]);
test(`function f () { for (f of 123) { 456; } }`, ["is_callee_written"]);
test(`function f () { for (let f of 123) { f; } }`, []);
test(`function f () { for (let f of 123) { f; } f; }`, ["is_callee_read"]);
// Declaration //
test(`function f () { let x = f, y = this; }`, ["is_callee_read", "is_this_read"]);
test(`function f () { let f; f; }`, []);
test(`function f () { { let f; } f; }`, ["is_callee_read"]);
test(`function f () { { var f; } f; }`, []);
test(`function f () { function x () {}; }`, ["is_callee_read", "is_callee_written"]);
test(`function f () { { function f () {}; } f; }`, []);
test(`function f () { class x {} }`, []);
test(`function f () { class x extends f {} }`, ["is_callee_read"]);
test(`function f () { class x { f () {} } }`, []);
test(`function f () { class x { [f] () {} } }`, ["is_callee_read"]);
test(`function f () { class f { [f] () {} } }`, []);
test(`function f () { { class f { [f] () {} } f; } }`, []);
test(`function f () { { class f { [f] () {} } } f; }`, ["is_callee_read"]);
// Invalid //
Assert.throws(() => Access._access({
  type: "FunctionExpression",
  id: null,
  async: false,
  generator: false,
  params: [],
  body: {
    type: "BlockStatement",
    body: [{
      type: "FooBar",
    }]
  }
}), new Error("Invalid statement type"));


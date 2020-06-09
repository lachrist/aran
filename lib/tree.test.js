"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Tree = require("./tree.js");

const callbacks = {
  __proto__: null,
  // Block //
  BLOCK: () => { Assert.fail() },
  // Statement - Blockless //
  Lift: () => { Assert.fail() },
  Return: () => { Assert.fail() },
  Break: () => { Assert.fail() },
  Continue: () => { Assert.fail() },
  Debugger: () => { Assert.fail() },
  Bundle: () => { Assert.fail() },
  // Statement - Blockfull //
  Lone: () => { Assert.fail() },
  If: () => { Assert.fail() },
  While: () => { Assert.fail() },
  Try: () => { Assert.fail() },
  // Expression - Producers //
  primitive: () => { Assert.fail() },
  builtin: () => { Assert.fail() },
  arrow: () => { Assert.fail() },
  function: () => { Assert.fail() },
  read: () => { Assert.fail() },
  // Expression - Consumers //
  write: () => { Assert.fail() },
  sequence: () => { Assert.fail() },
  conditional: () => { Assert.fail() },
  throw: () => { Assert.fail() },
  eval: () => { Assert.fail() },
  // Expression - Combiners //
  apply: () => { Assert.fail() },
  construct: () => { Assert.fail() },
  unary: () => { Assert.fail() },
  binary: () => { Assert.fail() },
  object: () => { Assert.fail() }
};

////////////
// Syntax //
////////////
Tree._toggle_debug_mode();
// Primitive //
Tree.primitive(null);
Tree.primitive(void 0);
Tree.primitive(true);
Tree.primitive(false);
Tree.primitive(123);
Tree.primitive(123n);
Tree.primitive("foo");
Assert.throws(() => Tree.primitive(Symbol("foo")), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.primitive({}), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.primitive(() => {}), new Error("Invalid predicate-based atomic node"));
// Identifier //
Tree.read("foo");
Tree.read("ERROR");
Assert.throws(() => Tree.read(" foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.read("foo "), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.read("foo bar"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.read("0foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.read("in"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.read("eval"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.read(123), new Error("Invalid predicate-based atomic node"));
// Label //
Tree.Break("foo");
Tree.Break("ERROR");
Assert.throws(() => Tree.Break(" foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.Break("foo "), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.Break("foo bar"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.Break("0foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.Break("in"), new Error("Invalid predicate-based atomic node"));
Tree.Break("eval");
Assert.throws(() => Tree.Break(123), new Error("Invalid predicate-based atomic node"));
// Declarable //
Tree.BLOCK(["foo"], []);
Assert.throws(() => Tree.BLOCK(["ERROR"], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.BLOCK([" foo"], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.BLOCK(["foo "], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.BLOCK(["foo bar"], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.BLOCK(["0foo"], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Tree.BLOCK(["in"], []), new Error("Invalid predicate-based atomic node"));
Tree.Break("eval");
Assert.throws(() => Tree.Break(123), new Error("Invalid predicate-based atomic node"));

////////////////////////
// Build (Debug Mode) //
////////////////////////
Tree._toggle_debug_mode();
// Bundle //
Assert.deepEqual(Tree.BLOCK(["x", "y"], [
  Tree.Bundle([
    Tree.Break("k"),
    Tree.Bundle([
      Tree.Break("l"),
      Tree.Break("m"),
      Tree.Bundle([])
    ])
  ]),
  Tree.Bundle([
    Tree.Break("n")
  ])
]), Tree.BLOCK(["x", "y"], [
  Tree.Break("k"),
  Tree.Break("l"),
  Tree.Break("m"),
  Tree.Break("n")
]));
// Wrong number of fields //
Assert.throws(() => Tree.Debugger("foo"), new Error("Wrong number of fields"));
// Invalid node of predicate-based type //
Tree.primitive(123);
Assert.throws(() => Tree.primitive({__proto__:null}), new Error("Invalid predicate-based atomic node"));
// Invalid node of enumeration-based type //
Tree.builtin("global");
Assert.throws(() => Tree.builtin("foo"), new Error("Invalid enumeration-based atomic node"));
// Invalid node of identity-based type //
Tree.unary("!", Tree.primitive(123));
Assert.throws(() => Tree.unary("!", ["primitive", 123]), new Error("Invalid compound node"));
// List Node & Tuple Node //
Tree.object(Tree.primitive(null), [[Tree.primitive("foo"), Tree.primitive(123)], [Tree.primitive("bar"), Tree.primitive(456)]]);
Assert.throws(() => Tree.object(Tree.primitive(null), [[Tree.primitive("foo"), Tree.primitive(123), Tree.primitive("bar")]]), new Error("Length mismatch in array node"));
Assert.throws(() => Tree.object(Tree.primitive(null), [[Tree.primitive("foo"), Tree.primitive(123)], {__proto__:null, 0:Tree.primitive("bar"), 1:Tree.primitive(456)}]), new Error("Expected array node"));
// Block //
Tree.Lone([], Tree.BLOCK([], []));
// Immutable //
Assert.throws(() => Reflect.defineProperty(Tree.primitive(123), 0, {__proto__:null, value:"foo"}), new Error("defineProperty on immutable node"));
Assert.throws(() => Reflect.setPrototypeOf(Tree.primitive(123), null), new Error("setPrototypeOf on immutable node"));

//////////////////////////////////////
// Build (Normale Mode) && Dispatch //
//////////////////////////////////////
Tree._toggle_normal_mode();
// Block //
Assert.deepEqual(Tree._dispatch_block({
  __proto__: callbacks,
  BLOCK: (context, block, identifiers, statements) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(block, Tree.BLOCK(["x", "y"], [Tree.Break("l")]));
    Assert.deepEqual(identifiers, ["x", "y"]);
    Assert.deepEqual(statements, [Tree.Break("l")]);
    return "foo";
  }
}, "ctx", Tree.BLOCK(["x", "y"], [Tree.Break("l")])), "foo");
// Statement //
Assert.deepEqual(Tree._dispatch_statement({
  __proto__: callbacks,
  Debugger: (context, statement) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Tree.Debugger());
    return "foo";
  }
}, "ctx", Tree.Debugger()), "foo");
Assert.deepEqual(Tree._dispatch_statement({
  __proto__: callbacks,
  Break: (context, statement, label) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Tree.Break("l"));
    Assert.deepEqual(label, "l");
    return "foo";
  }
}, "ctx", Tree.Break("l")), "foo");
Assert.deepEqual(Tree._dispatch_statement({
  __proto__: callbacks,
  Lone: (context, statement, labels, block) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Tree.Lone(["k"], Tree.BLOCK([], [Tree.Break("l")])));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(block, Tree.BLOCK([], [Tree.Break("l")]));
    return "foo";
  }
}, "ctx", Tree.Lone(["k"], Tree.BLOCK([], [Tree.Break("l")]))), "foo");
Assert.deepEqual(Tree._dispatch_statement({
  __proto__: callbacks,
  While: (context, statement, labels, expression, block) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Tree.While(["k"], Tree.read("x"), Tree.BLOCK([], [Tree.Break("l")])));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(expression, Tree.read("x"));
    Assert.deepEqual(block, Tree.BLOCK([], [Tree.Break("l")]));
    return "foo";
  }
}, "ctx", Tree.While(["k"], Tree.read("x"), Tree.BLOCK([], [Tree.Break("l")]))), "foo");
Assert.deepEqual(Tree._dispatch_statement({
  __proto__: callbacks,
  If: (context, statement, labels, expression, block1, block2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Tree.If(["k"], Tree.read("x"), Tree.BLOCK([], [Tree.Break("l")]), Tree.BLOCK([], [Tree.Break("m")])));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(expression, Tree.read("x"));
    Assert.deepEqual(block1, Tree.BLOCK([], [Tree.Break("l")]));
    Assert.deepEqual(block2, Tree.BLOCK([], [Tree.Break("m")]));
    return "foo";
  }
}, "ctx", Tree.If(["k"], Tree.read("x"), Tree.BLOCK([], [Tree.Break("l")]), Tree.BLOCK([], [Tree.Break("m")]))), "foo");
// Expression //
Assert.deepEqual(Tree._dispatch_expression({
  __proto__: callbacks,
  read: (context, expression, identifier) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression, Tree.read("x"));
    Assert.deepEqual(identifier, "x");
    return "foo";
  }
}, "ctx", Tree.read("x")), "foo");
Assert.deepEqual(Tree._dispatch_expression({
  __proto__: callbacks,
  unary: (context, expression1, unary, expression2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression1, Tree.unary("!", Tree.read("x")));
    Assert.deepEqual(unary, "!");
    Assert.deepEqual(expression2, Tree.read("x"));
    return "foo";
  }
}, "ctx", Tree.unary("!", Tree.read("x"))), "foo");
Assert.deepEqual(Tree._dispatch_expression({
  __proto__: callbacks,
  binary: (context, expression1, binary, expression2, expression3) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression1, Tree.binary("+", Tree.read("x"), Tree.read("y")));
    Assert.deepEqual(binary, "+");
    Assert.deepEqual(expression2, Tree.read("x"));
    Assert.deepEqual(expression3, Tree.read("y"));
    return "foo";
  }
}, "ctx", Tree.binary("+", Tree.read("x"), Tree.read("y"))), "foo");

////////////
// Allign //
////////////
Tree._toggle_normal_mode();
Tree._allign_statement({
  __proto__: callbacks,
  __type_mismatch__: (context, node1, node2, type1, type2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(node1, Tree.Break("l"));
    Assert.deepEqual(node2, Tree.Continue("l"));
    Assert.deepEqual(type1, "Break");
    Assert.deepEqual(type2, "Continue");
  }
}, "ctx", Tree.Break("l"), Tree.Continue("l"));
Tree._allign_statement({
  __proto__: callbacks,
  __type_mismatch__: () => Assert.fail(),
  Break: (context, node1, node2, label1, label2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(node1, Tree.Break("k"));
    Assert.deepEqual(node2, Tree.Break("l"));
    Assert.deepEqual(label1, "k");
    Assert.deepEqual(label2, "l");
  }
}, "ctx", Tree.Break("k"), Tree.Break("l"));


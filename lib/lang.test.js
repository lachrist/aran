"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Lang = require("./lang.js");

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
Lang._toggle_debug_mode();
// Primitive //
Lang.primitive(null);
Lang.primitive(void 0);
Lang.primitive(true);
Lang.primitive(false);
Lang.primitive(123);
Lang.primitive(123n);
Lang.primitive("foo");
Assert.throws(() => Lang.primitive(Symbol("foo")), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.primitive({}), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.primitive(() => {}), new Error("Invalid predicate-based atomic node"));
// Identifier //
Lang.read("foo");
Lang.read("ERROR");
Assert.throws(() => Lang.read(" foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("foo "), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("foo bar"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("0foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("in"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("eval"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read(123), new Error("Invalid predicate-based atomic node"));
// Label //
Lang.Break("foo");
Lang.Break("ERROR");
Assert.throws(() => Lang.Break(" foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.Break("foo "), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.Break("foo bar"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.Break("0foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.Break("in"), new Error("Invalid predicate-based atomic node"));
Lang.Break("eval");
Assert.throws(() => Lang.Break(123), new Error("Invalid predicate-based atomic node"));
// Declarable //
Lang.BLOCK(["foo"], []);
Assert.throws(() => Lang.BLOCK(["ERROR"], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.BLOCK([" foo"], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.BLOCK(["foo "], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.BLOCK(["foo bar"], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.BLOCK(["0foo"], []), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.BLOCK(["in"], []), new Error("Invalid predicate-based atomic node"));
Lang.Break("eval");
Assert.throws(() => Lang.Break(123), new Error("Invalid predicate-based atomic node"));

////////////////////////
// Build (Debug Mode) //
////////////////////////
Lang._toggle_debug_mode();
// Bundle //
Assert.deepEqual(Lang.BLOCK(["x", "y"], [
  Lang.Bundle([
    Lang.Break("k"),
    Lang.Bundle([
      Lang.Break("l"),
      Lang.Break("m"),
      Lang.Bundle([])
    ])
  ]),
  Lang.Bundle([
    Lang.Break("n")
  ])
]), Lang.BLOCK(["x", "y"], [
  Lang.Break("k"),
  Lang.Break("l"),
  Lang.Break("m"),
  Lang.Break("n")
]));
// Wrong number of fields //
Assert.throws(() => Lang.Debugger("foo"), new Error("Wrong number of fields"));
// Invalid node of predicate-based type //
Lang.primitive(123);
Assert.throws(() => Lang.primitive({__proto__:null}), new Error("Invalid predicate-based atomic node"));
// Invalid node of enumeration-based type //
Lang.builtin("global");
Assert.throws(() => Lang.builtin("foo"), new Error("Invalid enumeration-based atomic node"));
// Invalid node of identity-based type //
Lang.unary("!", Lang.primitive(123));
Assert.throws(() => Lang.unary("!", ["primitive", 123]), new Error("Invalid compound node"));
// List Node & Tuple Node //
Lang.object(Lang.primitive(null), [[Lang.primitive("foo"), Lang.primitive(123)], [Lang.primitive("bar"), Lang.primitive(456)]]);
Assert.throws(() => Lang.object(Lang.primitive(null), [[Lang.primitive("foo"), Lang.primitive(123), Lang.primitive("bar")]]), new Error("Length mismatch in array node"));
Assert.throws(() => Lang.object(Lang.primitive(null), [[Lang.primitive("foo"), Lang.primitive(123)], {__proto__:null, 0:Lang.primitive("bar"), 1:Lang.primitive(456)}]), new Error("Expected array node"));
// Block //
Lang.Lone([], Lang.BLOCK([], []));
// Immutable //
Assert.throws(() => Reflect.defineProperty(Lang.primitive(123), 0, {__proto__:null, value:"foo"}), new Error("defineProperty on immutable node"));
Assert.throws(() => Reflect.setPrototypeOf(Lang.primitive(123), null), new Error("setPrototypeOf on immutable node"));

//////////////////////////////////////
// Build (Normale Mode) && Dispatch //
//////////////////////////////////////
Lang._toggle_normal_mode();
// Block //
Assert.deepEqual(Lang._dispatch_block({
  __proto__: callbacks,
  BLOCK: (context, block, identifiers, statements) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(block, Lang.BLOCK(["x", "y"], [Lang.Break("l")]));
    Assert.deepEqual(identifiers, ["x", "y"]);
    Assert.deepEqual(statements, [Lang.Break("l")]);
    return "foo";
  }
}, "ctx", Lang.BLOCK(["x", "y"], [Lang.Break("l")])), "foo");
// Statement //
Assert.deepEqual(Lang._dispatch_statement({
  __proto__: callbacks,
  Debugger: (context, statement) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Lang.Debugger());
    return "foo";
  }
}, "ctx", Lang.Debugger()), "foo");
Assert.deepEqual(Lang._dispatch_statement({
  __proto__: callbacks,
  Break: (context, statement, label) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Lang.Break("l"));
    Assert.deepEqual(label, "l");
    return "foo";
  }
}, "ctx", Lang.Break("l")), "foo");
Assert.deepEqual(Lang._dispatch_statement({
  __proto__: callbacks,
  Lone: (context, statement, labels, block) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Lang.Lone(["k"], Lang.BLOCK([], [Lang.Break("l")])));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(block, Lang.BLOCK([], [Lang.Break("l")]));
    return "foo";
  }
}, "ctx", Lang.Lone(["k"], Lang.BLOCK([], [Lang.Break("l")]))), "foo");
Assert.deepEqual(Lang._dispatch_statement({
  __proto__: callbacks,
  While: (context, statement, labels, expression, block) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Lang.While(["k"], Lang.read("x"), Lang.BLOCK([], [Lang.Break("l")])));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(expression, Lang.read("x"));
    Assert.deepEqual(block, Lang.BLOCK([], [Lang.Break("l")]));
    return "foo";
  }
}, "ctx", Lang.While(["k"], Lang.read("x"), Lang.BLOCK([], [Lang.Break("l")]))), "foo");
Assert.deepEqual(Lang._dispatch_statement({
  __proto__: callbacks,
  If: (context, statement, labels, expression, block1, block2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Lang.If(["k"], Lang.read("x"), Lang.BLOCK([], [Lang.Break("l")]), Lang.BLOCK([], [Lang.Break("m")])));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(expression, Lang.read("x"));
    Assert.deepEqual(block1, Lang.BLOCK([], [Lang.Break("l")]));
    Assert.deepEqual(block2, Lang.BLOCK([], [Lang.Break("m")]));
    return "foo";
  }
}, "ctx", Lang.If(["k"], Lang.read("x"), Lang.BLOCK([], [Lang.Break("l")]), Lang.BLOCK([], [Lang.Break("m")]))), "foo");
// Expression //
Assert.deepEqual(Lang._dispatch_expression({
  __proto__: callbacks,
  read: (context, expression, identifier) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression, Lang.read("x"));
    Assert.deepEqual(identifier, "x");
    return "foo";
  }
}, "ctx", Lang.read("x")), "foo");
Assert.deepEqual(Lang._dispatch_expression({
  __proto__: callbacks,
  unary: (context, expression1, unary, expression2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression1, Lang.unary("!", Lang.read("x")));
    Assert.deepEqual(unary, "!");
    Assert.deepEqual(expression2, Lang.read("x"));
    return "foo";
  }
}, "ctx", Lang.unary("!", Lang.read("x"))), "foo");
Assert.deepEqual(Lang._dispatch_expression({
  __proto__: callbacks,
  binary: (context, expression1, binary, expression2, expression3) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression1, Lang.binary("+", Lang.read("x"), Lang.read("y")));
    Assert.deepEqual(binary, "+");
    Assert.deepEqual(expression2, Lang.read("x"));
    Assert.deepEqual(expression3, Lang.read("y"));
    return "foo";
  }
}, "ctx", Lang.binary("+", Lang.read("x"), Lang.read("y"))), "foo");

////////////
// Allign //
////////////
Lang._toggle_normal_mode();
Lang._allign({
  __proto__: callbacks,
  __type_mismatch__: (context, node1, node2, type1, type2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(node1, Lang.Break("l"));
    Assert.deepEqual(node2, Lang.Continue("l"));
    Assert.deepEqual(type1, "Break");
    Assert.deepEqual(type2, "Continue");
  }
}, "ctx", Lang.Break("l"), Lang.Continue("l"));
Lang._allign({
  __proto__: callbacks,
  __type_mismatch__: () => Assert.fail(),
  Break: (context, node1, node2, label1, label2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(node1, Lang.Break("k"));
    Assert.deepEqual(node2, Lang.Break("l"));
    Assert.deepEqual(label1, "k");
    Assert.deepEqual(label2, "l");
  }
}, "ctx", Lang.Break("k"), Lang.Break("l"));


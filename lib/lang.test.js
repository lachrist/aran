
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Lang = require("./lang.js");
const Parser = require("../test/parser/index.js");

////////////
// Syntax //
////////////

Lang._toggle_debug_mode();
// Primitive //
Assert.deepEqual(Lang.primitive(null), Parser.parse("null"));
Assert.deepEqual(Lang.primitive(void 0), Parser.parse("void 0"));
Assert.deepEqual(Lang.primitive(true), Parser.parse("true"));
Assert.deepEqual(Lang.primitive(false), Parser.parse("false"));
Assert.deepEqual(Lang.primitive(123), Parser.parse("123"));
Assert.deepEqual(Lang.primitive(123n), Parser.parse("123n"));
Assert.deepEqual(Lang.primitive("foo"), Parser.parse("\"foo\""));
Assert.throws(() => Lang.primitive(Symbol("foo")), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.primitive({}), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.primitive(() => {}), new Error("Invalid predicate-based atomic node"));
// Identifier //
Assert.deepEqual(Lang.read("foo"), Parser.parse("foo"));
Assert.throws(() => Lang.read(" foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("foo "), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("foo bar"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("0foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("in"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read("eval"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.read(123), new Error("Invalid predicate-based atomic node"));
// Label //
Assert.deepEqual(Lang.Break("foo"), Parser.Parse("break foo;"));
Assert.throws(() => Lang.Break(" foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.Break("foo "), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.Break("foo bar"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.Break("0foo"), new Error("Invalid predicate-based atomic node"));
Assert.throws(() => Lang.Break("in"), new Error("Invalid predicate-based atomic node"));
Assert.deepEqual(Lang.Break("eval"), Parser.Parse("break eval;"));
Assert.throws(() => Lang.Break(123), new Error("Invalid predicate-based atomic node"));

/////////////////////////
// Build (Normal Mode) //
/////////////////////////

Lang._toggle_normal_mode();
// Block //
Assert.deepEqual(Lang.BLOCK(["x", "y"], [Lang.Break("l")]), Parser.PARSE("{ let x, y; break l; }"));
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
]), Parser.PARSE("{ let x, y; break k; break l; break m; break n; }"));
// Statement //
Assert.deepEqual(Lang.Debugger(), Parser.Parse("debugger;"));
Assert.deepEqual(Lang.Break("l"), Parser.Parse("break l;"));
Assert.deepEqual(Lang.Lone(["l", "m"], Lang.BLOCK(["x", "y"], [Lang.Break("l")])), Parser.Parse("l: m: { let x, y; break l; }"));
Assert.deepEqual(Lang.While(["l", "m"], Lang.read("x"), Lang.BLOCK(["y", "z"], [Lang.Break("l")])), Parser.Parse("l: m: while (x) { let y, z; break l; }"));
Assert.deepEqual(Lang.If(["l", "m"], Lang.read("x"), Lang.BLOCK(["y"], [Lang.Break("l")]), Lang.BLOCK(["z"], [Lang.Break("m")])), Parser.Parse("l: m: if (x) { let y; break l; } else { let z; break m; }"));
// Expression //
Assert.deepEqual(Lang.read("x"), Parser.parse("x"));
Assert.deepEqual(Lang.write("x", Lang.read("y")), Parser.parse("(x = y)"));
Assert.deepEqual(Lang.conditional(Lang.read("x"), Lang.read("y"), Lang.read("z")), Parser.parse("(x ? y : z)"));

////////////////////////
// Build (Debug Mode) //
////////////////////////
Lang._toggle_debug_mode();
// Wrong number of fields //
Assert.throws(() => Lang.Debugger("foo"), new Error("Wrong number of fields"));
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
]), Parser.PARSE("{ let x, y; break k; break l; break m; break n; }"));
// Invalid node of predicate-based type //
Assert.deepEqual(Lang.primitive(123), Parser.parse("123"));
Assert.throws(() => Lang.primitive({__proto__:null}), new Error("Invalid predicate-based atomic node"));
// Invalid node of enumeration-based type //
Assert.deepEqual(Lang.builtin("global"), Parser.parse("#global"));
Assert.throws(() => Lang.builtin("foo"), new Error("Invalid enumeration-based atomic node"));
// Invalid node of identity-based type //
Assert.deepEqual(Lang.unary("!", Lang.primitive(123)), Parser.parse("!123"));
Assert.throws(() => Lang.unary("!", ["primitive", 123]), new Error("Invalid compound node"));
// List Node & Tuple Node //
Assert.deepEqual(Lang.object(Lang.primitive(null), [[Lang.primitive("foo"), Lang.primitive(123)], [Lang.primitive("bar"), Lang.primitive(456)]]), Parser.parse("{__proto__:null, foo:123, bar:456}"));
Assert.throws(() => Lang.object(Lang.primitive(null), [[Lang.primitive("foo"), Lang.primitive(123), Lang.primitive("bar")]]), new Error("Length mismatch in array node"));
Assert.throws(() => Lang.object(Lang.primitive(null), [[Lang.primitive("foo"), Lang.primitive(123)], {__proto__:null, 0:Lang.primitive("bar"), 1:Lang.primitive(456)}]), new Error("Expected array node"));
// Block //
Assert.deepEqual(Lang.Lone([], Lang.BLOCK([], [])), Parser.Parse("{}"));
// Immutable //
Assert.throws(() => Reflect.defineProperty(Lang.primitive(123), 0, {__proto__:null, value:"foo"}), new Error("defineProperty on immutable node"));
Assert.throws(() => Reflect.setPrototypeOf(Lang.primitive(123), null), new Error("setPrototypeOf on immutable node"));

//////////////
// Dispatch //
//////////////

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

// Block //
Assert.deepEqual(Lang._dispatch_block(Parser.PARSE("{ let x, y; break l; }"), "ctx", {
  __proto__: callbacks,
  BLOCK: (context, block, identifiers, statements) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(block, Parser.PARSE("{ let x, y; break l; }"));
    Assert.deepEqual(identifiers, ["x", "y"]);
    Assert.deepEqual(statements, [Parser.Parse("break l;")]);
    return "foo";
  }
}), "foo");
// Statement //
Assert.deepEqual(Lang._dispatch_statement(Parser.Parse("debugger;"), "ctx", {
  __proto__: callbacks,
  Debugger: (context, statement) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Parser.Parse("debugger;"));
    return "foo";
  }
}), "foo");
Assert.deepEqual(Lang._dispatch_statement(Parser.Parse("break l;"), "ctx", {
  __proto__: callbacks,
  Break: (context, statement, label) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Parser.Parse("break l;"));
    Assert.deepEqual(label, "l");
    return "foo";
  }
}), "foo");
Assert.deepEqual(Lang._dispatch_statement(Parser.Parse("k:{break l;}"), "ctx", {
  __proto__: callbacks,
  Lone: (context, statement, labels, block) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Parser.Parse("k:{break l;}"));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(block, Parser.PARSE("{break l;}"));
    return "foo";
  }
}), "foo");
Assert.deepEqual(Lang._dispatch_statement(Parser.Parse("k: while (x) {break l;}"), "ctx", {
  __proto__: callbacks,
  While: (context, statement, labels, expression, block) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Parser.Parse("k: while (x) {break l;}"));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(expression, Parser.parse("x"));
    Assert.deepEqual(block, Parser.PARSE("{break l;}"));
    return "foo";
  }
}), "foo");
Assert.deepEqual(Lang._dispatch_statement(Parser.Parse("k: if (x) {break l;} else {break m;}"), "ctx", {
  __proto__: callbacks,
  If: (context, statement, labels, expression, block1, block2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(statement, Parser.Parse("k: if (x) {break l;} else {break m;}"));
    Assert.deepEqual(labels, ["k"]);
    Assert.deepEqual(expression, Parser.parse("x"));
    Assert.deepEqual(block1, Parser.PARSE("{break l;}"));
    Assert.deepEqual(block2, Parser.PARSE("{break m;}"));
    return "foo";
  }
}), "foo");
// Expression //
Assert.deepEqual(Lang._dispatch_expression(Parser.parse("x"), "ctx", {
  __proto__: callbacks,
  read: (context, expression, identifier) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression, Parser.parse("x"));
    Assert.deepEqual(identifier, "x");
    return "foo";
  }
}), "foo");
Assert.deepEqual(Lang._dispatch_expression(Parser.parse("!x"), "ctx", {
  __proto__: callbacks,
  unary: (context, expression1, unary, expression2) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression1, Parser.parse("!x"));
    Assert.deepEqual(unary, "!");
    Assert.deepEqual(expression2, Parser.parse("x"));
    return "foo";
  }
}), "foo");
Assert.deepEqual(Lang._dispatch_expression(Parser.parse("x + y"), "ctx", {
  __proto__: callbacks,
  binary: (context, expression1, binary, expression2, expression3) => {
    Assert.deepEqual(context, "ctx");
    Assert.deepEqual(expression1, Parser.parse("x + y"));
    Assert.deepEqual(binary, "+");
    Assert.deepEqual(expression2, Parser.parse("x"));
    Assert.deepEqual(expression3, Parser.parse("y"));
    return "foo";
  }
}), "foo");

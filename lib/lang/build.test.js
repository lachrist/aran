"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
const Build = require("./build.js");
const Parser = require("../../test/parser/index.js");

/////////////////
// Normal Mode //
/////////////////

// Block //
Assert.deepEqual(Build.BLOCK(["x", "y"], Build.Break("l")), Parser.PARSE("{ let x, y; break l; }"));
// Statement //
Assert.deepEqual(Build.Debugger(), Parser.Parse("debugger;"));
Assert.deepEqual(Build.Break("l"), Parser.Parse("break l;"));
Assert.deepEqual(Build.Lone(["l", "m"], Build.BLOCK(["x", "y"], Build.Break("l"))), Parser.Parse("l: m: { let x, y; break l; }"));
Assert.deepEqual(Build.While(["l", "m"], Build.read("x"), Build.BLOCK(["y", "z"], Build.Break("l"))), Parser.Parse("l: m: while (x) { let y, z; break l; }"));
Assert.deepEqual(Build.If(["l", "m"], Build.read("x"), Build.BLOCK(["y"], Build.Break("l")), Build.BLOCK(["z"], Build.Break("m"))), Parser.Parse("l: m: if (x) { let y; break l; } else { let z; break m; }"));
// Expression //
Assert.deepEqual(Build.read("x"), Parser.parse("x"));
Assert.deepEqual(Build.write("x", Build.read("y")), Parser.parse("(x = y)"));
Assert.deepEqual(Build.conditional(Build.read("x"), Build.read("y"), Build.read("z")), Parser.parse("(x ? y : z)"));

////////////////
// Debug Mode //
////////////////
Build._switch_debug_mode();
// Wrong number of fields //
Assert.throws(() => Build.Debugger("foo"), new Error("Wrong number of fields"));
// Invalid node of predicate-based type //
Assert.deepEqual(Build.primitive(123), Parser.parse("123"));
Assert.throws(() => Build.primitive({__proto__:null}), new Error("Invalid node of predicate-based type"));
// Invalid node of enumeration-based type //
Assert.deepEqual(Build.builtin("global"), Parser.parse("#global"));
Assert.throws(() => Build.builtin("foo"), new Error("Invalid node of enumeration-based type"));
// Invalid node of identity-based type //
Assert.deepEqual(Build.unary("!", Build.primitive(123)), Parser.parse("!123"));
Assert.throws(() => Build.unary("!", ["primitive", 123]), new Error("Invalid node of identity-based type"));
// List Node & Tuple Node //
Assert.deepEqual(Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123)], [Build.primitive("bar"), Build.primitive(456)]]), Parser.parse("{__proto__:null, foo:123, bar:456}"));
Assert.throws(() => Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123), Build.primitive("bar")]]), new Error("Length mismatch in array node"));
Assert.throws(() => Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123)], {__proto__:null, 0:Build.primitive("bar"), 1:Build.primitive(456)}]), new Error("Expected array node"));
// Block //
Assert.deepEqual(Build.Lone([], Build.BLOCK([], [])), Parser.Parse("{}"));
// Immutable //
Assert.throws(() => Reflect.defineProperty(Build.primitive(123), 0, {__proto__:null, value:"foo"}), new Error("defineProperty on immutable node"));
Assert.throws(() => Reflect.setPrototypeOf(Build.primitive(123), null), new Error("setPrototypeOf on immutable node"));

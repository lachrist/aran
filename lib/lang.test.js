
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

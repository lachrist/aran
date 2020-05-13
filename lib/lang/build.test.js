"use strict";

const Assert = require("assert").strict;
const Build = require("./build.js");

/////////////////
// Normal Mode //
/////////////////
// Block //
Assert.deepEqual(Build.BLOCK(["x", "y"], Build.Break("l")), ["BLOCK", ["x", "y"], [["Break", "l"]]]);
// Statement //
Assert.deepEqual(Build.Debugger(), [["Debugger"]]);
Assert.deepEqual(Build.Break("l"), [["Break", "l"]]);
Assert.deepEqual(Build.Lone(["l", "m"], Build.BLOCK(["x", "y"], Build.Break("l"))), [["Lone", ["l", "m"], ["BLOCK", ["x", "y"], [["Break", "l"]]]]]);
Assert.deepEqual(Build.While(["l", "m"], Build.read("x"), Build.BLOCK(["y", "z"], Build.Break("l"))), [["While", ["l", "m"], ["read", "x"], ["BLOCK", ["y", "z"], [["Break", "l"]]]]]);
Assert.deepEqual(Build.If(["l", "m"], Build.read("x"), Build.BLOCK(["y"], Build.Break("l")), Build.BLOCK(["z"], Build.Break("m"))), [["If", ["l", "m"], ["read", "x"], ["BLOCK", ["y"], [["Break", "l"]]], ["BLOCK", ["z"], [["Break", "m"]]]]]);
// Expression //
Assert.deepEqual(Build.read("x"), ["read", "x"]);
Assert.deepEqual(Build.write("x", Build.read("y")), ["write", "x",  ["read", "y"]]);
Assert.deepEqual(Build.conditional(Build.read("x"), Build.read("y"), Build.read("z")), ["conditional", ["read", "x"], ["read", "y"], ["read", "z"]]);

////////////////
// Debug Mode //
////////////////
Build._debug_mode();
// Wrong number of fields //
Assert.throws(() => Build.Debugger("foo"), new Error("Wrong number of fields"));
// Invalid node of predicate-based type //
Assert.deepEqual(Build.primitive(123), ["primitive", 123]);
Assert.throws(() => Build.primitive({__proto__:null}), new Error("Invalid node of predicate-based type"));
// Invalid node of enumeration-based type //
Assert.deepEqual(Build.builtin("global"), ["builtin", "global"]);
Assert.throws(() => Build.builtin("foo"), new Error("Invalid node of enumeration-based type"));
// Invalid node of identity-based type //
Assert.deepEqual(Build.unary("!", Build.primitive(123)), ["unary", "!", ["primitive", 123]]);
Assert.throws(() => Build.unary("!", ["primitive", 123]), new Error("Invalid node of identity-based type"));
// List Node & Tuple Node //
Assert.deepEqual(Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123)], [Build.primitive("bar"), Build.primitive(456)]]), ["object", ["primitive", null], [[["primitive", "foo"], ["primitive", 123]], [["primitive", "bar"], ["primitive", 456]]]]);
Assert.throws(() => Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123), Build.primitive("bar")]]), new Error("Length mismatch in array node"));
Assert.throws(() => Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123)], {__proto__:null, 0:Build.primitive("bar"), 1:Build.primitive(456)}]), new Error("Expected array node"));
// Block //
Assert.deepEqual(Build.Lone([], Build.BLOCK([], [])), [["Lone", [], ["BLOCK", [], []]]]);
// Immutable //
Assert.throws(() => Reflect.defineProperty(Build.primitive(123), 0, {__proto__:null, value:"foo"}), new Error("defineProperty on immutable node"));
Assert.throws(() => Reflect.setPrototypeOf(Build.primitive(123), null), new Error("setPrototypeOf on immutable node"));

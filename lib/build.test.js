
const Tap = require("tap");
const Build = require("./build.js");

Tap.strictSame(Build.Debugger(), ["Debugger"]);
Tap.strictSame(Build.read("foo"), ["read", "foo"]);
Tap.strictSame(Build.write("foo", "bar"), ["write", "foo", "bar"]);
Tap.strictSame(Build.conditional("foo", "bar", "qux"), ["conditional", "foo", "bar", "qux"]);
Tap.strictSame(Build.If("foo", "bar", "qux", "taz"), ["If", "foo", "bar", "qux", "taz"]);

Build._debug_mode();
// Wrong number of fields //
Tap.throws(() => Build.Debugger("foo"), new Error("Wrong number of fields"));
// Invalid node of predicate-based type //
Tap.strictSame(Build.primitive(123), ["primitive", 123]);
Tap.throws(() => Build.primitive({__proto__:null}), new Error("Invalid node of predicate-based type"));
// Invalid node of enumeration-based type //
Tap.strictSame(Build.builtin("global"), ["builtin", "global"]);
Tap.throws(() => Build.builtin("foo"), new Error("Invalid node of enumeration-based type"));
// Invalid node of identity-based type //
Tap.strictSame(Build.unary("!", Build.primitive(123)), ["unary", "!", ["primitive", 123]]);
Tap.throws(() => Build.unary("!", ["primitive", 123]), new Error("Invalid node of identity-based type"));
// List Node & Tuple Node //
Tap.strictSame(Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123)], [Build.primitive("bar"), Build.primitive(456)]]), ["object", ["primitive", null], [[["primitive", "foo"], ["primitive", 123]], [["primitive", "bar"], ["primitive", 456]]]]);
Tap.throws(() => Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123), Build.primitive("bar")]]), new Error("Length mismatch in array node"));
Tap.throws(() => Build.object(Build.primitive(null), [[Build.primitive("foo"), Build.primitive(123)], {__proto__:null, 0:Build.primitive("bar"), 1:Build.primitive(456)}]), new Error("Expected array node"));
// Block //
Tap.strictSame(Build.Lone([], Build.BLOCK([], [])), ["Lone", [], ["BLOCK", [], []]]);
// Immutable //
Tap.throws(() => Reflect.defineProperty(Build.primitive(123), 0, {__proto__:null, value:"foo"}), new Error("defineProperty on immutable node"));
Tap.throws(() => Reflect.setPrototypeOf(Build.primitive(123), null), new Error("setPrototypeOf on immutable node"));

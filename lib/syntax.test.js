const Tap = require("tap");
const Syntax = require("./syntax.js");

Tap.strictEqual(Syntax.primitive(null), true);
Tap.strictEqual(Syntax.primitive(void 0), true);
Tap.strictEqual(Syntax.primitive(true), true);
Tap.strictEqual(Syntax.primitive(false), true);
Tap.strictEqual(Syntax.primitive(123), true);
Tap.strictEqual(Syntax.primitive(123n), true);
Tap.strictEqual(Syntax.primitive("foo"), true);
Tap.strictEqual(Syntax.primitive(Symbol("foo")), false);
Tap.strictEqual(Syntax.primitive({}), false);
Tap.strictEqual(Syntax.primitive(() => {}), false);

Tap.strictEqual(Syntax.identifier("foo"), true);
Tap.strictEqual(Syntax.identifier(" foo"), false);
Tap.strictEqual(Syntax.identifier("foo "), false);
Tap.strictEqual(Syntax.identifier("foo bar"), false);
Tap.strictEqual(Syntax.identifier("0foo"), false);
Tap.strictEqual(Syntax.identifier("eval"), false);
Tap.strictEqual(Syntax.identifier(123), false);

Tap.strictEqual(Syntax.label("foo"), true);
Tap.strictEqual(Syntax.label(" foo"), false);
Tap.strictEqual(Syntax.label("foo "), false);
Tap.strictEqual(Syntax.label("foo bar"), false);
Tap.strictEqual(Syntax.label("0foo"), false);
Tap.strictEqual(Syntax.label("eval"), true);
Tap.strictEqual(Syntax.label(123), false);

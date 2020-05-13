"use strict";

const Assert = require("assert").strict;
const Syntax = require("./syntax.js");

Assert.equal(Syntax.primitive(null), true);
Assert.equal(Syntax.primitive(void 0), true);
Assert.equal(Syntax.primitive(true), true);
Assert.equal(Syntax.primitive(false), true);
Assert.equal(Syntax.primitive(123), true);
Assert.equal(Syntax.primitive(123n), true);
Assert.equal(Syntax.primitive("foo"), true);
Assert.equal(Syntax.primitive(Symbol("foo")), false);
Assert.equal(Syntax.primitive({}), false);
Assert.equal(Syntax.primitive(() => {}), false);

Assert.equal(Syntax.identifier("foo"), true);
Assert.equal(Syntax.identifier(" foo"), false);
Assert.equal(Syntax.identifier("foo "), false);
Assert.equal(Syntax.identifier("foo bar"), false);
Assert.equal(Syntax.identifier("0foo"), false);
Assert.equal(Syntax.identifier("eval"), false);
Assert.equal(Syntax.identifier(123), false);

Assert.equal(Syntax.label("foo"), true);
Assert.equal(Syntax.label(" foo"), false);
Assert.equal(Syntax.label("foo "), false);
Assert.equal(Syntax.label("foo bar"), false);
Assert.equal(Syntax.label("0foo"), false);
Assert.equal(Syntax.label("eval"), true);
Assert.equal(Syntax.label(123), false);

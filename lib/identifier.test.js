"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Identifier = require("./identifier.js");

//////////
// Base //
//////////

Assert.deepEqual(Identifier.IsBase(Identifier.Base("foo")), true);
Assert.deepEqual(Identifier.IsMeta(Identifier.Base("foo")), false);
Assert.deepEqual(Identifier.GetBody(Identifier.Base("foo")), "foo");

Assert.deepEqual(Identifier.IsBase(Identifier.Base("this")), true);
Assert.deepEqual(Identifier.IsMeta(Identifier.Base("this")), false);
Assert.deepEqual(Identifier.GetBody(Identifier.Base("this")), "this");

Assert.deepEqual(Identifier.IsBase(Identifier.Base("new.target")), true);
Assert.deepEqual(Identifier.IsMeta(Identifier.Base("new.target")), false);
Assert.deepEqual(Identifier.GetBody(Identifier.Base("new.target")), "new.target");

Assert.deepEqual(Identifier.IsBase(Identifier.Base(null)), true);
Assert.deepEqual(Identifier.IsMeta(Identifier.Base(null)), false);
Assert.deepEqual(Identifier.GetBody(Identifier.Base(null)), null);

//////////
// Meta //
//////////

Assert.deepEqual(Identifier.IsBase(Identifier.Meta("foo")), false);
Assert.deepEqual(Identifier.IsMeta(Identifier.Meta("foo")), true);
Assert.deepEqual(Identifier.GetBody(Identifier.Meta("foo")), "foo");

Assert.deepEqual(Identifier.IsBase(Identifier.Meta("this")), false);
Assert.deepEqual(Identifier.IsMeta(Identifier.Meta("this")), true);
Assert.deepEqual(Identifier.GetBody(Identifier.Meta("this")), "this");

Assert.deepEqual(Identifier.IsBase(Identifier.Meta("new.target")), false);
Assert.deepEqual(Identifier.IsMeta(Identifier.Meta("new.target")), true);
Assert.deepEqual(Identifier.GetBody(Identifier.Meta("new.target")), "new.target");

Assert.deepEqual(Identifier.IsBase(Identifier.Meta(null)), false);
Assert.deepEqual(Identifier.IsMeta(Identifier.Meta(null)), true);
Assert.deepEqual(Identifier.GetBody(Identifier.Meta(null)), null);

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Identifier = require("./identifier.js");

//////////
// Base //
//////////

Assert.deepEqual(Identifier._is_base(Identifier._base("foo")), true);
Assert.deepEqual(Identifier._is_meta(Identifier._base("foo")), false);
Assert.deepEqual(Identifier._get_body(Identifier._base("foo")), "foo");

Assert.deepEqual(Identifier._is_base(Identifier._base("this")), true);
Assert.deepEqual(Identifier._is_meta(Identifier._base("this")), false);
Assert.deepEqual(Identifier._get_body(Identifier._base("this")), "this");

Assert.deepEqual(Identifier._is_base(Identifier._base("new.target")), true);
Assert.deepEqual(Identifier._is_meta(Identifier._base("new.target")), false);
Assert.deepEqual(Identifier._get_body(Identifier._base("new.target")), "new.target");

Assert.deepEqual(Identifier._is_base(Identifier._base(null)), true);
Assert.deepEqual(Identifier._is_meta(Identifier._base(null)), false);
Assert.deepEqual(Identifier._get_body(Identifier._base(null)), null);

//////////
// Meta //
//////////

Assert.deepEqual(Identifier._is_base(Identifier._meta("foo")), false);
Assert.deepEqual(Identifier._is_meta(Identifier._meta("foo")), true);
Assert.deepEqual(Identifier._get_body(Identifier._meta("foo")), "foo");

Assert.deepEqual(Identifier._is_base(Identifier._meta("this")), false);
Assert.deepEqual(Identifier._is_meta(Identifier._meta("this")), true);
Assert.deepEqual(Identifier._get_body(Identifier._meta("this")), "this");

Assert.deepEqual(Identifier._is_base(Identifier._meta("new.target")), false);
Assert.deepEqual(Identifier._is_meta(Identifier._meta("new.target")), true);
Assert.deepEqual(Identifier._get_body(Identifier._meta("new.target")), "new.target");

Assert.deepEqual(Identifier._is_base(Identifier._meta(null)), false);
Assert.deepEqual(Identifier._is_meta(Identifier._meta(null)), true);
Assert.deepEqual(Identifier._get_body(Identifier._meta(null)), null);

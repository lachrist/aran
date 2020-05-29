
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Stratum = require("./stratum.js");

//////////
// Base //
//////////

Assert.deepEqual(Stratum._is_base(Stratum._base("foo")), true);
Assert.deepEqual(Stratum._is_meta(Stratum._base("foo")), false);
Assert.deepEqual(Stratum._get_body(Stratum._base("foo")), "foo");

Assert.deepEqual(Stratum._is_base(Stratum._base("this")), true);
Assert.deepEqual(Stratum._is_meta(Stratum._base("this")), false);
Assert.deepEqual(Stratum._get_body(Stratum._base("this")), "this");

Assert.deepEqual(Stratum._is_base(Stratum._base("new.target")), true);
Assert.deepEqual(Stratum._is_meta(Stratum._base("new.target")), false);
Assert.deepEqual(Stratum._get_body(Stratum._base("new.target")), "new.target");

//////////
// Meta //
//////////

Assert.deepEqual(Stratum._is_base(Stratum._meta("foo")), false);
Assert.deepEqual(Stratum._is_meta(Stratum._meta("foo")), true);
Assert.deepEqual(Stratum._get_body(Stratum._meta("foo")), "foo");

Assert.deepEqual(Stratum._is_base(Stratum._meta("this")), false);
Assert.deepEqual(Stratum._is_meta(Stratum._meta("this")), true);
Assert.deepEqual(Stratum._get_body(Stratum._meta("this")), "this");

Assert.deepEqual(Stratum._is_base(Stratum._meta("new.target")), false);
Assert.deepEqual(Stratum._is_meta(Stratum._meta("new.target")), true);
Assert.deepEqual(Stratum._get_body(Stratum._meta("new.target")), "new.target");

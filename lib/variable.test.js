"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Variable = require("./variable.js");

//////////
// Base //
//////////

Assert.deepEqual(Variable.IsBase(Variable.Base("foo")), true);
Assert.deepEqual(Variable.IsMeta(Variable.Base("foo")), false);
Assert.deepEqual(Variable.GetBody(Variable.Base("foo")), "foo");

Assert.deepEqual(Variable.IsBase(Variable.Base("this")), true);
Assert.deepEqual(Variable.IsMeta(Variable.Base("this")), false);
Assert.deepEqual(Variable.GetBody(Variable.Base("this")), "this");

Assert.deepEqual(Variable.IsBase(Variable.Base("new.target")), true);
Assert.deepEqual(Variable.IsMeta(Variable.Base("new.target")), false);
Assert.deepEqual(Variable.GetBody(Variable.Base("new.target")), "new.target");

Assert.deepEqual(Variable.IsBase(Variable.Base(null)), true);
Assert.deepEqual(Variable.IsMeta(Variable.Base(null)), false);
Assert.deepEqual(Variable.GetBody(Variable.Base(null)), null);

//////////
// Meta //
//////////

Assert.deepEqual(Variable.IsBase(Variable.Meta("foo")), false);
Assert.deepEqual(Variable.IsMeta(Variable.Meta("foo")), true);
Assert.deepEqual(Variable.GetBody(Variable.Meta("foo")), "foo");

Assert.deepEqual(Variable.IsBase(Variable.Meta("this")), false);
Assert.deepEqual(Variable.IsMeta(Variable.Meta("this")), true);
Assert.deepEqual(Variable.GetBody(Variable.Meta("this")), "this");

Assert.deepEqual(Variable.IsBase(Variable.Meta("new.target")), false);
Assert.deepEqual(Variable.IsMeta(Variable.Meta("new.target")), true);
Assert.deepEqual(Variable.GetBody(Variable.Meta("new.target")), "new.target");

Assert.deepEqual(Variable.IsBase(Variable.Meta(null)), false);
Assert.deepEqual(Variable.IsMeta(Variable.Meta(null)), true);
Assert.deepEqual(Variable.GetBody(Variable.Meta(null)), null);

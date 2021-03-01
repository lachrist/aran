"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Identifier = require("./identifier.js");

//////////////
// Variable //
//////////////

Assert.deepEqual(Identifier.isBase(Identifier.makeBase("foo")), true);
Assert.deepEqual(Identifier.isMeta(Identifier.makeBase("foo")), false);
Assert.deepEqual(Identifier.getBody(Identifier.makeBase("foo")), "foo");

Assert.deepEqual(Identifier.isBase(Identifier.makeBase("new.target")), true);
Assert.deepEqual(Identifier.isMeta(Identifier.makeBase("new.target")), false);
Assert.deepEqual(Identifier.getBody(Identifier.makeBase("new.target")), "new.target");

Assert.deepEqual(Identifier.isBase(Identifier.makeMeta("foo")), false);
Assert.deepEqual(Identifier.isMeta(Identifier.makeMeta("foo")), true);
Assert.deepEqual(Identifier.getBody(Identifier.makeMeta("foo")), "foo");

///////////
// Label //
///////////

for (const type11 of ["Full", "Empty"]) {
  for (const type12 of ["Break", "Continue"]) {
    Assert.deepEqual(Identifier.getBody(Identifier[`make${type11}${type12}`]("foo")), "foo");
    for (const type21 of ["Full", "Empty"]) {
      for (const type22 of ["Break", "Continue"]) { 
        Assert.deepEqual(Identifier[`is${type11}`](Identifier[`make${type21}${type22}`]("foo")), type11 === type21);
        Assert.deepEqual(Identifier[`is${type12}`](Identifier[`make${type21}${type22}`]("foo")), type12 === type22);
      }
    }
  }
}

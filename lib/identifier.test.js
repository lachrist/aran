"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Identifier = require("./identifier.js");

//////////////
// Variable //
//////////////

Assert.deepEqual(Identifier.isBase(Identifier.getBase("foo")), true);
Assert.deepEqual(Identifier.isMeta(Identifier.getBase("foo")), false);
Assert.deepEqual(Identifier.getBody(Identifier.getBase("foo")), "foo");

Assert.deepEqual(Identifier.isBase(Identifier.getBase("new.target")), true);
Assert.deepEqual(Identifier.isMeta(Identifier.getBase("new.target")), false);
Assert.deepEqual(Identifier.getBody(Identifier.getBase("new.target")), "new.target");

Assert.deepEqual(Identifier.isBase(Identifier.makeMeta("foo")), false);
Assert.deepEqual(Identifier.isMeta(Identifier.makeMeta("foo")), true);
Assert.deepEqual(Identifier.getBody(Identifier.makeMeta("foo")), "foo");

///////////
// Label //
///////////

for (const type11 of ["Full", "Empty"]) {
  for (const type12 of ["Break", "Continue"]) {
    Assert.deepEqual(Identifier.GetBody(Identifier[`${type11}${type12}`]("foo")), "foo");
    for (const type21 of ["Full", "Empty"]) {
      for (const type22 of ["Break", "Continue"]) { 
        Assert.deepEqual(Identifier[`Is${type11}`](Identifier[`${type21}${type22}`]("foo")), type11 === type21);
        Assert.deepEqual(Identifier[`Is${type12}`](Identifier[`${type21}${type22}`]("foo")), type12 === type22);
      }
    }
  }
}

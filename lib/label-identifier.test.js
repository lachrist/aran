"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Label = require("./label.js");

for (const type11 of ["Full", "Empty"]) {
  for (const type12 of ["Break", "Continue"]) {
    Assert.deepEqual(Label.GetBody(Label[`${type11}${type12}`]("foo")), "foo");
    for (const type21 of ["Full", "Empty"]) {
      for (const type22 of ["Break", "Continue"]) { 
        Assert.deepEqual(Label[`Is${type11}`](Label[`${type21}${type22}`]("foo")), type11 === type21);
        Assert.deepEqual(Label[`Is${type12}`](Label[`${type21}${type22}`]("foo")), type12 === type22);
      }
    }
  }
}

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Label = require("./label.js");

for (const type11 of ["full", "empty"]) {
  for (const type12 of ["break", "continue"]) {
    Assert.deepEqual(Label._get_body(Label[`_make_${type11}_${type12}`]("foo")), "foo");
    for (const type21 of ["full", "empty"]) {
      for (const type22 of ["break", "continue"]) {
        Assert.deepEqual(Label[`_is_${type11}`](Label[`_make_${type21}_${type22}`]("foo")), type11 === type21);
        Assert.deepEqual(Label[`_is_${type12}`](Label[`_make_${type21}_${type22}`]("foo")), type12 === type22);
      }
    }
  }
}


// const Test = require("./live/shadow-state-check-2.js");
// Test("foo");

"use strict";

function f () {
  eval("var x = 123");
  return x;
}

console.log(f());
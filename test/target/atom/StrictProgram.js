"use strict";
let f = function () {
  if (this !== undefined)
    throw new Error("Strict");
}
f();
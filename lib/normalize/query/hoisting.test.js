
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Hoisting = require("./hoisting.js");
const Acorn = require("acorn");

////////////
// _param //
////////////

const test_param = (code, identifiers) => {
  const hoisting = {__proto__:null};
  identifiers.forEach((identifier) => { hoisting[identifier] = true });
  Assert.deepEqual(Hoisting._get_param_hoisting({__proto__:null}, Acorn.parse("(" + code + " = 123);").body[0].expression.left, true), hoisting);
};

test_param(`[x = 1]`, ["x"]);
test_param(`[x1,, x2,, x3,, ...xs]`, ["x1", "x2", "x3", "xs"]);
test_param(`{a:x, b:y, ...o}`, ["x", "y", "o"]);

//////////////
// _shallow //
//////////////

const test_shallow = (code, identifiers1, identifiers2) => {
  const hoisting = {__proto__:null};
  identifiers1.forEach((identifier) => { hoisting[identifier] = true });
  identifiers2.forEach((identifier) => { hoisting[identifier] = false });
  Assert.deepEqual(Hoisting._get_shallow_hoisting({__proto__:null}, Acorn.parse(code).body), hoisting);
};

test_shallow(`
  f();
  let [x1, x2, x3] = "foo", [x4, x5, x6] = "bar";
  const [y1, y2, y3] = "foo", [y4, y5, y6] = "bar"
  for (let z in o) {}
  class C {}
`, ["x1", "x2", "x3", "x4", "x5", "x6", "C"], ["y1", "y2", "y3", "y4", "y5", "y6"]);

///////////
// _deep //
///////////

const test_deep = (code, identifiers) => {
  const hoisting = {__proto__:null};
  identifiers.forEach((identifier) => { hoisting[identifier] = true });
  Assert.deepEqual(Hoisting._get_deep_hoisting({__proto__:null}, Acorn.parse(code).body), hoisting);
};

test_deep(`var x = 1, y = 2, z = 3;`, ["x", "y", "z"]);
test_deep(`123;`, []);
test_deep(`function f () { var x = 1; }`, ["f"]);
test_deep(`{ var x = 1; }`, ["x"]);
test_deep(`foo: { var x = 1; }`, ["x"]);
test_deep(`if (123) { var x = 1; }`, ["x"]);
test_deep(`if (123) { var x = 1; } else { var y = 2; }`, ["x", "y"]);
test_deep(`while (123) { var x = 1; }`, ["x"]);
test_deep(`do { var x = 1; } while (123);`, ["x"]);
test_deep(`try { var x = 1; } catch { var y = 2; } finally { var z = 3 }`, ["x", "y", "z"]);
test_deep(`try { var x = 1; } finally { var z = 3 }`, ["x", "z"]);
test_deep(`try { var x = 1; } catch { var y = 2; }`, ["x", "y"]);
test_deep(`for (; 456; 789) { var y = 1 }`, ["y"]);
test_deep(`for (123; 456; 789) { var y = 1 }`, ["y"]);
test_deep(`for (let x = 123; 456; 789) { var y = 1 }`, ["y"]);
test_deep(`for (var x = 123; 456; 789) { var y = 1 }`, ["x", "y"]);
test_deep(`for (x in o) { var y = 1 }`, ["y"]);
test_deep(`for (let x in o) { var y = 1 }`, ["y"]);
test_deep(`for (var x in o) { var y = 1 }`, ["x", "y"]);
test_deep(`for (x of o) { var y = 1 }`, ["y"]);
test_deep(`for (let x of o) { var y = 1 }`, ["y"]);
test_deep(`for (var x of o) { var y = 1 }`, ["x", "y"]);
test_deep(`switch (123) {
  case 456: var x = 1;
  case 789: var y = 2;
  default: var z = 3;
}`, ["x", "y", "z"]);

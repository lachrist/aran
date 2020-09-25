"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Hoisting = require("./hoisting.js");
const Acorn = require("acorn");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

////////////
// _param //
////////////

{
  const test = (code, identifiers) => {
    const hoisting = {__proto__:null};
    identifiers.forEach((identifier) => { hoisting[identifier] = true });
    Assert.deepEqual(
      Hoisting._get_parameter_hoisting(
        parse("(" + code + " = 123);").body[0].expression.left),
      hoisting);
  };
  test(`[x = 1]`, ["x"]);
  test(`[x1,, x2,, x3,, ...xs]`, ["x1", "x2", "x3", "xs"]);
  test(`{a:x, b:y, ...o}`, ["x", "y", "o"]);
}

///////////////////////////////////
// _get_parameter_array_hoisting //
///////////////////////////////////

{
  const test = (codes, identifiers) => {
    const hoisting = {__proto__:null};
    identifiers.forEach((identifier) => { hoisting[identifier] = true });
    Assert.deepEqual(
      Hoisting._get_parameter_array_hoisting(
        codes.map(
          (code) => parse(`([${code}] = 123);`).body[0].expression.left.elements[0])),
      hoisting);
  };
  test([`x1 = 1`, `x2 = 2`, `...xs`], ["x1", "x2", "xs"]);
}

//////////////
// _shallow //
//////////////

{
  const test = (code, identifiers1, identifiers2) => {
    const hoisting = {__proto__:null};
    identifiers1.forEach((identifier) => { hoisting[identifier] = true });
    identifiers2.forEach((identifier) => { hoisting[identifier] = false });
    Assert.deepEqual(
      Hoisting._get_shallow_hoisting(
        parse(code).body),
      hoisting);
  };
  test(`
    f();
    let [x1, x2, x3] = "foo", [x4, x5, x6] = "bar";
    const [y1, y2, y3] = "foo", [y4, y5, y6] = "bar"
    for (let z in o) {}
    class C {}
  `, ["x1", "x2", "x3", "x4", "x5", "x6", "C"], ["y1", "y2", "y3", "y4", "y5", "y6"]);
}

///////////
// _deep //
///////////

{
  const test = (code, identifiers) => {
    const hoisting = {__proto__:null};
    identifiers.forEach((identifier) => { hoisting[identifier] = true });
    Assert.deepEqual(
      Hoisting._get_deep_hoisting(
        parse(code).body),
      hoisting);
  };
  test(`var x = 1, y = 2, z = 3;`, ["x", "y", "z"]);
  test(`123;`, []);
  test(`function f () { var x = 1; }`, ["f"]);
  test(`{ var x = 1; }`, ["x"]);
  test(`foo: { var x = 1; }`, ["x"]);
  test(`if (123) { var x = 1; }`, ["x"]);
  test(`if (123) { var x = 1; } else { var y = 2; }`, ["x", "y"]);
  test(`while (123) { var x = 1; }`, ["x"]);
  test(`do { var x = 1; } while (123);`, ["x"]);
  test(`try { var x = 1; } catch { var y = 2; } finally { var z = 3 }`, ["x", "y", "z"]);
  test(`try { var x = 1; } finally { var z = 3 }`, ["x", "z"]);
  test(`try { var x = 1; } catch { var y = 2; }`, ["x", "y"]);
  test(`for (; 456; 789) { var y = 1 }`, ["y"]);
  test(`for (123; 456; 789) { var y = 1 }`, ["y"]);
  test(`for (let x = 123; 456; 789) { var y = 1 }`, ["y"]);
  test(`for (var x = 123; 456; 789) { var y = 1 }`, ["x", "y"]);
  test(`for (x in o) { var y = 1 }`, ["y"]);
  test(`for (let x in o) { var y = 1 }`, ["y"]);
  test(`for (var x in o) { var y = 1 }`, ["x", "y"]);
  test(`for (x of o) { var y = 1 }`, ["y"]);
  test(`for (let x of o) { var y = 1 }`, ["y"]);
  test(`for (var x of o) { var y = 1 }`, ["x", "y"]);
  test(`switch (123) {
    case 456: var x = 1;
    case 789: var y = 2;
    default: var z = 3;
  }`, ["x", "y", "z"]);
}

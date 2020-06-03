"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Other = require("./other.js");
const Acorn = require("acorn");

////////////////////
// _is_use_strict //
////////////////////

Assert.deepEqual(Other._is_use_strict(Acorn.parse(`
  "foo";
  "bar";
  "use strict";
`).body), true);
Assert.deepEqual(Other._is_use_strict(Acorn.parse(`
  "foo";
  "bar";
`).body), false);
Assert.deepEqual(Other._is_use_strict(Acorn.parse(`
  123;
  "use strict";
`).body), false);
Assert.deepEqual(Other._is_use_strict(Acorn.parse(`
  f();
  "use strict";
`).body), false);
Assert.deepEqual(Other._is_use_strict(Acorn.parse(`
  debugger;
  "use strict";
`).body), false);

//////////////////////////////////////////////////////////////
// _is_function_declaration && _is_not_function_declaration //
//////////////////////////////////////////////////////////////

Assert.deepEqual(Other._is_function_declaration(Acorn.parse(`function f () {}`).body[0]), true);
Assert.deepEqual(Other._is_function_declaration(Acorn.parse(`123;`).body[0]), false);
Assert.deepEqual(Other._is_not_function_declaration(Acorn.parse(`function f () {}`).body[0]), false);
Assert.deepEqual(Other._is_not_function_declaration(Acorn.parse(`123;`).body[0]), true);

///////////////////////
// is_spread_element //
///////////////////////

Assert.deepEqual(Other._is_spread_element(Acorn.parse(`f(...xs);`).body[0].expression.arguments[0]), true);
Assert.deepEqual(Other._is_spread_element(Acorn.parse(`f(x);`).body[0].expression.arguments[0]), false);

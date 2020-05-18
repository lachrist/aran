
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Other = require("./other.js");
const Acorn = require("acorn");

////////////////////
// _is_use_strict //
////////////////////

Assert.equal(Other._is_use_strict(Acorn.parse(`
  "foo";
  "bar";
  "use strict";
`).body), true);
Assert.equal(Other._is_use_strict(Acorn.parse(`
  "foo";
  "bar";
`).body), false);
Assert.equal(Other._is_use_strict(Acorn.parse(`
  123;
  "use strict";
`).body), false);
debugger;
Assert.equal(Other._is_use_strict(Acorn.parse(`
  f();
  "use strict";
`).body), false);
Assert.equal(Other._is_use_strict(Acorn.parse(`
  debugger;
  "use strict";
`).body), false);

//////////////////////////
// _is_direct_eval_call //
//////////////////////////

Assert.equal(Other._is_direct_eval_call(Acorn.parse(`
  eval(x, y, z);
`).body[0].expression), true);
Assert.equal(Other._is_direct_eval_call(Acorn.parse(`
  eval(x, ...xs);
`).body[0].expression), false);
Assert.equal(Other._is_direct_eval_call(Acorn.parse(`
  f(x, y, z);
`).body[0].expression), false);
Assert.equal(Other._is_direct_eval_call(Acorn.parse(`
  o.m(x, y, z);
`).body[0].expression), false);
Assert.equal(Other._is_direct_eval_call(Acorn.parse(`
  123;
`).body[0].expression), false);

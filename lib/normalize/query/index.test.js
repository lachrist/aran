
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Query = require("./index.js");
const Acorn = require("acorn");

////////////////////
// _is_use_strict //
////////////////////

Assert.equal(Query._is_use_strict(Acorn.parse(`
  "foo";
  "bar";
  "use strict";
`).body), true);
Assert.equal(Query._is_use_strict(Acorn.parse(`
  "foo";
  "bar";
`).body), false);
Assert.equal(Query._is_use_strict(Acorn.parse(`
  123;
  "use strict";
`).body), false);
debugger;
Assert.equal(Query._is_use_strict(Acorn.parse(`
  f();
  "use strict";
`).body), false);
Assert.equal(Query._is_use_strict(Acorn.parse(`
  debugger;
  "use strict";
`).body), false);

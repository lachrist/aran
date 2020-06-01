
"use strict";

Error.stackTraceLimit = 1/0;

const Assert = require("assert").strict;
const Valuation = require("./valuation.js");
const Acorn = require("acorn");

Valuation._get_valuation(Acorn.parse(`let x = 1;`).body[0], false);
Valuation._get_valuation(Acorn.parse(`debugger;`).body[0], false);
Valuation._get_valuation(Acorn.parse(`function f () {}`).body[0], false);
Valuation._get_valuation(Acorn.parse(`;`).body[0], false);
Valuation._get_valuation(Acorn.parse(`class C {};`).body[0], false);
Valuation._get_valuation(Acorn.parse(`123;`).body[0], true);
Valuation._get_valuation(Acorn.parse(`{; 123; }`).body[0], true);
Valuation._get_valuation(Acorn.parse(`{;;}`).body[0], false);
Valuation._get_valuation(Acorn.parse(`l: break l;`).body[0].body, "l");
Valuation._get_valuation(Acorn.parse(`l: break l;`).body[0], false);
Valuation._get_valuation(Acorn.parse(`l: k : break l;`).body[0].body, "l");
Valuation._get_valuation(Acorn.parse(`while (123) break;`).body[0].body, null);

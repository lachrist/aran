"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Valuation = require("./valuation.js");
const Acorn = require("acorn");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

Valuation._get_valuation(parse(`let x = 1;`).body[0], false);
Valuation._get_valuation(parse(`debugger;`).body[0], false);
Valuation._get_valuation(parse(`function f () {}`).body[0], false);
Valuation._get_valuation(parse(`;`).body[0], false);
Valuation._get_valuation(parse(`class C {};`).body[0], false);
Valuation._get_valuation(parse(`123;`).body[0], true);
Valuation._get_valuation(parse(`{; 123; }`).body[0], true);
Valuation._get_valuation(parse(`{;;}`).body[0], false);
Valuation._get_valuation(parse(`l: break l;`).body[0].body, "l");
Valuation._get_valuation(parse(`l: break l;`).body[0], false);
Valuation._get_valuation(parse(`l: k : break l;`).body[0].body, "l");
Valuation._get_valuation(parse(`while (123) break;`).body[0].body, null);

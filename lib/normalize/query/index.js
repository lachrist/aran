
"use strict";

// type Statement = estree.Statement
// type Property = estree.Property

const ArrayLite = require("array-lite");

const Access = require("./access.js");
const Eval = require("./eval.js");
const Hoisting = require("./hoisting.js");
const Other = require("./other.js");
const Valuation = require("./valuation.js");

const global_Object_assign = global.Object.assign;

global_Object_assign(exports, Access, Eval, Hoisting, Other, Valuation);

"use strict";

const Acorn = require("./acorn.js");
const Esprima = require("./esprima.js");

exports.wrapAcorn = Acorn.wrap;

exports.wrapEsprima = Esprima.wrap;

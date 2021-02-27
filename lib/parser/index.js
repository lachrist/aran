"use strict";

const Wrapper = require("./wrapper");
const Parser = require("./parser");

exports.wrapAcorn = Wrapper.wrapAcorn;
exports.wrapEsprima = Wrapper.wrapEsprima;

exports.parse = Parser.parse;

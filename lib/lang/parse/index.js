"use strict";

const Parser = require("./parser.js");

exports.expression = (string) => Parser.parse(string, {startRule:"StartExpression"});

exports.Statement = (string) => Parser.parse(string, {startRule:"StartStatement"});

exports.BLOCK = (string) => (console.log("\n\n\n\n\n" + string),Parser.parse(string, {startRule:"StartBlock"}));
// (console.log("\n\n\n\n\n" + string),

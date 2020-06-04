"use strict";

const Parser = require("./parser.js");

exports.parse = (string) => Parser.parse(string, {startRule:"StartExpression"});

exports.Parse = (string) => Parser.parse(string, {startRule:"StartStatement"});

exports.PARSE = (string) => Parser.parse(string, {startRule:"StartBlock"});

"use strict";

const Generate = require("./generate.js");
const Parse = require("./parse/index.js");

exports.PARSE_BLOCK = Parse.BLOCK;
exports.ParseStatement = Parse.Statement;
exports.parse_expression = Parse.expression;

exports._generate_expression = Generate._expression;
exports._generate_statement = Generate._statement;
exports._generate_block = Generate._block;

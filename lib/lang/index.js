"use strict";

const Generate = require("./generate.js");
const Parse = require("./parse/index.js");
const Match = require("./match.js");
const Acorn = require("acorn");

exports._parse_program = Parse._program;
exports._parse_prelude = Parse._prelude;
exports.PARSE_BLOCK = Parse.BLOCK;
exports.ParseStatement = Parse.Statement;
exports.parse_expression = Parse.expression;

exports._generate_program = Generate._program;
exports._generate_prelude = Generate._prelude;
exports._generate_expression = Generate._expression;
exports._generate_statement = Generate._statement;
exports._generate_block = Generate._block;

exports._match_program = Match._program;
exports._match_prelude = Match._prelude;
exports._match_expression = Match._expression;
exports._match_statement = Match._statement;
exports._match_block = Match._block;

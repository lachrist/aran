"use strict";

const Parser = require("./parser.js");

const common = (rule) => (string) => {
  try {
    return Parser.parse(string, {startRule:rule})
  } catch (error) {
    console.log(string);
    throw error;
  }
}

exports._parse_program = common("StartProgram");

exports._parse_prelude = common("StartPrelude");

exports.PARSE_BLOCK = common("StartBlock");

exports.ParseStatement = common("StartStatement");

exports.parse_expression = common("StartExpression");

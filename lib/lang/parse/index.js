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

exports._program = common("StartProgram");

exports._prelude = common("StartPrelude");

exports.BLOCK = common("StartBlock");

exports.Statement = common("StartStatement");

exports.expression = common("StartExpression");

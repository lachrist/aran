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

exports.expression = common("StartExpression");

exports.Statement = common("StartStatement");

exports.BLOCK = common("StartBlock");
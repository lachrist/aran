// pegjs --allowed-start-rules StartBlock,StartStatement,StartExpression parser.pegjs

const Parser = require("./parser.js");

exports.expression = (string) => Parser.parse(string, {startRule:"StartExpression"});

exports.Statement = (string) => Parser.parse(string, {startRule:"StartStatement"});

exports.BLOCK = (string) => Parser.parse(string, {startRule:"StartBlock"});

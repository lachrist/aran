
const Block = require("./block.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");

exports.block = (block) => Block[block[0]](block);
exports.expression = (expression) => Expression[expression[0]](expression);
exports.statement = (statement) => Statement[statement[0]](statement);

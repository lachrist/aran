
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

exports.expression = (array, trap) => Expression[array[0]](array, trap);
exports.Statement = (array, trap) => Statement[array[0]](array, trap);
exports.BLOCK = (array, trap, tag, labels) => Block[array[0]](array, trap, tag, labels);


const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

exports.expression = (array, namespace) => Expression[array[0]](array, namespace);
exports.statement = (array, namespace) => Statement[array[0]](array, namespace);
exports.block = (array, namespace, tag) => Block[array[0]](array, namespace, tag);

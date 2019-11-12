
const Visitors = require("./visitors");

exports.BLOCK = (block, options) => Visitors.block[block[0]](block, options);
exports.Statement = (statement, options) => Visitors.statement[statement[0]](statement, options);
exports.expression = (expression, options) => Visitors.expression[expression[0]](expression, options);

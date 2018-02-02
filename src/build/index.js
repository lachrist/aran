
// Optimizations:
//   - object["key"] -> object.key
//   - (identifier, expression) -> expression
//   - { statement1 identifier; statement2 } -> { statement1 statement2 }

exports.String = require("./string.js");
exports.Estree = require("./estree.js");
exports.EstreeValid = require("./estree-valid");

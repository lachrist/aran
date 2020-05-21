
const ArrayLite = require("array-lite");

module.exports = (aran_node, callbacks) => {
  if (aran_node[0] in Syntax.expression) {
    if (Syntax.expression[aran_expression[0]].length === 1) {
      return callbacks[aran_expression[0]](aran_expression[1]);
    }
    if (Syntax.expression[aran_expression[0]].length === 2) {
      return callbacks[aran_expression[0]](aran_expression[1], aran_expression[2]);
    }
    // console.assert(Syntax.expression[aran_expression[0]].length ===  3);
    return callbacks[aran_expression[0]](aran_expression[1], aran_expression[2], aran_expression[3]);
  }
  if (aran_node[0] in Syntax.statement) {
    if (Syntax.expression[aran_statement[0]].length === 0) {
      return callbacks[aran_statement[0]](aran_statement[1]);
    }
    if (Syntax.expression[aran_statement[0]].length === 1) {
      return callbacks[aran_statement[0]](aran_statement[1]);
    }
    if (Syntax.expression[aran_statement[0]].length === 2) {
      return callbacks[aran_statement[0]](aran_statement[1], aran_statement[2]);
    }
    if (Syntax.expression[aran_statement[0]].length === 3) {
      return callbacks[aran_statement[0]](aran_statement[1], aran_statement[2], aran_statement[3]);
    }
    // console.assert(Syntax.expression[aran_expression[0]].length ===  4);
    return callbacks[aran_statement[0]](aran_statement[1], aran_statement[2], aran_statement[3], aran_statement[4]);
  }
  // console.assert(aran_node[0] === "BLOCK");
  return callbacks.BLOCK(aran_node[1], aran_node[2]);
};

exports.expression = (aran_expression, callbacks) => {
  if (Syntax.expression[aran_expression[0]].length === 1) {
    return callbacks[aran_expression[0]](aran_expression[1]);
  }
  if (Syntax.expression[aran_expression[0]].length === 2) {
    return callbacks[aran_expression[0]](aran_expression[1], aran_expression[2]);
  }
  // console.assert(Syntax.expression[aran_expression[0]].length ===  3);
  return callbacks[aran_expression[0]](aran_expression[1], aran_expression[2], aran_expression[3]);
};

exports.statement = (aran_statement, callbacks) => {
  if (Syntax.expression[aran_statement[0]].length === 0) {
    return callbacks[aran_statement[0]](aran_statement[1]);
  }
  if (Syntax.expression[aran_statement[0]].length === 1) {
    return callbacks[aran_statement[0]](aran_statement[1]);
  }
  if (Syntax.expression[aran_statement[0]].length === 2) {
    return callbacks[aran_statement[0]](aran_statement[1], aran_statement[2]);
  }
  if (Syntax.expression[aran_statement[0]].length === 3) {
    return callbacks[aran_statement[0]](aran_statement[1], aran_statement[2], aran_statement[3]);
  }
  // console.assert(Syntax.expression[aran_expression[0]].length ===  4);
  return callbacks[aran_statement[0]](aran_statement[1], aran_statement[2], aran_statement[3], aran_statement[4]);
};

exports.block = (aran_block, callback) => callback(aran_block[1], aran_block[2]);


const Syntax = require("./syntax.js");
const ArrayLite = require("array-lite");

// type Expression = lang.syntax.Expression
// type Statement = lang.syntax.Statement
// type Block = lang.syntax.Block
// type Context = *
// type Callbacks = *

// exports._node = (callbacks, context, node) => {
//   if (node[0] in Syntax.expression) {
//     if (Syntax.expression[node[0]].length === 1) {
//       return callbacks[node[0]](context, node, node[1]);
//     }
//     if (Syntax.expression[node[0]].length === 2) {
//       return callbacks[node[0]](context, node, node[1], node[2]);
//     }
//     // console.assert(Syntax.expression[expression[0]].length ===  3);
//     return callbacks[node[0]](context, node, node[1], node[2], node[3]);
//   }
//   if (node[0] in Syntax.statement) {
//     if (Syntax.statement[node[0]].length === 0) {
//       return callbacks[node[0]](context, node, node[1]);
//     }
//     if (Syntax.statement[node[0]].length === 1) {
//       return callbacks[node[0]](context, node, node[1]);
//     }
//     if (Syntax.statement[node[0]].length === 2) {
//       return callbacks[node[0]](context, node, node[1], node[2]);
//     }
//     if (Syntax.statement[node[0]].length === 3) {
//       return callbacks[node[0]](context, node, node[1], node[2], node[3]);
//     }
//     // console.assert(Syntax.expression[expression[0]].length ===  4);
//     return callbacks[node[0]](context, node, node[1], node[2], node[3], node[4]);
//   }
//   // console.assert(node[0] === "BLOCK");
//   return callbacks.BLOCK(context, node, node[1], node[2]);
// };

const dispatch_expression = (expression, context, callbacks) => {
  if (Syntax.expression[expression[0]].length === 1) {
    return callbacks[expression[0]](context, expression, expression[1]);
  }
  if (Syntax.expression[expression[0]].length === 2) {
    return callbacks[expression[0]](context, expression, expression[1], expression[2]);
  }
  // console.assert(Syntax.expression[expression[0]].length ===  3);
  return callbacks[expression[0]](context, expression, expression[1], expression[2], expression[3]);
};

exports._expression = dispatch_expression;
exports.expression = dispatch_expression;

const dispatch_statement = (statement, context, callbacks) => {
  if (Syntax.statement[statement[0]].length === 0) {
    return callbacks[statement[0]](context, statement);
  }
  if (Syntax.statement[statement[0]].length === 1) {
    return callbacks[statement[0]](context, statement, statement[1]);
  }
  if (Syntax.statement[statement[0]].length === 2) {
    return callbacks[statement[0]](context, statement, statement[1], statement[2]);
  }
  if (Syntax.statement[statement[0]].length === 3) {
    return callbacks[statement[0]](context, statement, statement[1], statement[2], statement[3]);
  }
  // console.assert(Syntax.expression[expression[0]].length ===  4);
  return callbacks[statement[0]](context, statement, statement[1], statement[2], statement[3], statement[4]);
};

exports._statement = dispatch_statement
exports.Statements = (statements, context, callback) => ArrayLite.flatMap(statements, (statement) => dispatch_statement(statement, context, callback));

const dispatch_block = (block, context, callbacks) => callbacks[block[0]](context, block, block[1], block[2]);
exports._block = dispatch_block;
exports.BLOCK = dispatch_block;

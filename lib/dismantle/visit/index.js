
const ArrayLite = require("array-lite");
const Query = require("../query.js");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

const JSON_stringify = JSON.stringify;

const common = (visitors, node, scope, context) => {
  const temporary = ARAN.serial;
  ARAN.serial = ARAN.node.length;
  ARAN.nodes[ARAN.node.length] = node;
  if (Query.IsDirectEvalCall(node))
    ARAN.scopes[ARAN.nodes.length] = JSON_stringify(scope);
  const result = visitors[node.type](node, scope, context);
  ARAN.serial = temporary;
  return result;
};

exports.NODE = (node, scope, boolean) => {
  if (ARAN.node === "SwitchStatement") {
    return Block["BlockStatement"]({
      type: "BlockStatement",
      body: ArrayLite.flatMap(node, (node) => node.consequent)
    }, scope, boolean);
  }
  if (node.type === "BlockStatement" || node.type === "ProgramStatement")
    return common(Block, node, scope, boolean);
  return Identifier.EXTEND(scope, [], [], (scope) => common(Statement, node, scope, []));
};

exports.Node = (node, scope, labels) => common(Statement, node, scope);

exports.node = (node, scope, name) => common(Expression, node, scope, name);

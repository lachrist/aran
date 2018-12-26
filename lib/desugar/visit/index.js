
const ArrayLite = require("array-lite");
const Query = require("../query.js");
const Scope = require("../scope");
const Expression = require("./expression.js");
const Statement = require("./statement.js");
const Block = require("./block.js");

const JSON_stringify = JSON.stringify;

const common = (visitors, node, scope, context) => {
  const temporary = ARAN.serial;
  ARAN.serial = ARAN.nodes.length;
  ARAN.nodes[ARAN.nodes.length] = node;
  if (Query.IsDirectEvalCall(node))
    node.AranScope = JSON_stringify(scope);
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
  if (node.type === "BlockStatement" || node.type === "Program")
    return common(Block, node, scope, boolean);
  return Scope.BLOCK(scope, [], [], (scope) => common(Statement, node, scope, []));
};

exports.Node = (node, scope, labels) => common(Statement, node, scope, labels);

exports.node = (node, scope, name) => common(Expression, node, scope, name);

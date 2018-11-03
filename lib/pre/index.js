
const Expression = require("./expression.js");
const Statement = require("./statement.js");

function common = (node, parent) => {
  Object.defineProperty(node, "AranParent", {
    configurable: true,
    writable: true,
    value: parent
  });
  Object.defineProperty(node, "AranRoot", {
    configurable: true,
    writable: true,
    value: ARAN.root
  });
  node.AranParentSerial = parent.AranSerial;
  node.AranRootSerial = ARAN.root.AranSerial;
  node.AranSerial = ARAN.counter++;
};

exports.expression = (node, parent) => {
  common(node, parent);
  Expression[node.type](node);
}

exports.statement = (node, parent, scope, last) => {
  common(node, parent);
  return Statement[node.type](node, scope, last);
};

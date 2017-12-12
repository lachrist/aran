
const Join = require("./join.js");

function join (root, pointcut) {
  this._roots.push(root);
  const temporary = global.ARAN;
  global.ARAN = {
    namespace: this.namespace,
    counter: this._counter,
  };
  const result = Join(root, pointcut);
  this._counter = global.ARAN.counter;
  global.ARAN = temporary;
  return result;
}

function root (nid) {
  for (var index=0, length=this._roots.length; index<length; index++) {
    if (nid >= this._roots[index].__min__ && nid <= this._roots[index].__max__) {
      return this._roots[index];
    }
  }
}

function node (nid) {
  var nodes = this._roots.slice();
  while (node.length) {
    var node = nodes.pop();
    if (typeof node === "object" && node !== null) {
      if (node.__min__ === nid) {
        return node;
      }
      if (!node.__min__ || (nid > node.__min__ && nid <= node.__max__)) {
        for (var key in node) {
          nodes.push(node[key]);
        }
      }
    }
  }
}

module.exports = (namespace) => ({
  _roots: [],
  _counter: 1,
  namespace: namespace || "__aran__",
  join: join,
  root: root,
  node: node
});

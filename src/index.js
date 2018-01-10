
const Join = require("./join");
const Cut = require("./cut");
const Build = require("./build");
const ArrayLite = require("array-lite");

function join (root, pointcut) {
  this._roots.push(root);
  const temporary = global.ARAN;
  global.ARAN = {
    namespace: this.namespace,
    counter: this._counter,
    cut: Cut(pointcut)
  };
  const result = Join(root);
  this._counter = global.ARAN.counter;
  global.ARAN = temporary;
  return result;
}

function root (idx) {
  for (var index=0, length=this._roots.length; index<length; index++) {
    if (idx >= this._roots[index].__min__ && idx <= this._roots[index].__max__) {
      return this._roots[index];
    }
  }
}

function node (idx) {
  var nodes = ArrayLite.slice(this._roots);
  for (var index = 0; index < node.length; index++) {
    var node = nodes[index];
    if (typeof node === "object" && node !== null) {
      if (node.__min__ === idx) {
        return node;
      }
      if (!node.__min__ || (idx > node.__min__ && idx <= node.__max__)) {
        for (var key in node) {
          nodes[nodes.length] = node[key];
        }
      }
    }
  }
}

module.exports = (options) => ({
  _roots: [],
  _counter: 1,
  namespace: options.namespace || "__aran__",
  build: Build[options.output] || output,
  join: join,
  root: root,
  node: node
});


const Join = require("./join");
const Cut = require("./cut");
const Build = require("./build");
const ArrayLite = require("array-lite");

function join (root, pointcut, strict) {
  this._roots.push(root);
  const temporary = global.ARAN;
  global.ARAN = {
    build: this._build,
    nodes: this._nodes,
    namespace: this.namespace,
    counter: this._counter,
    cut: Cut(pointcut)
  };
  const result = Join(root, strict);
  this._counter = global.ARAN.counter;
  global.ARAN = temporary;
  return result;
}

function root (iid) {
  for (var index=0, length=this._roots.length; index<length; index++) {
    if (iid >= this._roots[index].AranIndex && iid <= this._roots[index].AranMaxIndex) {
      return this._roots[index];
    }
  }
}

function node1 (iid) {
  var nodes = ArrayLite.slice(this._roots);
  for (var index = 0; index < node.length; index++) {
    var node = nodes[index];
    if (typeof node === "object" && node !== null) {
      if (node.AranIndex === iid) {
        return node;
      }
      if (!node.AranIndex || (iid > node.AranIndex && iid <= node.AranMaxIndex)) {
        for (var key in node) {
          nodes[nodes.length] = node[key];
        }
      }
    }
  }
}

function node2 (iid) {
  return this._nodes[iid];
};

module.exports = (options) => ({
  _roots: [],
  _counter: 1,
  _build: options.output ? (Build[options.output] || output) : Build.Estree,
  _nodes: options.nocache ? null : [],
  namespace: options.namespace || "__aran__",
  join: join,
  root: root,
  node: options.nocache ? node1 : node2
});

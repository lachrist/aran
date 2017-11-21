
const Join = require("./join.js");
const JoinPoint = require("./join-point.js");
const Cut = require("./cut.js");

function join (root, pointcut) {
  this._roots.push(root);
  const tmp1 = global.ARAN_NAMESPACE;
  const tmp2 = global.ARAN_COUNTER;
  const tmp3 = global.ARAN_CUT;
  global.ARAN_NAMESPACE = this.namespace;
  global.ARAN_COUNTER = this._counter;
  global.ARAN_CUT = Cut(pointcut);
  const res = Visit(root);
  this._counter = global.ARAN_COUNTER;
  global.ARAN_NAMESPACE = tmp1;
  global.ARAN_COUNTER = tmp2;
  global.ARAN_CUT = tmp3;
  return res;
}

function root (index) {
  for (let i=0, l=this._roots.length; i<l; i++) {
    if (index >= this._roots[i].__min__ && index <= this._roots[i].__max__) {
      return this._roots[i];
    }
  }
}

function node (index) {
  const nodes = this._roots.slice()
  for (let nodes; nodes.length; node = nodes.pop()) {
    if (typeof node === "object" && node !== null) {
      if (node.__min__ === index)
        return node;
      if (!node.__min__ || (index > node.__min__ && index <= node.__max__)) {
        nodes.push(... Array.isArray(node) ? node : Object.values(node));
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

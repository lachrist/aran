
const Join = require("./join");
const Cut = require("./cut");
const Setup = require("./setup.js");
const Build = require("./build");
const ArrayLite = require("array-lite");
const Object_assign = Object.assign;
const Object_keys = Object.keys;

function join (root, pointcut, parent) {
  this._roots.push(root);
  const temporary = global.ARAN;
  global.ARAN = {
    build: this._build,
    nodes: this._nodes,
    nosetup: this._nosetup,
    namespace: this.namespace,
    counter: this._counter,
    cut: Cut(pointcut)
  };
  const result = Join(root, parent);
  this._counter = global.ARAN.counter;
  global.ARAN = temporary;
  return result;
}

function root (serial) {
  for (var index=0, length=this._roots.length; index<length; index++) {
    if (serial >= this._roots[index].AranSerial && serial <= this._roots[index].AranMaxSerial) {
      return this._roots[index];
    }
  }
}

function node1 (serial) {
  var nodes = ArrayLite.slice(this._roots);
  for (var index = 0; index < node.length; index++) {
    var node = nodes[index];
    if (typeof node === "object" && node !== null) {
      if (node.AranSerial === serial) {
        return node;
      }
      if (!node.AranSerial || (serial > node.AranSerial && serial <= node.AranMaxSerial)) {
        for (var key in node) {
          nodes[nodes.length] = node[key];
        }
      }
    }
  }
}

function setup () {
  const temporary = global.ARAN;
  global.ARAN = {
    build: this._build,
    namespace: this.namespace
  };
  const setup = Setup();
  global.ARAN = temporary;
  return this._build.PROGRAM(false, setup);
}

function node2 (serial) {
  return this._nodes[serial];
};

module.exports = (options) => {
  options = Object_assign({
    namespace: "__META__",
    output: "EstreeOptimized",
    nocache: false,
    nosetup: false
  }, options);
  if (!Build[options.output])
    throw new Error("Unknown output: "+options.output+", should be one of "+Object_keys(Build)+".");
  return {
    _roots: [],
    _counter: 1,
    _nosetup: options.nosetup,
    _build: Build[options.output],
    _nodes: options.nocache ? null : [],
    namespace: options.namespace,
    setup: setup,
    join: join,
    root: root,
    node: options.nocache ? node1 : node2
  }
};

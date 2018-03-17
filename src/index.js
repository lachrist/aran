
const ArrayLite = require("array-lite");
const Meta = require("./meta.js");
const Weave = require("./weave");
const Cut = require("./cut");
const Build = require("./build");
const RegExp = global.RegExp;
const Object_assign = global.Object.assign;
const Object_keys = global.Object.keys;
const Reflect_apply = global.Reflect.apply;
const String_prototype_replace = global.String.prototype.replace;

function weave (root, pointcut, parent) {
  this._roots.push(root);
  const temporary = global.ARAN;
  global.ARAN = this._global;
  global.ARAN.cut = Cut(pointcut);
  const result = Weave(root, parent);
  global.ARAN.cut = null;
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
  global.ARAN = this._global;
  const setup = Meta.Setup();
  global.ARAN = temporary;
  return this._global.build.PROGRAM(false, null, setup);
}

function node2 (serial) {
  return this._global.nodes[serial];
};

module.exports = (options) => {
  options = Object_assign({
    namespace: "META",
    output: "EstreeOptimized",
    nocache: false,
    sandbox: false
  }, options);
  if (!Build[options.output])
    throw new Error("Unknown output: "+options.output+", should be one of "+Object_keys(Build));
  return {
    _roots: [],
    _global: {
      counter: 1,
      node: null,
      cut: null,
      hoisted: null,
      namespace: options.namespace,
      sandbox: options.sandbox,
      build: Build[options.output],
      nodes: options.nocache ? null : [],
      regexp: new RegExp(
        "^\\$*(newtarget|callee|this|arguments|error|completion|arrival|" +
        (options.sandbox ? "eval|" : "") +
        Reflect_apply(String_prototype_replace, options.namespace, ["$", "\\$$"]) +
        ")$"),
    },
    setup: setup,
    weave: weave,
    root: root,
    node: options.nocache ? node1 : node2
  };
};

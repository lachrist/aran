
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

const run = (state, roots, root, pointcut, parent, closure) => {
  roots[roots.length] = root;
  const temporary = global.ARAN;
  global.ARAN = state;
  global.ARAN.cut = Cut(pointcut);
  global.ARAN.node = root;
  const program = closure(root, parent);
  global.ARAN.node = null;
  global.ARAN.cut = null;
  global.ARAN = temporary;
  return program;
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
  const roots = [];
  const state = {
    counter: 1,
    node: null,
    cut: null,
    hoisted: null,
    namespace: options.namespace,
    sandbox: options.sandbox,
    build: Build[options.output],
    nodes: options.nocache ? null : [],
    regexp: new RegExp(
      "^\\$*(newtarget|callee|this|arguments|error|completion|arrival|eval|" +
      Reflect_apply(String_prototype_replace, options.namespace, ["$", "\\$$"]) +
      ")$"),
  };
  const node = (
    options.nocache ?
    (serial) => {
      var nodes = ArrayLite.slice(roots);
      for (var index = 0; index < node.length; index++) {
        var node = nodes[index];
        if (typeof node === "object" && node !== null) {
          if (node.AranSerial === serial) {
            return node;
          }
          if (!node.AranSerial || (serial > node.AranSerial && serial <= node.AranSerialMax)) {
            for (var key in node) {
              nodes[nodes.length] = node[key];
            }
          }
        }
      }
    } :
    (serial) => state.nodes[serial]);
  return {
    namespace: options.namespace,
    setup: (pointcut) => run(state, roots, {
      type: "Program",
      body: [],
      AranStrict: false,
      AranParent: null,
      AranSerial: 0,
      AranSerialMax: 0}, pointcut, null, Meta.SETUP),
    weave: (root, pointcut, parent) => run(state, roots, root, pointcut, typeof parent === "number" ? node(parent) : parent, Weave),
    root: (serial) => {
      for (var index=0, length=roots.length; index<length; index++) {
        if (serial >= roots[index].AranSerial && serial <= roots[index].AranSerialMax) {
          return roots[index];
        }
      }
    },
    node: node
  };
};

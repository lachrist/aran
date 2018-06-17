
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

module.exports = (options) => {
  options = Object_assign({
    namespace: "ADVICE",
    output: "EstreeOptimized",
    nocache: false,
  }, options);
  const roots = [];
  const state = {
    sandbox: null,
    counter: 1,
    node: null,
    cut: null,
    hoisted: null,
    namespace: options.namespace,
    build: typeof options.output === "string" ? Build[options.output] : options.output,
    nodes: options.nocache ? null : [],
    regexp: new RegExp(
      "^\\$*(newtarget|callee|this|arguments|error|completion|eval|scope|" +
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
    output: options.output,
    namespace: options.namespace,
    setup: () => {
      const temporary = global.ARAN;
      global.ARAN = state;
      const program = Meta.SETUP();
      global.ARAN = temporary;
      return program;
    },
    weave: (root, pointcut, options) => {
      options = options || {};
      roots[roots.length] = root;
      const temporary = global.ARAN;
      global.ARAN = state;
      global.ARAN.sandbox = options.sandbox;
      global.ARAN.cut = Cut(pointcut);
      global.ARAN.node = root;
      const program = Weave(root, (
        typeof options.scope === "number" ?
        node(options.scope) :
        (
          !options.scope || options.scope === "global" ?
          ["this"] :
          (
            options.scope === "commonjs" ?
            ["exports", "module", "require", "this"] :
            (
              options.scope === "node" ?
              ["__filename", "__dirname", "exports", "module", "require", "this"] :
              options.scope)))));
      global.ARAN = temporary;
      return program;
    },
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

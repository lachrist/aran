
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

const cache = (node, parent, nodes) => {
  if (typeof node === "object" && node !== null) {
    if ("AranSerial" in node) {
      nodes[node.AranSerial] = node;
      node.AranParent = parent;
      parent = node;
    }
    for (let key in node) {
      cache(node[key], parent, nodes)
    }
  }
};

module.exports = (options1) => {
  options1 = Object_assign({
    namespace: "ADVICE",
    format: "EstreeOptimized",
    roots: [],
    nodes: []
  }, options1);
  cache(options1.roots, null, options1.nodes);
  const state = {
    sandbox: null,
    counter: 1,
    node: null,
    cut: null,
    hoisted: null,
    namespace: options1.namespace,
    build: typeof options1.format === "string" ? Build[options1.format] : options1.format,
    nodes: options1.nodes,
    regexp: new RegExp(
      "^\\$*(newtarget|callee|this|arguments|error|completion|eval|scope|" +
      Reflect_apply(String_prototype_replace, options1.namespace, ["$", "\\$$"]) +
      ")$"),
  };
  return {
    format: options1.format,
    namespace: options1.namespace,
    setup: () => {
      const temporary = global.ARAN;
      global.ARAN = state;
      const program = Meta.SETUP();
      global.ARAN = temporary;
      return program;
    },
    weave: (root, pointcut, options2) => {
      options2 = options2 || {};
      options1.roots[options1.roots.length] = root;
      const temporary = global.ARAN;
      global.ARAN = state;
      global.ARAN.sandbox = options2.sandbox;
      global.ARAN.cut = Cut(pointcut);
      global.ARAN.node = root;
      const program = Weave(root, (
        typeof options2.scope === "number" ?
        options1.nodes[options2.scope] :
        (
          !options2.scope || options2.scope === "global" ?
          ["this"] :
          (
            options2.scope === "commonjs" ?
            ["exports", "module", "require", "this"] :
            (
              options2.scope === "node" ?
              ["__filename", "__dirname", "exports", "module", "require", "this"] :
              options2.scope)))));
      global.ARAN = temporary;
      return program;
    },
    roots: options1.roots,
    nodes: options1.nodes,
    rootof: (serial) => {
      for (var index=0, length=options1.roots.length; index<length; index++) {
        if (serial >= options1.roots[index].AranSerial && serial <= options1.roots[index].AranSerialMax) {
          return options1.roots[index];
        }
      }
    },
    // DEPRECATED //
    root: (serial) => {
      for (var index=0, length=options.roots.length; index<length; index++) {
        if (serial >= options.roots[index].AranSerial && serial <= options.roots[index].AranSerialMax) {
          return options.roots[index];
        }
      }
    },
    // DEPRECATED //
    node: (serial) => state.nodes[serial]
  };
};

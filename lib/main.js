
const ArrayLite = require("array-lite");
const Meta = require("./meta.js");
const Weave = require("./weave");
const Cut = require("./cut");
const Build = require("./build");

const Object_defineProperty = Object.defineProperty;
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
  return nodes;
};

function setup () {
  const temporary = global.ARAN;
  global.ARAN = {
    namespace: this.namespace,
    build: typeof this.format === "string" ? Build[this.format] : this.format
  };
  const program = Meta.SETUP();
  global.ARAN = temporary;
  return program;
}

function weave (root, scope = "global") {
  this.roots[this.roots.length] = root;
  const temporary = global.ARAN;
  global.ARAN = {
    sandbox: this.sandbox,
    cut: Cut(this.pointcut),
    node: null,
    root: root,
    hoisted: null,
    namespace: this.namespace,
    build: typeof this.format === "string" ? Build[this.format] : this.format,
    nodes: this.nodes
  };
  const program = Weave(root, (
    typeof scope === "number" ?
    this.nodes[scope] :
    (
      scope === "global" ?
      ["this"] :
      (
        scope === "commonjs" ?
        ["exports", "module", "require", "this"] :
        (
          scope === "node" ?
          ["__filename", "__dirname", "exports", "module", "require", "this"] :
          scope)))));
  global.ARAN = temporary;
  return program;
}

module.exports = (options = {}) => {
  const aran = ({
    pointcut: options.pointcut || null,
    sandbox: Boolean(options.sandbox),
    format: options.format || "EstreeOptimized",
    namespace: options.namespace || "__ARAN__",
    roots: options.roots || [],
    setup,
    weave
  });
  Object_defineProperty(node, "nodes", {
    value: options.nodes || (options.roots ? cache(options.roots, null, []) : []),
    configurable: true,
    enumerable: false,
    writable: true
  });
  return aran;
};

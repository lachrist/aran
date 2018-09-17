
const ArrayLite = require("array-lite");
const Weave = require("./weave");
const Cut = require("./cut");
const Build = require("./build");

const Array_prototype_pop = Array.prototype.pop;
const Array_prototype_push = Array.prototype.push;
const Object_defineProperty = Object.defineProperty;
const Object_keys = Object.keys;
const Array_isArray = Array.isArray;

const cache = (roots) => {
  const nodes = [];
  const todos = [];
  todos.pop = Array_prototype_pop;
  todos.push = Array_prototype_push;
  for (let index = 0; index < roots.length; index++) {
    todos.push([roots[index], null]);
    while (todos.length) {
      let [parent, current] = todos.pop();
      if ("AranSerial" in current) {
        nodes[current.AranSerial] = current;
        current.AranRoot = roots[index];
        current.AranParent = parent;
        parent = current;
      }
      for (let key in current) {
        if (typeof current[key] === "object" && current[key] !== null) {
          todos.push([parent, current[key]]);
        }
      }
    }
  }
  return nodes;
}

const scopes = {
  "global": ["this"],
  "commonjs": ["exports", "module", "require", "this"],
  "node": ["__filename", "__dirname", "exports", "module", "require", "this"]
};

const contexts = {
  "global":      {local:false, closure:false, strict:false, identifiers:["this"]},
  "commonjs":    {local:false, closure:true,  strict:false, identifiers:["this", "require", "module", "exports"]},
  "node":        {local:false,  closure:true,  strict:false, identifiers:["this", "require", "module", "exports", "__filename", "__dirname"]},
  "eval":        {local:true,  closure:false, strict:false, identifiers:[]},
  "eval-strict": {local:true,  closure:true,  strict:true,  identifiers:[]},
};

const blacklist = [
  "this",
  "newtarget",
  "arguments",
  "callee",
  "completion",
  "error"];

function weave (root, pointcut, context = "global") {
  if (Array_isArray(pointcut)) {
    let array = pointcut;
    pointcut = (name) => ArrayLite.includes(array);
  }
  context = typeof context === "string" ? contexts[context] : context;
  if (typeof root !== "object" || root === null || root.type !== "Program")
    throw new Error("root should be an estree.Program node");
  if (typeof pointcut !== "function")
    throw new Error("pointcut should either be an array or a function");
  if (typeof scope !== "object" || scope === null)
    throw new Error("scope should either be an array or one of: "+JSON.stringify(Object_keys(scopes)));
  this.roots[this.roots.length] = root;
  const temporary = global.ARAN;
  global.ARAN = {
    scope,
    build: typeof this.format === "string" ? Build[this.format] : this.format,
    cut: Cut(this.pointcut),
    node: null,
    root: root,
    hoisted: null,
    namespace: this.namespace,
    nodes: this.nodes
  };
  const result = Weave(root);
  global.ARAN = temporary;
  return result;
}

module.exports = (options = {}) => {
  options.roots = options.roots || [];
  if (options.namespace && options.namespace[0] === "$")
    throw new Error("if defined, options.namespace should not start with a \"$\"");
  if (ArrayLite.includes(blacklist, options.namespace))
    throw new Error("if defined, options.namespace should not be one of: "+JSON.stringify(blacklist));
  if (typeof options.format === "string" && !(options.format in Build))
    throw new Error("if options.format is a string, it should be one of: "+JSON.stringify(["Estree", "EstreeOptimized", "String"]);
  if (options.roots && !Array_isArray(roots))
    throw new Error("if defined, options.roots should be an array");
  const aran = ({weave});
  Object_defineProperty(aran, "format", {
    value: options.format || "EstreeOptimized",
    configurable: false,
    enumerable: true,
    writable: false
  });
  Object_defineProperty(aran, "namespace", {
    value: options.namespace || "__ARAN__",
    configurable: false,
    enumerable: true,
    writable: false
  });
  Object_defineProperty(aran, "roots", {
    value: options.roots,
    configurable: false,
    enumerable: true,
    writable: false
  });
  Object_defineProperty(aran, "nodes", {
    value: cache(options.roots),
    configurable: false,
    enumerable: false,
    writable: false
  });
  return aran;
};


const ArrayLite = require("array-lite");
const Weave = require("./weave");
const Cut = require("./cut");
const Format = require("./format");
const Build = require("./build");

const Array_prototype_pop = Array.prototype.pop;
const Array_prototype_push = Array.prototype.push;
const Object_defineProperty = Object.defineProperty;
const Object_keys = Object.keys;
const Array_isArray = Array.isArray;
const Reflect_apply = Reflect.apply;
const RegExp_prototype_test = RegExp.prototype.test;

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

const contexts = {
  "global":      {closure:false, strict:false, setup:true,  scope:["this"]},
  "eval-normal": {closure:false, strict:false, setup:false, scope:null},
  "eval-strict": {closure:true,  strict:true,  setup:false, scope:null},
  "commonjs":    {closure:true,  strict:false, setup:true,  scope:["this", "require", "module", "exports"]},
  "node":        {closure:true,  strict:false, setup:true,  scope:["this", "require", "module", "exports", "__filename", "__dirname"]},
};

const blacklist = [
  "_this",
  "_new_target",
  "arguments",
  "callee",
  "completion",
  "eval",
  "error"];

function unique (idenitifier) {
  return "__"+identifier+"_"+this.node.AranSerial;
}

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
  if (typeof context !== "object" || context === null)
    throw new Error("context should either be an array or one of: "+JSON.stringify(Object_keys(scopes)));
  this.roots[this.roots.length] = root;
  const temporary = global.ARAN;
  global.ARAN = {
    namespace: this.namespace,
    nodes: this.nodes,
    build: this._build,
    root,
    cut: Cut(pointcut),
    context,
    node: null,
    unique
  };
  const result = Weave(root);
  global.ARAN = temporary;
  return result;
}

module.exports = (options = {}) => {
  options.namespace = options.namespace || "__ARAN__";
  options.format = options.format || "EstreeOptimized";
  options.roots = options.roots || [];
  if (!Reflect_apply(RegExp_prototype_test, /^[a-zA-Z_$][0-9a-zA-Z_$]*$/, [options.namespace]))
    throw new Error("options.namespace should be a valid JavaScript identifier");
  if (options.namespace[0] === "$")
    throw new Error("options.namespace should not start with a \"$\"");
  if (ArrayLite.includes(blacklist, options.namespace))
    throw new Error("options.namespace should not be one of: "+JSON.stringify(blacklist));
  if (typeof options.format === "string" && !ArrayLite.includes(Object_keys(Format), options.format))
    throw new Error("if options.format is a string, it should be one of: "+JSON.stringify(Object_keys(format)));
  if (options.roots && !Array_isArray(options.roots))
    throw new Error("options.roots should be an array");
  const aran = {weave};
  Object_defineProperty(aran, "_build", {
    value: Build(typeof options.format === "string" ? Format[options.format] : format, options.namespace),
    configurable: false,
    enumerable: false,
    writable: false
  });
  Object_defineProperty(aran, "format", {
    value: options.format,
    configurable: false,
    enumerable: typeof options.format === "string",
    writable: false
  });
  Object_defineProperty(aran, "namespace", {
    value: options.namespace,
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

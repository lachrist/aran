
const ArrayLite = require("array-lite");
const Illegal = require("./illegal.js");
const Dismantle = require("./dismantle");
const Assemble = require("./assemble.js");

const Array_prototype_pop = Array.prototype.pop;
const Array_prototype_push = Array.prototype.push;
const Object_defineProperty = Object.defineProperty;
const Array_isArray = Array.isArray;

const shorthands = {
  "commonjs": ["exports", "module", "require"],
  "nodejs": ["exports", "module", "require", "__filename", "dirname"]
};

function weave (root, pointcut, scope) {
  // Check root //
  if (typeof root !== "object" || root === null || root.type !== "Program")
    throw new Error("root should be an estree.Program node");
  // Check pointcut //
  if (Array_isArray(pointcut)) {
    let array = pointcut;
    pointcut = (name) => ArrayLite.includes(array);
  }
  if (typeof pointcut !== "function")
    throw new Error("pointcut should either be an array or a function");
  // Check scope //
  if (typeof scope === "number") {
    scope = this.nodes[scope];
  } else if (Array_isArray(scope)) {
    for (let index=0; index<scope.length; index++) {
      if (Illegal(scope[index])) {
        throw new Error("scope array should only contain valid identifiers");
      }
    }
  } else if (ArrayLite.includes(shorthands, scope)) {
    scope = shorthands[scope];
  } else if (!scope) {
    scope = null
  } else {
    throw new Error("scope should either be flasy (global), or a number (direct eval), or an array (local) or a shorthand:"+JSON.stringify(shorthands));
  }
  // Return
  this.roots[this.roots.length] = root;
  return Assemble(Dismantle(root, scope), pointcut, this.namespace);
}

const blacklist = [
  "eval",
  "arguments",
  "callee",
  "error"
];

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
};

module.exports = (options = {}) => {
  options.namespace = options.namespace || "__ARAN__";
  if (Illegal(options.namespace))
    throw new Error("options.namespace should be a legal JavaScript identifier");
  if (options.namespace[0] === "$")
    throw new Error("options.namespace should not start with a \"$\"");
  if (ArrayLite.includes(blacklist, options.namespace))
    throw new Error("options.namespace should not be one of: "+JSON.stringify(blacklist));
  options.roots = options.roots || [];
  if (options.roots && !Array_isArray(options.roots))
    throw new Error("options.roots should be an array");
  const aran = {weave};
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


const ArrayLite = require("array-lite");
const SetupEstree = require("./setup-estree.js");
const Dismantle = require("./dismantle");
const Weave = require("./weave");
const Assemble = require("./assemble.js");
const Illegal = require("./illegal.js");

const Reflect_apply = Reflect.apply;
const RegExp_prototype_test = RegExp.prototype.test;
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
  } else if (typeof pointcut !== "function") {
    throw new Error("pointcut should either be an array or a function");
  }
  // Check scope //
  if (Array_isArray(scope)) {
    for (let index=0; index<scope.length; index++) {
      if (Illegal(scope[index])) {
        throw new Error("scope array should only contain valid identifiers");
      }
    }
  } else if (ArrayLite.includes(shorthands, scope)) {
    scope = shorthands[scope];
  } else if (!scope) {
    scope = null
  } else if (typeof scope !== "number"){
    throw new Error("scope should either be flasy (global), or a number (direct eval), or an array (local) or a shorthand:"+JSON.stringify(shorthands));
  }
  // Return //
  this.roots[this.roots.length] = root;
  const block1 = Dismantle(root, scope, this.nodes);
  // console.log(require("util").inspect(block1, false, null, true));
  const block2 = Weave(block1, root, pointcut);
  // console.log(require("util").inspect(block2, false, null, true));
  return Assemble(block2, this.namespace);
};

function setup () {
  const loop = (node1) => {
    if (node1 === null || typeof node1 !== "object")
      return node1;
    if (Array_isArray(node1))
      return ArrayLite.map(node1, loop)
    if (node1.type === "Identifier" && node1.name === "NAMESPACE")
      return {type:"Identifier", name:this.namespace};
    const node2 = {};
    for (let key in node1)
      node2[key] = loop(node1[key]);
    return node2;
  };
  return loop(SetupEstree);
};

const blacklist = [
  "eval",
  "arguments",
  "callee",
  "error",
  "arrival",
  "_this",
  "_new_target"
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
    throw new Error("options.namespace should not start with a dollar sign");
  if (Reflect_apply(RegExp_prototype_test, /^_[0-9]+$/, [options.namespace]))
    throw new Error("options.namespace should not be a underscore followed by numbers")
  if (ArrayLite.includes(blacklist, options.namespace))
    throw new Error("options.namespace should not be one of: "+JSON.stringify(blacklist));
  options.roots = options.roots || [];
  if (options.roots && !Array_isArray(options.roots))
    throw new Error("options.roots should be an array");
  const aran = {weave, setup};
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

module.exports.unary = function unary (operator, argument) {
  switch (operator) {
    case "-":      return -      argument;
    case "+":      return +      argument;
    case "!":      return !      argument;
    case "~":      return ~      argument;
    case "typeof": return typeof argument;
    case "void":   return void   argument;
    case "delete": return delete argument;
  }
  throw new TypeError("Invalid unary operator: "+operator);
};

module.exports.binary = function binary (operator, left, right) {
  switch (operator) {
    case "==":  return left ==  right;
    case "!=":  return left !=  right;
    case "===": return left === right;
    case "!==": return left !== right;
    case "<":   return left <   right;
    case "<=":  return left <=  right;
    case ">":   return left >   right;
    case ">=":  return left >=  right;
    case "<<":  return left <<  right;
    case ">>":  return left >>  right;
    case ">>>": return left >>> right;
    case "+":   return left +   right;
    case "-":   return left -   right;
    case "*":   return left *   right;
    case "/":   return left /   right;
    case "%":   return left %   right;
    case "|":   return left |   right;
    case "^":   return left ^   right;
    case "&":   return left &   right;
    case "in":  return left in  right;
    case "instanceof": return left instanceof right;
  }
  throw new TypeError("Invalid binary operator: "+operator)
};


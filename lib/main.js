
const ArrayLite = require("array-lite");
const Desugar = require("./desugar");
const Ambush = require("./ambush");
const Generate = require("./generate");
const SetupEstree = require("./setup-estree.js");
const SetupScript = require("./setup-script.js");
const Illegal = require("./illegal.js");

const Error = global.Error;
const Reflect_apply = Reflect.apply;
const RegExp_prototype_test = RegExp.prototype.test;
const Object_defineProperty = Object.defineProperty;
const Array_isArray = Array.isArray;
const Array_from = Array.from;

function desugar (root, serial) {
  if (serial === void 0)
    serial = null;
  if (typeof serial === "number") {
    if (!this.nodes[serial]) {
      throw new Error("serial is not in the node database: "+serial);
    }
  } else if (serial !== null) {
    throw new Error("serial should either be null/undefined (global code), or a serial number (direct eval code)");
  }
  this.roots[this.roots.length] = root;
  return Desugar(root, serial, this.nodes);
};

function ambush (block, pointcut) {
  if (Array_isArray(pointcut)) {
    let array = pointcut;
    pointcut = (name) => ArrayLite.includes(array, name);
  } else if (typeof pointcut !== "function") {
    throw new Error("pointcut should either be an array or a function");
  }
  return Ambush(block, pointcut, this.nodes);
}
function generate (block) {
  return Generate(block, this.namespace, this.format);
}

function weave (root, pointcut, serial) {
  return this.generate(this.ambush(this.desugar(root, serial), pointcut));
};

function setup () {
  if (this.format === "script")
    return SetupScript(this.namespace);
  return SetupEstree(this.namespace);
};

const blacklist = [
  "eval",
  "arguments",
  "callee",
  "error",
  "_this",
  "_new_target"
];

const cache = (roots) => {
  const nodes = [0];
  const objects = Array_from(roots);
  let length = objects.length;
  while (length) {
    const object = objects[--length];
    if (Reflect_getOwnPropertyDescriptor(object, "AranSerial"))
      nodes[object.AranSerial] = object;
    const keys = Reflect_ownKeys(object);
    for (let index = 0; index < keys.length; index++) {
      const value = object[keys[index]];
      if (typeof value === "object" && value !== null) {
        objects[length++] = value;
      }
    }
  }
  return nodes;
};

const unary = (operator, argument) => {
  switch (operator) {
    case "-":      return -      argument;
    case "+":      return +      argument;
    case "!":      return !      argument;
    case "~":      return ~      argument;
    case "typeof": return typeof argument;
    case "void":   return void   argument;
    case "delete": return delete argument;
  }
  throw new Error("Invalid unary operator: "+operator);
};

const binary = (operator, left, right) => {
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
  throw new Error("Invalid binary operator: "+operator);
}

module.exports = (options = {}) => {
  options.namespace = options.namespace || "__ARAN__";
  options.roots = options.roots || [];
  options.format = options.format || "estree";
  if (Illegal(options.namespace))
    throw new Error("options.namespace should be a legal JavaScript identifier");
  if (options.namespace[0] === "$")
    throw new Error("options.namespace should not start with a dollar sign");
  if (Reflect_apply(RegExp_prototype_test, /^_[0-9]+$/, [options.namespace]))
    throw new Error("options.namespace should not be a underscore followed by numbers")
  if (ArrayLite.includes(blacklist, options.namespace))
    throw new Error("options.namespace should not be one of: "+JSON.stringify(blacklist));
  if (!Array_isArray(options.roots))
    throw new Error("options.roots should be an array");
  if (options.format !== "estree" && options.format !== "script")
    throw new Error("options.format should either be 'script' or 'estree'");
  const aran = {setup, desugar, ambush, generate, weave, setup, unary, binary};
  Object_defineProperty(aran, "namespace", {
    value: options.namespace,
    configurable: false,
    enumerable: true,
    writable: false
  });
  Object_defineProperty(aran, "format", {
    value: options.format,
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

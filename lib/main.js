
const ArrayLite = require("array-lite");
const Normalise = require("./normalise");
const Instrument = require("./instrument");
const Generate = require("./generate");
const Setup = require("./setup.js");
const Illegal = require("./illegal.js");

const global_Error = global.Error;
const global_Reflect_apply = Reflect.apply;
const global_RegExp_prototype_test = RegExp.prototype.test;
const global_Object_defineProperty = Object.defineProperty;
const global_Array_isArray = Array.isArray;
const global_Array_from = Array.from;

function normalise (root, serial) {
  if (serial === void 0) {
    serial = null;
  } else if (serial !== null) {
    if (typeof serial !== "number") {
      throw new global_Error("serial should either be null/undefined (global code), or a serial number (direct eval code)");
    }
    if (!(serial in this.nodes[serial]) {
      throw new global_Error("serial is not in the node database: "+serial);
    }
  }
    
  } else if (serial !== null) {
    throw new global_Error("serial should either be null/undefined (global code), or a serial number (direct eval code)");
  }
  this.roots[this.roots.length] = root;
  return Normalise(root, serial, this.nodes);
};

function instrument (block, pointcut) {
  if (Array_isArray(pointcut)) {
    let array = pointcut;
    pointcut = (name) => ArrayLite.includes(array, name);
  } else if (typeof pointcut !== "function") {
    throw new Error("pointcut should either be an array or a function");
  }
  return Instrument(block, {
    pointcut,
    nodes: this.nodes,
  });
}

function generate (block) {
  return Generate(block, this.namespace, this.format);
}

function weave (root, pointcut, serial) {
  return this.generate(this.ambush(this.normalise(root, serial), pointcut));
}

function setup () {
  return Setup[this.format](this.namespace);
}

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
  options.namespace = options.namespace || "_";
  options.roots = options.roots || [];
  // options.format = options.format || "estree";
  if (typeof options.namespace !== "string")
    throw new Error("options.namespace should be a string");
  if (Illegal(options.namespace))
    throw new Error("options.namespace should be a legal JavaScript identifier");
  if (options.namespace[0] === "$" || options.namespace[0] === "_" || options.namespace[0] === "X")
    throw new Error("options.namespace should not start with either: '$', '_', or 'X'");
  if (options.namespace === "eval" || options.namespace === "arguments")
    throw new Error("options.namespace should not be either: 'eval' or 'arguments'");
  if (!Array_isArray(options.roots))
    throw new Error("options.roots should be an array");
  // if (options.format !== "estree" && options.format !== "script")
  //   throw new Error("options.format should either be 'script' or 'estree'");
  const aran = {setup, normalise, instrument, generate, optimize, weave, unary, binary};
  Object_defineProperty(aran, "namespace", {
    value: options.namespace,
    configurable: false,
    enumerable: true,
    writable: false
  });
  // Object_defineProperty(aran, "format", {
  //   value: options.format,
  //   configurable: false,
  //   enumerable: true,
  //   writable: false
  // });
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

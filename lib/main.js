
const ArrayLite = require("array-lite");
const SetupEstree = require("./setup-estree.js");
const Dismantle = require("./dismantle");
const Weave = require("./weave");
const Assemble = require("./assemble");
const Illegal = require("./illegal.js");
const Generate = require("./generate.js");

const TypeError = global.TypeError;
const Reflect_apply = Reflect.apply;
const RegExp_prototype_test = RegExp.prototype.test;
const Object_defineProperty = Object.defineProperty;
const Array_isArray = Array.isArray;
const Array_from = Array.from;

function dismantle (root, serial) {
  if (serial === void 0) {
    serial = null;
  } else if (typeof serial === "number") {
    if (!this.nodes[serial]) {
      throw new Error("serial is not in the node database: "+serial);
    }
  } else if (serial !== null) {
    throw new Error("serial should either be null/undefined (global code), or a serial number (direct eval code)");
  }
  this.roots[this.roots.length] = root;
  return Dismantle(root, serial, this.nodes);
};

function weave1 (block, pointcut) {
  if (Array_isArray(pointcut)) {
    let array = pointcut;
    pointcut = (name) => ArrayLite.includes(array);
  } else if (typeof pointcut !== "function") {
    throw new Error("pointcut should either be an array or a function");
  }
  return Weave(block, pointcut, this.nodes);
}

function assemble (block, type) {
  return Assemble(block, this.namespace);
}

function weave (root, pointcut, serial) {
  return this.assemble(this.weave1(this.dismantle(root, serial, this.nodes), pointcut, this.nodes));
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
  throw new TypeError("Invalid unary operator: "+operator);
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
  throw new TypeError("Invalid binary operator: "+operator);
}

module.exports = (options = {}) => {
  options.namespace = options.namespace || "__ARAN__";
  options.roots = options.roots || [];
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
  const aran = {weave0, weave1, weave2, weave, setup, unary, binary, generate:Generate};
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

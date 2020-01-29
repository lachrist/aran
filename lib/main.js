
const ArrayLite = require("array-lite");
const Normalise = require("./normalise");
const Instrument = require("./instrument");
const Generate = require("./generate");
const Setup = require("./setup.js");
const Illegal = require("./illegal.js");

const global_Error = global.Error;
const global_Reflect_apply = Reflect.apply;
const global_WeakMap = global.WeakMap;
const global_RegExp_prototype_test = RegExp.prototype.test;
const global_Object_defineProperty = Object.defineProperty;
const global_Array_isArray = Array.isArray;
const global_Array_from = Array.from;

{

const prototype = {
  ["builtin-names"]: Syntax[""],
};

}

function weave (node1, pointcut, serial) {
  if (serial === void 0) {
    serial = null;
  }
  const serials = new global_WeakMap();
  const block1 = Normalise(node1, {
    __proto__: null,
    serial: serial,
    evals: this.evals,
    nodes: this.nodes,
    serials: serials 
  });
  const block2 = Instrument(block1, {
    __proto__: null,
    eval: serial !== null,
    serials: serials,
    pointcut: pointcut,
    namespace: this.namespaces.advice
  });
  const node2 = Generate(block2, {
    __proto__: null,
    eval: serial !== null,
    namespace: this.namespaces.builtins
  });
  return node2;
};

function normalise (nodes, root, serial) {
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

module.exports = (namespace1, namespace2) => {
  options = global_Object_assign({
    __proto__: null,
    "advice-namespace": "advice",
    "-namespace": "builtin",
    "roots": []
  }, options);
  // options.format = options.format || "estree";
  if (typeof options.namespace !== "string")
    throw new Error("options.namespace should be a string");
  if (Illegal(options.namespace))
    throw new Error("options.namespace should be a legal JavaScript identifier");
  if (options.namespace[0] === "$" || options.namespace[0] === "_" || options.namespace[0] === "X")
    throw new Error("options.namespace should not start with either: '$', '_', or 'X'");
  if (options.namespace === "eval" || options.namespace === "arguments")
    throw new Error("options.namespace should be neither: 'eval' nor 'arguments'");
  if (!Array_isArray(options.roots))
    throw new Error("options.roots should be an array");
  // if (options.format !== "estree" && options.format !== "script")
  //   throw new Error("options.format should either be 'script' or 'estree'");
  const aran = {
    ["builtin-names"]: Syntax["builtin-name"],
    ["builtin-estree"]: (() => {});
    ["builtin-object"]: (() => {
      const object = {__proto__: null, global:global},
      
    } ());
    
    setup,
    normalise,
    instrument,
    generate,
    optimize,
    weave,
    unary,
    binary
  };
  Object_defineProperty(aran, "namespace", {
    value: options.namespace,
    configurable: false,
    enumerable: true,
    writable: false
  });
  Object_defineProperty(aran, "roots", {
    value: [],
    configurable: false,
    enumerable: true,
    writable: false
  });
  Object_defineProperty(aran, "nodes", {
    value: [],
    configurable: false,
    enumerable: false,
    writable: false
  });
  Object_defineProperty(aran, "evals", {
    value: [],
    
  });
  return aran;
};

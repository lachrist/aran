
const ArrayLite = require("array-lite");
const Normalise = require("./normalise");
const Instrument = require("./instrument");
const Generate = require("./generate");
const Setup = require("./setup.js");
const Illegal = require("./illegal.js");
const Prototype = require("./prototype.js");

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
    __proto__: Prototype,
    normalise,
    instrument,
    generate,
    optimize,
    weave,
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

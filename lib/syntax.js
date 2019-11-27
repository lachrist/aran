
const Reflect_apply = Reflect.apply;
const Function = global.Function;
const String_prototype_trim = String.prototype.trim;

exports.block = {
  __proto__: null,
  "BLOCK": ["label"], ["identifier"], ["statement"]
};

exports.statement = {
  __proto__: null,
  // BlockLess //
  "Expression": ["expression"],
  "Break": ["label"],
  "Continue": ["label"],
  "Return": ["expression"],
  "Debugger": [],
  // BlockFull //
  "Block": ["block"],
  "If": ["expression", "block", "block"],
  "While": ["expression", "block"],
  "Try": ["block", "block", "block"]
};

exports.expression = {
  __proto__: null,
  // Producers //
  "closure": ["block-closure"],
  "read": ["identifier"],
  "primitive": ["primitive"],
  "builtin": ["builtin-name"],
  // Consumers //
  "write": ["identifier", "expression"],
  "throw": ["expression"],
  "sequence": ["expression", "expression"],
  "eval": ["expression"],
  "conditional": ["expression", "expression", "expression"],
  // Combiners //
  "apply": ["expression", "expression", ["expression"]],
  "construct": ["expression", ["expression"]],
  "unary": ["unary-operator", "expression"],
  "binary": ["binary-operator", "expression", "expression"],
  "object": ["expression", ["expression", "expression"]]
};

exports["builtin-name"] = [
  "global",
  "eval",
  "RegExp",
  "ReferenceError",
  "TypeError",
  "Reflect.get",
  "Reflect.set",
  "Reflect.has",
  "Reflect.construct",
  "Reflect.apply",
  "Reflect.deleteProperty",
  "Reflect.setPrototypeOf",
  "Reflect.getPrototypeOf",
  "Reflect.defineProperty",
  "Reflect.getOwnPropertyDescriptor",
  "Symbol.unscopables",
  "Symbol.iterator",
  "Object",
  "Object.freeze",
  "Object.keys",
  "Object.create",
  "Object.prototype",
  "Array.of",
  "Array.prototype.concat",
  "Array.prototype.values",
  "Array.prototype.includes",
  "Array.prototype.push",
  "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get",
  "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set"
];

exports["unary-operator"] = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void",
  "delete"
];

exports["binary-operator"] = [
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "<<",
  ">>",
  ">>>",
  "+",
  "-",
  "*",
  "/",
  "%",
  "|",
  "^",
  "&",
  "in",
  "instanceof"
];

exports.primitive = (primitive) => {
  if (typeof primitive === "string" || typeof primitive === "number")
    return true;
  if (primitive === void 0 || primitive === null || primitive === true || primitive === false)
    return true;
  return false;
};

exports["identifier"] = (identifier) => {
  if (typeof identifier !== "string") {
    return false;
  }
  if (identifier[0] === "@") {
    if (ArrayLite.includes(["@callee", "@new.target", "@this", "@arguments", "@error"], identifier) {
      return true;
    }
    return false;
  }
  if (identifier[0] === "%") {
    identifier = Reflect_call(String_prototype_substring, identifier, [1]);
  }
  if (identifier === "this" || identifier === "new.target") {
    return true;
  }
  // Credit: https://github.com/shinnn/is-var-name //
  if (Reflect_apply(String_prototype_trim, identifier, []) !== identifier) {
    return false;
  }
  try {
    new Function(identifier, "var "+identifier);
  } catch (error) {
    return false;
  }
  return true;
};

exports["label"] = (label) => {
  if (typeof label !== "string") {
    return false;
  }
  if (label === "") {
    return true;
  }
  // Credit: https://github.com/shinnn/is-var-name //
  if (Reflect_apply(String_prototype_trim, label, []) !== label) {
    return false;
  }
  try {
    new Function(identifier, "var "+identifier);
  } catch (error) {
    return false;
  }
  return true;
};

exports.undeclarables = {
  __proto__: null,
  "program": ["@this"],
  "eval": [],
  "closure": ["@callee", "@new.target", "@this", "@arguments"],
  "block": [],
  "then": [],
  "else": [],
  "while": [],
  "try": [],
  "catch": ["@error"],
  "finally": []
};

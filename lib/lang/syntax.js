"use strict";

const global_Reflect_apply = global.Reflect.apply;
const global_Function = global.Function;
const global_String_prototype_trim = global.String.prototype.trim;

exports["block"] = {
  __proto__: null,
  "BLOCK": [["identifier"], ["statement"]]
};

exports["statement"] = {
  __proto__: null,
  // BlockLess //
  "Lift": ["expression"],
  "Return": ["expression"],
  "Break": ["label"],
  "Continue": ["label"],
  "Debugger": [],
  // BlockFull //
  "Lone": [["label"], "lone-block"],
  "If": [["label"], "expression", "then-block", "else-block"],
  "While": [["label"], "expression", "while-block"],
  "Try": [["label"], "try-block", "catch-block", "finally-block"]
};

exports["expression"] = {
  __proto__: null,
  // Producers //
  "primitive": ["primitive"],
  "builtin": ["builtin-name"],
  "arrow": ["arrow-block"],
  "function": ["function-block"],
  "read": ["identifier"],
  // Consumers //
  "write": ["identifier", "expression"],
  "sequence": ["expression", "expression"],
  "conditional": ["expression", "expression", "expression"],
  "throw": ["expression"],
  "eval": [["identifier"], "expression"],
  // Combiners //
  "apply": ["expression", "expression", ["expression"]],
  "construct": ["expression", ["expression"]],
  "unary": ["unary-operator", "expression"],
  "binary": ["binary-operator", "expression", "expression"],
  "object": ["expression", [["expression", "expression"]]]
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

exports["primitive"] = (any) => {
  if (any === null || any === void 0) {
    return true;
  }
  if (typeof any === "boolean") {
    return true;
  }
  if (typeof any === "number") {
    return true;
  }
  if (typeof any === "bigint") {
    return true;
  }
  if (typeof any === "string") {
    return true;
  }
  return false;
};

const reserved = [
  // Keywords //
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "exports",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "await",  // context-dependent
  "let",    // strict mode
  "static", // strict mode
  "yield",  // context-dependent
  // FutureReservedWord //
  "enum",
  "implements", // strict mode
  "package",    // strict mode
  "protected",  // strict mode
  "interface",  // strict mode
  "private",    // strict mode
  "public",     // strict mode
  // NullLiteral
  "null",
  // BooleanLiteral //
  "true",
  "false"
];

// type Blacklist = [Identifier]
const check_name = (blacklist) => (any) => {
  if (typeof any !== "string") {
    return false;
  }
  if (!/^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u.test(any)) {
    return false;
  }
  for (let index = 0; index < reserved.length; index++) {
    if (reserved[index] === any) {
      return false;
    }
  }
  for (let index = 0; index < blacklist.length; index++) {
    if (blacklist[index] === any) {
      return false;
    }
  }
  return true;
};

exports["identifier"] = check_name(["arguments", "eval", "evalcheck", "root"]);

exports["label"] = check_name([]);

exports["parameters"] = {
  __proto__: null,
  "program": ["THIS"],
  "eval": [],
  "function": ["NEW_TARGET", "THIS", "ARGUMENTS"],
  "arrow": ["ARGUMENTS"],
  "lone": [],
  "then": [],
  "else": [],
  "while": [],
  "try": [],
  "catch": ["ERROR"],
  "finally": []
};

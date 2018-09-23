
const Util = require("util");
const ArrayLite = require("array-lite");
const Estree = require("./estree.js");
const FormatTyping = require("../format-typing.js");

const Array_isArray = Array.isArray;
const Object_keys = Object.keys;

ArrayLite.forEach(
  Object_keys(Estree),
  (key) => {
    exports[key] = (...array) => {
      duck(FormatTyping[key], array);
      return Estree[key](...array);
    };
  });

const error = (path, name, message, value) => new Error(path+" >> "+name+" >> "+message+" >> "+Util.inspect(value));

const duck = (path, type, value) => {
  if (Array_isArray(type)) {
    if (!Array_isArray(value))
      throw error(path, "array", "not an array", value);
    if (type.length === 1) {
      for (let index = 0; index < value.length; index++) {
        duck(path+"["index+"]", type[0], value[index])
      }
    } else if (type.length === value.length) {
      for (let index = 0; index < value.length; index++) {
        duck(path+"["index+"]", type[index], value[index]);
      }
    } else {
      throw error(path, "array", "length mismatch", value);
    }
  } else if (type === "identifier") {
    if (typeof value !== "string")
      throw error(path, "identifier", "not a string", value);
    if (!/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(value) && value !== "new.target")
      throw error(path, "identifier", "invalid", value);
  } else if (type === "label") {
    if (typeof value !== "string")
      throw error(path, "label", "not a string", value);
    if (!/^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(value))
      throw error(path, "label", "invalid", value);
  } else if (type === "expression") {
    if (typeof value !== "object" || value === null)
      throw error(path, "expression", "not an object", value);
    if (!ArrayLite.includes(etypes, value.type))
      throw error(path, "expression", "unrecognized type", value);
  } else if (type === "statement") {
    if (typeof value !== "object" || value === null)
      throw error(path, "statement", "not an object", value);
    if (!ArrayLite.includes(stypes, value.type))
      throw error(path, "statement", "unrecognized type", value);
  } else if (type === "kind") {
    if (!ArrayLite.includes(kinds, kind))
      throw error(path, "kind", "unrecognized", value);
  } else if (type === "primitive") {
    if (value && value !== true && typeof value !== "number" && typeof value !== "string")
      throw error(path, "primitive", "not a primitive", value);
  } else if (type === "unary") {
    if (!ArrayLite.includes(unaries, value))
      throw error(path, "unary", "unrecognized", value);
  } else if (type === "binary") {
    if (!ArrayLite.includes(binaries, value))
      throw error(path, "binary", "unrecognized", value);
  } else if (type === "string") {
    if (typeof value !== "string")
      throw error(path, "string", "not a string", value);
  } else {
    throw new Error("Invalid type at "+path);
  }
};

const etypes = [
  "MetaProperty",
  "ThisExpression",
  "Identifier",
  "AssignmentExpression",
  "ArrayExpression",
  "ObjectExpression",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "UnaryExpression",
  "Literal",
  "MemberExpression",
  "ConditionalExpression",
  "BinaryExpression",
  "UnaryExpression",
  "NewExpression",
  "CallExpression",
  "SequenceExpression"
];

const stypes = [
  "BlockStatement",
  "ExpressionStatement",
  "ReturnStatement",
  "ThrowStatement",
  "TryStatement",
  "VariableDeclaration",
  "IfStatement",
  "LabeledStatement",
  "BreakStatement",
  "WhileStatement",
  "DebuggerStatement",
  "SwitchStatement",
  "WithStatement"
];

const kinds = ["var", "let", "const"];

const unaries = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void"
];

const binaries = [
  "**",
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
  "instanceof",
  ".."
];

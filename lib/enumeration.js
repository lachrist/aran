
exports.GenericBuiltin = [
  "eval",
  "RegExp",
  "Reflect.get",
  "Reflect.set",
  "Reflect.construct",
  "Reflect.apply",
  "Reflect.deleteProperty",
  "Symbol.unscopables",
  "Symbol.iterator",
  "Object",
  "Object.setPrototypeOf",
  "Object.create",
  "Object.prototype",
  "Array.of",
  "Array.prototype.concat",
  "Array.prototype[Symbol.iterator]",
  "Function.prototype",
  "Object.getOwnPropertyDescriptor(Function.prototype,'arguments').get",
  "Object.getOwnPropertyDescriptor(Function.prototype,'arguments').set"
];

exports.AdhocBuiltin = [
  "global",
  "Object.fromEntries",
  "AranRest",
  "AranHold",
  "AranEnumerate",
  "AranThrowTypeError",
  "AranThrowReferenceError",
  "AranDefineDataProperty",
  "AranDefineAccessorProperty"
];

exports.UnaryOperator = [
  "-",
  "+",
  "!",
  "~",
  "typeof",
  "void",
  "delete"
];

exports.BinaryOperator = [
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

exports.CombinerTrap = [
  "apply",
  "construct",
  "unary",
  "binary"
];

exports.InformerTrap = [
  "program",
  "arrival",
  "enter",
  "leave",
  "continue",
  "break",
  "debugger"
];

exports.TransformerTrap = [
  // Error //
  "error",
  "abrupt",
  "throw",
  "failure",
  // Producers //
  "closure",
  "builtin",
  "primitive",
  "read",
  "argument",
  // Consumer //
  "drop",
  "eval",
  "test",
  "write",
  "return",
  "success"
];

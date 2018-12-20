
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
  "Object.getOwnPropertyDescriptor(Function.prototype, \"arguments\").get",
  "Object.getOwnPropertyDescriptor(Function.prototype, \"arguments\").set"
];

exports.AdhocBuiltin = [
  "global",
  "Object.entries",
  "Object.fromEntries",
  "AranRest",
  "AranHold",
  "AranUnary",
  "AranBinary",
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
  "construct"
];
exports.InformerTrap = [
  "arrival",
  "program",
  "closure",
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
  "return"
];

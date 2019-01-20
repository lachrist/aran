
exports.Primordial = [
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
  "Function.prototype",
  "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').get",
  "Reflect.getOwnPropertyDescriptor(Function.prototype,'arguments').set"
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

exports.ModifierTrap = [
  // Bystanders //
  "abrupt",
  "failure",
  // Producers //
  "closure",
  "primordial",
  "primitive",
  "read",
  "argument",
  "error",
  // Consumer //
  "drop",
  "eval",
  "test",
  "write",
  "return",
  "throw",
  "success"
];


// Matched with leave():
//   - program(boolean)
//   - block()
//   - try()
//   - catch(value)
//   - with(value)
//   - label(identifier)
//   - finally()
//   - switch()
//   - loop()
//
// Matched with return(value):
//   - 


module.exports = [
  // Combiners //
  "object",
  "array",
  "get",
  "set",
  "delete",
  "invoke",
  "apply",
  "construct",
  "unary",
  "binary",
  // Producers //
  "read",
  "discard",
  "builtin",
  "this",
  "arguments",
  "catch",
  "primitive",
  "regexp",
  "closure",
  // Consumers //
  "declare",
  "write",
  "test",
  "with",
  "throw",
  "return",
  "eval",
  // Informers //
  "program",
  "label",
  "block",
  "switch",
  "loop",
  "try",
  "finally",
  "leave",
  "continue",
  "break",
  "copy",
  "drop"];

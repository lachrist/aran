
const ArrayLite = require("array-lite");

exports._keywords = [
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
  "yield"];  // context-dependent

exports._future_reserved_words = [
  "enum",
  "implements", // strict mode
  "package",    // strict mode
  "protected",  // strict mode
  "interface",  // strict mode
  "private",    // strict mode
  "public"];    // strict mode

exports._literals = [
  "null",
  "true",
  "false"];

exports._aran_reserved_words = [
  "constructor",
  "root",
  "arguments",
  "eval",
  "evalcheck"];

exports._reserved_words = ArrayLite.concat(
  exports._keywords,
  exports._future_reserved_words,
  exports._literals,
  exports._aran_reserved_words);

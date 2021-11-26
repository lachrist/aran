import {includes} from "array-lite";
import {getIntrinsicArray} from "./intrinsics.mjs";

const {
  Reflect: {apply},
  RegExp: {
    prototype: {test: testRegExp},
  },
} = globalThis;

////////////
// Syntax //
////////////

const syntax = {
  __proto__: null,
  Program: {
    __proto__: null,
    ScriptProgram: [["Enclave", "*"], "Block"],
    ModuleProgram: [["Enclave", "*"], ["Link", "*"], "Block"],
    EvalProgram: [
      ["Enclave", "*"],
      ["VariableIdentifier", "*"],
      "VariableIdentifier",
      "Block",
    ],
  },
  Link: {
    __proto__: null,
    ImportLink: ["Specifier", "Source"],
    ExportLink: ["Specifier"],
    AggregateLink: ["Specifier", "Source", "Specifier"],
  },
  Block: {
    __proto__: null,
    Block: [
      ["VariableIdentifier", "*"],
      ["Statement", "*"],
    ],
  },
  Statement: {
    __proto__: null,
    // BlockLess //
    ExpressionStatement: ["Expression"],
    ReturnStatement: ["Expression"],
    BreakStatement: ["LabelIdentifier"],
    DebuggerStatement: [],
    DeclareEnclaveStatement: [
      "VariableKind",
      "WritableEnclaveVariableIdentifier",
      "Expression",
    ],
    // BlockFull //
    BlockStatement: [["LabelIdentifier", "*"], "Block"],
    IfStatement: [["LabelIdentifier", "*"], "Expression", "Block", "Block"],
    WhileStatement: [["LabelIdentifier", "*"], "Expression", "Block"],
    TryStatement: [["LabelIdentifier", "*"], "Block", "Block", "Block"],
  },
  Expression: {
    __proto__: null,
    // Producer //
    PrimitiveExpression: ["Primitive"],
    IntrinsicExpression: ["Intrinsic"],
    LoadImportExpression: ["Specifier", "Source"],
    ReadExpression: ["VariableIdentifier"],
    ReadEnclaveExpression: ["ReadableEnclaveVariableIdentifier"],
    TypeofEnclaveExpression: ["ReadableEnclaveVariableIdentifier"],
    ClosureExpression: ["ClosureKind", "Asynchronous", "Generator", "Block"],
    // Consumer //
    AwaitExpression: ["Expression"],
    YieldExpression: ["Delegate", "Expression"],
    SaveExportExpression: ["Specifier", "Expression", "Expression"],
    WriteExpression: ["VariableIdentifier", "Expression", "Expression"],
    WriteEnclaveExpression: [
      "WritableEnclaveVariableIdentifier",
      "Expression",
      "Expression",
    ],
    SequenceExpression: ["Expression", "Expression"],
    ConditionalExpression: ["Expression", "Expression", "Expression"],
    ThrowExpression: ["Expression"],
    // Combiners //
    SetSuperEnclaveExpression: ["Expression", "Expression"],
    GetSuperEnclaveExpression: ["Expression"],
    CallSuperEnclaveExpression: ["Expression"],
    EvalExpression: [
      ["Enclave", "*"],
      ["VariableIdentifier", "*"],
      "VariableIdentifier",
      "Expression",
    ],
    ImportExpression: ["Expression"],
    ApplyExpression: ["Expression", "Expression", ["Expression", "*"]],
    ConstructExpression: ["Expression", ["Expression", "*"]],
    UnaryExpression: ["UnaryOperator", "Expression"],
    BinaryExpression: ["BinaryOperator", "Expression", "Expression"],
    ObjectExpression: ["Expression", [["Expression", "Expression"], "*"]],
  },
};

export const getSyntax = () => syntax;

/////////////
// Belongs //
/////////////

const generateIsEnumeration = (enumeration) => (any) =>
  includes(enumeration, any);

/* eslint-disable valid-typeof */
const generateIsType = (type) => (any) => typeof any === type;
/* eslint-enable valid-typeof */

const isIdentifier = (string) =>
  apply(
    testRegExp,
    /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
    [string],
  );

const aran_keywords = [
  "enclave",
  "error",
  "arrow",
  "method",
  "constructor",
  "aggregate",
];

const keywords = [
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
  "await", // context-dependent
  "let", // strict mode
  "static", // strict mode
  "yield", // context-dependent
  // FutureReservedWord //
  "enum",
  "implements", // strict mode
  "package", // strict mode
  "protected", // strict mode
  "interface", // strict mode
  "private", // strict mode
  "public", // strict mode
  // NullLiteral
  "null",
  // BooleanLiteral //
  "true",
  "false",
  // Special //
  "arguments",
  "eval",
];

const predicates = {
  __proto__: null,
  Enclave: generateIsEnumeration([
    "super",
    "super()",
    "new.target",
    "arguments",
    "this",
    "var",
  ]),
  VariableKind: generateIsEnumeration(["var", "let", "const"]),
  ClosureKind: generateIsEnumeration([
    "arrow",
    "function",
    "constructor",
    "method",
  ]),
  BinaryOperator: generateIsEnumeration([
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
  ]),
  UnaryOperator: generateIsEnumeration([
    "-",
    "+",
    "!",
    "~",
    "typeof",
    // delete,
    "void",
  ]),
  Intrinsic: generateIsEnumeration(getIntrinsicArray()),
  Strict: generateIsType("boolean"),
  Asynchronous: generateIsType("boolean"),
  Generator: generateIsType("boolean"),
  Delegate: generateIsType("boolean"),
  Source: generateIsType("string"),
  Primitive: (any) =>
    any === "null" ||
    any === "undefined" ||
    any === "true" ||
    any === "false" ||
    (typeof any === "string" && apply(testRegExp, /^['".0-9]/u, [any])),
  Specifier: (any) =>
    any === null || (typeof any === "string" && isIdentifier(any)),
  ReadableEnclaveVariableIdentifier: (any) =>
    typeof any === "string" &&
    (any === "new.target" ||
      any === "this" ||
      any === "eval" ||
      any === "arguments" ||
      (isIdentifier(any) && !includes(keywords, any))),
  WritableEnclaveVariableIdentifier: (any) =>
    typeof any === "string" && isIdentifier(any) && !includes(keywords, any),
  LabelIdentifier: (any) =>
    typeof any === "string" &&
    isIdentifier(any) &&
    !includes(keywords, any) &&
    !includes(aran_keywords, any),
  VariableIdentifier: (any) =>
    typeof any === "string" &&
    isIdentifier(any) &&
    !includes(keywords, any) &&
    !includes(aran_keywords, any),
};

export const isSyntaxType = (any, type) => {
  const predicate = predicates[type];
  return predicate(any);
};

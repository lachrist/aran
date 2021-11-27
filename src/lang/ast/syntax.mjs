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
    ScriptProgram: ["Block"],
    ModuleProgram: [["Link", "*"], "Block"],
    EvalProgram: [["Enclave", "*"], ["Variable", "*"], "Block"],
  },
  Link: {
    __proto__: null,
    ImportLink: ["NullableSpecifier", "Source"],
    ExportLink: ["Specifier"],
    AggregateLink: ["NullableSpecifier", "NullableSpecifier", "Source"],
  },
  Block: {
    __proto__: null,
    Block: [
      ["Label", "*"],
      ["Variable", "*"],
      ["Statement", "*"],
    ],
  },
  Statement: {
    __proto__: null,
    // BlockLess //
    ExpressionStatement: ["Expression"],
    ReturnStatement: ["Expression"],
    BreakStatement: ["Label"],
    DebuggerStatement: [],
    DeclareEnclaveStatement: [
      "VariableKind",
      "WritableEnclaveVariable",
      "Expression",
    ],
    // BlockFull //
    BlockStatement: ["Block"],
    IfStatement: ["Expression", "Block", "Block"],
    WhileStatement: ["Expression", "Block"],
    TryStatement: ["Block", "Block", "Block"],
  },
  Expression: {
    __proto__: null,
    // Producer //
    PrimitiveExpression: ["Primitive"],
    IntrinsicExpression: ["Intrinsic"],
    LoadImportExpression: ["NullableSpecifier", "Source"],
    ReadExpression: ["Variable"],
    ReadEnclaveExpression: ["ReadableEnclaveVariable"],
    TypeofEnclaveExpression: ["ReadableEnclaveVariable"],
    ClosureExpression: ["ClosureKind", "Asynchronous", "Generator", "Block"],
    // Consumer //
    AwaitExpression: ["Expression"],
    YieldExpression: ["Delegate", "Expression"],
    SaveExportExpression: ["Specifier", "Expression", "Expression"],
    WriteExpression: ["Variable", "Expression", "Expression"],
    WriteEnclaveExpression: [
      "WritableEnclaveVariable",
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
    EvalExpression: [["Enclave", "*"], ["Variable", "*"], "Expression"],
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
  NullableSpecifier: (any) =>
    any === null || (typeof any === "string" && isIdentifier(any)),
  Specifier: (any) => typeof any === "string" && isIdentifier(any),
  ReadableEnclaveVariable: (any) =>
    typeof any === "string" &&
    (any === "new.target" ||
      any === "this" ||
      any === "eval" ||
      any === "arguments" ||
      (isIdentifier(any) && !includes(keywords, any))),
  WritableEnclaveVariable: (any) =>
    typeof any === "string" && isIdentifier(any) && !includes(keywords, any),
  Label: (any) =>
    typeof any === "string" &&
    isIdentifier(any) &&
    !includes(keywords, any) &&
    !includes(aran_keywords, any),
  Variable: (any) =>
    typeof any === "string" &&
    isIdentifier(any) &&
    !includes(keywords, any) &&
    !includes(aran_keywords, any),
};

export const isSyntaxType = (any, type) => {
  const predicate = predicates[type];
  return predicate(any);
};

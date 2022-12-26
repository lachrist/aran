import { includes } from "array-lite";
import { hasOwn, assert, partialx_, partial_x } from "../util/index.mjs";
import { isLiteral } from "./literal.mjs";
import { getIntrinsicArray } from "./intrinsics.mjs";

const {
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
} = globalThis;

////////////
// Syntax //
////////////

const syntax = {
  Program: {
    ScriptProgram: [["Statement", "*"]],
    ModuleProgram: [["Link", "*"], "Block"],
    EvalProgram: ["Block"],
  },
  Link: {
    ImportLink: ["Source", "NullableSpecifier"],
    ExportLink: ["Specifier"],
    AggregateLink: ["Source", "NullableSpecifier", "NullableSpecifier"],
  },
  Block: {
    Block: [
      ["Label", "*"],
      ["Variable", "*"],
      ["Statement", "*"],
    ],
  },
  Statement: {
    // BlockLess //
    EffectStatement: ["Effect"],
    ReturnStatement: ["Expression"],
    BreakStatement: ["Label"],
    DebuggerStatement: [],
    DeclareExternalStatement: ["DeclareType", "Variable", "Expression"],
    // BlockFull //
    BlockStatement: ["Block"],
    IfStatement: ["Expression", "Block", "Block"],
    WhileStatement: ["Expression", "Block"],
    TryStatement: ["Block", "Block", "Block"],
  },
  Effect: {
    WriteEffect: ["Variable", "Expression"],
    WriteExternalEffect: ["Variable", "Expression"],
    ExportEffect: ["Specifier", "Expression"],
    SequenceEffect: ["Effect", "Effect"],
    ConditionalEffect: ["Expression", "Effect", "Effect"],
    ExpressionEffect: ["Expression"],
  },
  Expression: {
    // Producer //
    ParameterExpression: ["Parameter"],
    LiteralExpression: ["Literal"],
    IntrinsicExpression: ["Intrinsic"],
    ImportExpression: ["Source", "NullableSpecifier"],
    ReadExpression: ["Variable"],
    ReadExternalExpression: ["Variable"],
    TypeofExternalExpression: ["Variable"],
    ClosureExpression: ["ClosureType", "Asynchronous", "Generator", "Block"],
    // Control //
    AwaitExpression: ["Expression"],
    YieldExpression: ["Delegate", "Expression"],
    SequenceExpression: ["Effect", "Expression"],
    ConditionalExpression: ["Expression", "Expression", "Expression"],
    // Combiners //
    EvalExpression: ["Expression"],
    ApplyExpression: ["Expression", "Expression", ["Expression", "*"]],
    // InvokeExpression: ["Expression", "Expression", ["Expression", "*"]],
    ConstructExpression: ["Expression", ["Expression", "*"]],
  },
};

export const getSyntax = () => syntax;

/////////////
// Belongs //
/////////////

/* eslint-disable valid-typeof */
const isTypeof = (any, type) => typeof any === type;
/* eslint-enable valid-typeof */

// const keywords = [
//   // Keywords //
//   "break",
//   "case",
//   "catch",
//   "class",
//   "const",
//   "continue",
//   "debugger",
//   "default",
//   "delete",
//   "do",
//   "else",
//   "exports",
//   "extends",
//   "finally",
//   "for",
//   "function",
//   "if",
//   "import",
//   "in",
//   "instanceof",
//   "new",
//   "return",
//   "super",
//   "switch",
//   "this",
//   "throw",
//   "try",
//   "typeof",
//   "var",
//   "void",
//   "while",
//   "with",
//   "await", // context-dependent
//   "let", // strict mode
//   "static", // strict mode
//   "yield", // context-dependent
//   // FutureReservedWord //
//   "enum",
//   "implements", // strict mode
//   "package", // strict mode
//   "protected", // strict mode
//   "interface", // strict mode
//   "private", // strict mode
//   "public", // strict mode
//   // NullLiteral
//   "null",
//   // BooleanLiteral //
//   "true",
//   "false",
// ];

const isIdentifier = (any) =>
  typeof any === "string" &&
  apply(
    testRegExp,
    /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
    [any],
  );

const parameters = [
  "error",
  "arguments",
  "this",
  "import",
  "import.meta",
  "new.target",
  "super.get",
  "super.set",
  "super.call",
];

const predicates = {
  Parameter: partialx_(includes, parameters),
  DeclareType: partialx_(includes, ["var", "let", "const"]),
  ClosureType: partialx_(includes, [
    "arrow",
    "function",
    "constructor",
    "method",
  ]),

  Intrinsic: partialx_(includes, getIntrinsicArray()),
  Strict: partial_x(isTypeof, "boolean"),
  Asynchronous: partial_x(isTypeof, "boolean"),
  Generator: partial_x(isTypeof, "boolean"),
  Delegate: partial_x(isTypeof, "boolean"),
  Source: partial_x(isTypeof, "string"),
  Literal: isLiteral,
  Specifier: isIdentifier,
  NullableSpecifier: (any) => any === null || isIdentifier(any),
  Label: isIdentifier,
  Variable: isIdentifier,
};

export const isSyntaxType = (any, type) => {
  assert(hasOwn(predicates, type), "missing predicate");
  const predicate = predicates[type];
  return predicate(any);
};

import {includes} from "array-lite";
import {getIntrinsicArray} from "./intrinsics.mjs";
import {isLiteral} from "./literal.mjs";

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
    ScriptProgram: [["Statement", "*"]],
    ModuleProgram: [["Link", "*"], "Block"],
    GlobalEvalProgram: ["Block"],
    InternalLocalEvalProgram: [["Variable", "*"], "Block"],
    ExternalLocalEvalProgram: [["Enclave", "*"], "Block"],
  },
  Link: {
    __proto__: null,
    ImportLink: ["Source", "NullableSpecifier"],
    ExportLink: ["Specifier"],
    AggregateLink: ["Source", "NullableSpecifier", "NullableSpecifier"],
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
    EffectStatement: ["Effect"],
    ReturnStatement: ["Expression"],
    BreakStatement: ["Label"],
    DebuggerStatement: [],
    DeclareStatement: ["DeclareType", "Variable", "Expression"],
    // BlockFull //
    BlockStatement: ["Block"],
    IfStatement: ["Expression", "Block", "Block"],
    WhileStatement: ["Expression", "Block"],
    TryStatement: ["Block", "Block", "Block"],
  },
  Effect: {
    __proto__: null,
    WriteEffect: ["Variable", "Expression"],
    ExportEffect: ["Specifier", "Expression"],
    SequenceEffect: ["Effect", "Effect"],
    ConditionalEffect: ["Expression", "Effect", "Effect"],
    ExpressionEffect: ["Expression"],
  },
  Expression: {
    __proto__: null,
    // Producer //
    InputExpression: [],
    LiteralExpression: ["Literal"],
    IntrinsicExpression: ["Intrinsic"],
    ImportExpression: ["Source", "NullableSpecifier"],
    ReadExpression: ["Variable"],
    ClosureExpression: ["ClosureType", "Asynchronous", "Generator", "Block"],
    // Control //
    AwaitExpression: ["Expression"],
    YieldExpression: ["Delegate", "Expression"],
    SequenceExpression: ["Effect", "Expression"],
    ConditionalExpression: ["Expression", "Expression", "Expression"],
    // Combiners //
    EvalExpression: [["Variable", "*"], "Expression"],
    ApplyExpression: ["Expression", "Expression", ["Expression", "*"]],
    // InvokeExpression: ["Expression", "Expression", ["Expression", "*"]],
    ConstructExpression: ["Expression", ["Expression", "*"]],
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

const isIdentifier = (any) =>
  typeof any === "string" &&
  apply(
    testRegExp,
    /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
    [any],
  );

const predicates = {
  __proto__: null,
  Enclave: generateIsEnumeration([
    "this",
    "new.target",
    "import.meta",
    "super.get",
    "super.set",
    "super.call",
  ]),
  DeclareType: generateIsEnumeration(["var", "let", "const"]),
  ClosureType: generateIsEnumeration([
    "arrow",
    "function",
    "constructor",
    "method",
  ]),
  Intrinsic: generateIsEnumeration(getIntrinsicArray()),
  Strict: generateIsType("boolean"),
  Asynchronous: generateIsType("boolean"),
  Generator: generateIsType("boolean"),
  Delegate: generateIsType("boolean"),
  Source: (any) => typeof any === "string",
  Literal: isLiteral,
  Specifier: isIdentifier,
  NullableSpecifier: (any) => any === null || isIdentifier(any),
  Variable: (any) => isIdentifier(any) && !includes(keywords, any),
  Label: (any) => isIdentifier(any) && !includes(keywords, any),
};

export const isSyntaxType = (any, type) => {
  const predicate = predicates[type];
  return predicate(any);
};

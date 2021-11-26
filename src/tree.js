"use strict";

import {includes} from "array-lite";
import * from "./util.mjs";

const {
  JSON: {stringify:stringifyJSON},
  RegExp: {prototype:{test:testRegExp}},
  Array: {isArray},
  Proxy,
  WeakMap,
  WeakMap: {prototype:{has:hasWeakMap, get:getWeakMap, set:setWeakMap}},
  Reflect: {ownKeys, apply, defineProperty},
  Function,
  String: {prototype:{trimString}},
} = globalThis;

// type Identifier = {"foo", "bar", ...}
// type Label = {"foo", "bar", "eval", ...}
// type Primitive = Null U Undefined U Boolean U Number U String
// type Unary = {"-", "!", ...}
// type Binary = {"-", "+", ...}
// type Intrinsic = {"Reflect.get", ...}
// type Parameter = {"ERROR", "THIS", "NEW_TARGET", "ARGUMENTS"}
//
// type FieldType = {"expression", ...}
//
// type Constructor = BlockConstructor U StatementConstructor U ExpressionConstructor
// type BlockConstructor = {"Block"}
// type StatementConstructor = {"ExpressionStatement", ...}
// type ExpressionConstructor = {"primitive", ...}

////////////
// Syntax //
////////////

export const syntax = {
  __proto__: null,
  Program: {
    __proto__: null,
    ScriptProgram: [["Enclave" "*"], "Block"],
    ModuleProgram: [["Enclave", "*"], ["Link", "*"], "Block"],
    EvalProgram: [["Enclave", "*"], ["VariableIdentifier", "*"], "VariableIdentifier", "Block"],
  },
  Link: {
    __proto__: null,
    ImportLink: ["Specifier", "Source"],
    ExportLink: ["Specifier"],
    AggregateLink: ["Specifier", "Source", "Specifier"]
  },
  Block: {
    __proto__: null,
    Block: [["VariableIdentifier", "*"], ["Statement", "*"]]
  },
  Statement: {
    __proto__: null,
    // BlockLess //
    ExpressionStatement: ["Expression"],
    ReturnStatement: ["Expression"],
    BreakStatement: ["LabelIdentifier"],
    DebuggerStatement: [],
    DeclareEnclaveStatement: ["VariableKind", "WritableEnclaveVariableIdentifier", "Expression"],
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
    ReadImportExpression: ["Specifier", "Source"],
    ReadVariableExpression: ["VariableIdentifier"],
    ReadEnclaveExpression: ["ReadableEnclaveVariableIdentifier"],
    TypeofEnclaveExpression: ["ReadableEnclaveVariableIdentifier"],
    ClosureExpression: ["ClosureKind", "Asynchronous", "Generator", "Block"],
    // Consumer //
    AwaitExpression: ["Expression"],
    YieldExpression: ["Delegate", "Expression"],
    WriteExportExpression: ["Specifier", "Expression", "Expression"],
    WriteVariableExpression: ["VariableIdentifier", "Expression", "Expression"],
    WriteEnclaveExpression: ["WritableEnclaveVariableIdentifier", "Expression", "Expression"],
    SequenceExpression: ["Expression", "Expression"],
    ConditionalExpression: ["Expression", "Expression", "Expression"],
    ThrowExpression: ["Expression"],
    // Combiners //
    SetSuperEnclaveExpression: ["Expression", "Expression"],
    GetSuperEnclaveExpression: ["Expression"],
    CallSuperEnclaveExpression: ["Expression"],
    EvalExpression: [["Enclave", "*"], ["VariableIdentifier", "*"], "VariableIdentifier", "Expression"],
    ImportExpression: ["Expression"],
    ApplyExpression: ["Expression", "Expression", ["Expression", "*"]],
    ConstructExpression: ["Expression", ["Expression", "*"]],
    UnaryExpression: ["UnaryOperator", "Expression"],
    BinaryExpression: ["BinaryOperator", "Expression", "Expression"],
    ObjectExpression: ["Expression", [["Expression", "Expression"], "*"]]
  },
};

export const enumerations = {
  __proto__: null,
  Enclave: [
    "super",
    "super()",
    "new.target",
    "arguments",
    "this",
    "let",
    "const",
    "var",
    "*",
  ],
  VariableKind: ["var", "let", "const"],
  ClosureKind: ["arrow", "function", "constructor", "method"],
  Enclave: [
    null,
    // Module //
    "module",
    // Script //
    "script",
    // Eval //
    "strict-derived-constructor",
    "strict-constructor",
    "strict-method", "sloppy-method",
    "strict-function", "sloppy-function",
    "sloppy-program",
    "strict-program",
    "confined"
  ],
  BinaryOperator: [
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
  ],
  UnaryOperator: [
    "-",
    "+",
    "!",
    "~",
    "typeof",
    // delete,
    "void"
  ],
  AranKeyword: [
    "enclave",
    "error",
    "arrow",
    "method",
    "constructor",
    "aggregate",
    "require",
    "completion"
  ],
  Keyword: [
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
    "await",  // context-dependent
    "let",    // strict mode
    "static", // strict mode
    "yield",  // context-dependent
    // FutureReservedWord //
    "enum",
    "implements", // strict mode
    "package",    // strict mode
    "protected",  // strict mode
    "interface",  // strict mode
    "private",    // strict mode
    "public",     // strict mode
    // NullLiteral
    "null",
    // BooleanLiteral //
    "true",
    "false",
    // Special //
    "arguments",
    "eval"
  ],
  Intrinsic: [
    // Special //
    // "aran.globalObjectRecord",
    "aran.globalRecord",
    "aran.deadzoneMarker",
    "aran.asynchronousGeneratorPrototype",
    "aran.generatorPrototype",
    // Grabbable //
    "globalThis",
    "Object", // Convertion inside destructuring pattern + super
    "Reflect.defineProperty", // Proxy Arguments trap :(
    "eval",
    "Symbol",
    "Symbol.unscopables",
    "Symbol.asyncIterator",
    "Symbol.iterator",
    "Symbol.isConcatSpreadable",
    "Function.prototype.arguments@get",
    "Function.prototype.arguments@set",
    "Array.prototype.values",
    "Object.prototype",
    // Convertion //
    "String",
    // Object
    "Array.from",
    // Construction //
    "Object.create",
    "Array.of",
    "Proxy",
    "RegExp",
    "TypeError",
    "ReferenceError",
    "SyntaxError",
    // Readers //
    "Reflect.get",
    "Reflect.has",
    "Reflect.construct",
    "Reflect.apply",
    "Reflect.getPrototypeOf",
    "Reflect.ownKeys",
    "Reflect.isExtensible",
    "Object.keys",
    "Array.prototype.concat",
    "Array.prototype.includes",
    "Array.prototype.slice",
    // Writers //
    "Reflect.set",
    "Reflect.deleteProperty",
    "Reflect.setPrototypeOf",
    // "Reflect.defineProperty",
    "Reflect.getOwnPropertyDescriptor",
    "Reflect.preventExtensions",
    "Object.assign",
    "Object.freeze",
    "Object.defineProperty",
    "Object.setPrototypeOf",
    "Object.preventExtensions",
    "Array.prototype.fill",
    "Array.prototype.push"
  ],
};

export const type = {
  __proto__: null,
  Strict: ["boolean"],
  Asynchronous: ["boolean"],
  Generator: ["boolean"],
  Delegate: ["boolean"],
  Source: ["string"],
  Primitive: [null, void 0, "boolean", "number", "bigint", "string"],
};

const isName = (string) => apply(
  testRegExp,
  /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
  [string],
);

export dynamic = {
  __proto__: null,
  Specifier: (any) => (
    any === null ||
    (
      typeof any === "string" &&
      isName(any)
    )
  ),
  ReadableEnclaveVariableIdentifier: (any) => (
    typeof any === "string" &&
    (
      any === "new.target" ||
      any === "this" ||
      any === "eval" ||
      any === "arguments" ||
      (
        isName(any) &&
        !includes(enumerations.Keyword, any)
      )
    )
  ),
  WritableEnclaveVariableIdentifier: (any) => (
    typeof any === "string" &&
    isName(any) &&
    !includes(enumerations.Keyword, any)
  ),
  LabelIdentifier: (any) => (
    typeof any === "string" &&
    isName(any) &&
    !includes(enumerations.Keyword, any) &&
    !includes(enumerations.AranKeyword, any)
  ),
  VariableIdentifier: (any) => (
    typeof any === "string" &&
    isName(any) &&
    !includes(enumerations.Keyword, any) &&
    !includes(enumerations.AranKeyword, any)
  ),
};

////////////////
// Digestable //
////////////////

const digestable = [
  "ImportLink",
  "ExportLink",
  "AggregateLink",
  "BreakStatement",
  "DeclareEnclaveStatement",
  "ImportExpression",
  "ExportExpression",
  "ReadExpression",
  "ReturnStatement",
  "ReadEnclaveExpression",
  "TypeofEnclaveExpression",
  "AwaitExpression",
  "YieldExpression",
  "ExportExpression",
  "WriteExpression",
  "WriteEnclaveExpression",
  "GetSuperEnclaveExpression",
  "SetSuperEnclaveExpression",
  "CallSuperEnclaveExpression",
];

const generateIsType = (type) => (node) => node[0] === type;

const isImportLink = generateIsType("ImportLink");
const isExportLink = generateIsType("ExportLink");
const isAggregateLink = generateIsType("AggregateLink");
const isBreakStatement = generateIsType("BreakStatement");
const isDeclareEnclaveStatement = generateIsType("DeclareEnclaveStatement");
const isImportExpression = generateIsType("ImportExpression");
const isExportExpression = generateIsType("ExportExpression");
const isReadExpression = generateIsType("ReadExpression");
const isReturnStatement = generateIsType("ReturnStatement");
const isReadEnclaveExpression = generateIsType("ReadEnclaveExpression");
const isTypeofEnclaveExpression = generateIsType("TypeofEnclaveExpression");
const isAwaitExpression = generateIsType("AwaitExpression");
const isYieldExpression = generateIsType("YieldExpression");
const isExportExpression = generateIsType("ExportExpression");
const isWriteExpression = generateIsType("WriteExpression");
const isWriteEnclaveExpression = generateIsType("WriteEnclaveExpression");
const isGetSuperEnclaveExpression = generateIsType("GetSuperEnclaveExpression");
const isSetSuperEnclaveExpression = generateIsType("SetSuperEnclaveExpression");
const isCallSuperEnclaveExpression = generateIsType("CallSuperEnclaveExpression");

const isRigidDeclareEnclaveStatement = (node) => node[0] = "DeclareEnclaveStatement" && (node[1] === "let" || node[1] === "const");
const generateIsBoundBreakStatement = (identifiers) => (node) => node[0] === "BreakStatement" && includes(identifiers, node[1]);
const generateIsBoundVariableStatement = (identifiers) => (node) => (node[0] === "ReadVariableExpression" || node[0] === "WriteVariableExpression") && includes(indentifiers, node[1])
const isClosureVariableEnclaveExpression = (identifiers) => (node) => (
  node[0] === "ReadVariableEnclaveExpression" ||
  node[0] === "WriteVariableEnclaveVariableIdentifier"
) && (
  node[1] === "this" ||
  node[1] === "new.target" ||
  node[1] === "arguments"
)

const dummies = {
  __proto__: null,
  "super": ["GetSuperEnclaveExpression", ["PrimitiveExpression", "dummy"]],
  "super()": ["CallSuperEnclaveExpression", ["PrimitiveExpression", "dummy"]],
  "new.target": ["ReadEnclaveExpression", "new.target"],
  "arguments": ["ReadEnclaveExpression", "arguments"],
  "this": ["ReadEnclaveExpression", "this"],
  "let": ["DeclareEnclaveStatement", "let", "dummy", ["PrimitiveExpression", "dummy"]],
  "const": ["DeclareEnclaveStatement", "const", "dummy", ["PrimitiveExpression", "dummy"]],
  "var": ["DeclareEnclaveStatement", "var", "dummy", ["PrimitiveExpression", "dummy"]],
  "*": ["ReadEnclaveExpression", "dummy"],
};

const makeEnclaveDummy = (enclave) => dummies[enclave];

const makeReadExpression = (identifier) => ["ReadExpression", identifier];

const digesters = {
  __proto__: null,
  BlockStatement: (identifiers, digests) => {
    const digest = filterOut(flaten(digests), generateIsBoundVariableStatement(identifiers));
    assert(!some(digest, isRigitDeclareEnclaveStatement), "rigid DeclareEnclaveStatement in BlockStatement");
    assert(!some(digest, isImportLink), "ImportLink in BlockStatement");
    assert(!some(digest, isExportLink), "ExportLink in BlockStatement");
    assert(!some(digest, isAggregateLink), "AggregateLink in BlockStatement");
    return digest;
  },
  ClosureExpression: (kind, generator, asynchronous, digest) => {
    digest = filter(digest, isReturnStatement);
    if (generator) {
      assert(kind !== "arrow" && kind !== "constructor", "arrow/constructor generator ClosureExpression");
      digest = filter(digest, isYieldExpression);
    } else {
      assert(!some(digest, isYieldExpression), "YieldExpression in non-generator ClosureExpression");
    }
    if (asynchronous) {
      assert(kind !== "constructor", "constructor asynchronous ClosureExpression");
      digest = filter(digest, isAwaitExpression);
    } else {
      assert(!some(digest, isAwaitExpression), "AwaitExpression in non-asynchronous ClosureExpression");
    }
    if (kind !== "arrow") {
      assert(!some(isClosureVariableEnclaveExpression), "closure EnclaveVariableExpression in ClosureExpression");
    }
    assert(!some(digest, isDeclareEnclaveStatement), "DeclareEnclaveStatement in ClosureExpression");
    assert(!some(digest, isGetSuperEnclaveExpression), "GetSuperEnclaveExpression in ClosureExpression");
    assert(!some(digest, isSetSuperEnclaveExpression), "SetSuperEnclaveExpression in ClosureExpression");
    assert(!some(digest, isImportLink), "ImportLink in ClosureExpression");
    assert(!some(digest, isExportLink), "ExportLink in ClosureExpression");
    assert(!some(digest, isAggregateLink), "AggregateLink in ClosureExpression");
    assert(!some(digest, isBreakStatement), "unbound BreakStatement in ClosureExpression");
    return digest;
  },
  IfStatement: (labels, digest1, digest2, digest3) => concat(
    digest1,
    filterOut(concat(digest2, digest3), generateIsBoundBreakStatement(labels))
  ),
  WhileStatement: (labels, digest1, digest2) => concat(
    digest1,
    filterOut(digest2, generateIsBoundBreakStatement(labels)),
  ),
  TryStatement: (labels, digest1, digest2, digest3) => filterOut(
    concat(digest1, digest2, digest3),
    generateIsBoundBreakStatement(labels),
  ),
  ExportExpression: (specifier) => {
    assert(specifier !== null, "ExportExpression specifier cannot be null");
    return empty_digest;
  },
  EvalExpression: (enclaves, identifiers, identifier, digest) => concat(
    digest,
    map(enclaves, makeEnclaveDummy),
    map(identifiers, makeReadExpression),
  ),
};

const database = new WeakMap();



const validators = {
  __proto__: null,
  // Program //
  ScriptProgram: (enclaves, digest) => checkoutDigest(captureEnclave(enclaves, digest)),
  ModuleProgram: (enclaves, digests, digest) => checkoutDigest(captureEnclave(enclaves, reduce(digests, combineDigest, digest))),
  EvalProgram: (enclaves, identifiers, identifier, digest, digest) => {
    assert(includes(identifiers, identifier), "completion identifier is not declared ");
  },
  // Link //
  ImportLink: (specifier, source) => ({
    __proto__: null,
    ... empty_digest,
    links: [
      {
        __proto__: null,
        type: "import",
        specifier,
        source
      }
    ]
  }),
  ExportLink: (specifier) => {
    assert(specifier !== null, "export specifier cannot be null");
    return {
      __proto__: null,
      ... empty_digest,
      links: [{
        __proto__: null,
        type: "export",
        specifier
      }]
    };
  },
  AggregateLink: (specifier1, source, specifier2) => {
    assert(specifier1 === null || specifier2 !== null, "export specifier of an aggregate link cannot be null when its import specifier is not null"),
    return {
      __proto__: null,
      ... empty_digest,
      links: [
        {
          __proto__: null,
          type: "aggregate",
          import_specifier: specifier1,
          import_source: source,
          export_specififer: specifier2
        }
      ]
    };
  },
  // Block //
  Block: (identifiers, digests) => {
    assert(!digest.enclaves.includes("let") && !digest.enclaves.includes("const"), "cannot have rigid enclave variable declaration inside blocks");
    const digest = reduce(digests, combineDigest, empty_digest);
    return {
      __proto__: null,
      ... digest,
      variables: removeAll(digest.variables, identifiers),
    };
  },
  // Statement >> Atomic //
  ExpressionStatement: (digest) => digest,
  ReturnStatement: (digest) => digest,
  BreakStatement: (label) => ({
    __proto__: null,
    ... empty_digest,
    labels: [label],
  }),
  DebuggerStatement: () => empty_digest,
  DeclareEnclaveStatement: (kind, identifier, digest) => ({
    ... digest,
    enclaves: concat(digest.enclaves, kind),
  }),
  // Statement >> Compound //
  BlockStatement: (labels, digest) => digest,
  IfStatement: (digest1, digest2, digest3) => combine(
    check_not_assignment(digest1),
    combine(digest2, digest3)),
  WhileStatement: (digest1, digest2) => combine(
    check_not_assignment(digest1),
    digest2),
  TryStatement: (digest1, digest2, digest3) => combine(
    digest1,
    combine(digest2, digest3)),
  // Expression >> Producer //
  ImportExpression: (specifier, source) => ({
    __proto__: empty,
    links: [
      {
        __proto__: null,
        type: "import",
        specifier,
        source}]}),
  PrimitiveExpression: (primitive) => empty,
  IntrinsicExpression: (intrinsic) => empty,
  ReadExpression: (identifier) => ({
    __proto__: empty,
    variables: [identifier]}),
  ReadEnclaveExpression: (identifier) => ({
    __proto__: empty,
    [identifier in key_object_2 ? key_object_2[identifier] : "enclave_variable"]: true}),
  TypeofEnclaveExpression: (identifier) => ({
    __proto__: empty,
    [identifier in key_object_2 ? key_object_2[identifier] : "enclave_variable"]: true}),
  ClosureExpression: (sort, asynchronous, generator, digest) => (
    Throw.assert(
      !digest.enclave_loose_variable,
      null,
      `loose enclave variable declaration in closure`),
    Throw.assert(
      sort === "arrow" || !digest.enclave_super_call,
      null,
      `enclave super(...) in non-arrow closure expression`),
    Throw.assert(
      sort === "arrow" || !digest.enclave_super_access,
      null,
      `enclave super[...] in non-arrow closure expression`),
    Throw.assert(
      sort === "arrow" || !digest.enclave_new_target,
      null,
      `enclave new.target in non-arrow closure expression`),
    Throw.assert(
      sort === "arrow" || !digest.enclave_this,
      null,
      `enclave this in non-arrow closure expression`),
    Throw.assert(
      sort === "arrow" || !digest.enclave_arguments,
      null,
      `enclave arguments in non-arrow closure expression`),
    Throw.assert(
      digest.labels.length === 0,
      null,
      `Closure-unbound label: ${digest.labels[0]}`),
    Throw.assert(
      asynchronous || !digest.await,
      null,
      `Await expression inside non-asynchronous closure expression`),
    Throw.assert(
      generator || !digest.yield,
      null,
      `Yield expression inside non-generator closure expression`),
    Throw.assert(
      sort !== "arrow" || !generator,
      null,
      `Arrow closure expression cannot be generator`),
    Throw.assert(
      sort !== "method" || !generator,
      null,
      `Method closure expression cannot be generator`),
    Throw.assert(
      sort !== "constructor" || (!generator && !asynchronous),
      null,
      `Constructor closure expression cannot be asynchronous nor generator`),
    {
      __proto__: digest,
      await: false,
      yield: false}),
  // Expression >> Consumer //
  AwaitExpression: (digest) => combine(
    check_not_assignment(digest),
    {
      __proto__: empty,
      await: true}),
  YieldExpression: (delegate, digest) => combine(
    check_not_assignment(digest),
    {
      __proto__: empty,
      yield: true}),
  ExportExpression: (specifier, digest) => (
    Throw.assert(specifier !== null, null, `Export specifier cannot be null`),
    combine(
      check_not_assignment(digest),
      {
        __proto__: empty,
        assignment: true,
        links: [
          {
            __proto__: null,
            type: "export",
            specifier}]})),
  WriteExpression: (identifier, digest) => combine(
    check_not_assignment(digest),
    {
      __proto__: empty,
      assignment: true,
      variables: [identifier]}),
  WriteEnclaveExpression: (strict, identifier, digest) => combine(
    check_not_assignment(digest),
    {
      __proto__: empty,
      assignment: true,
      enclave_variable: true}),
  SequenceExpression: (digest1, digest2) => combine(
    {
      __proto__: digest1,
      assignment: false},
    digest2),
  ConditionalExpression: (digest1, digest2, digest3) => combine(
    check_not_assignment(digest1),
    combine(digest2, digest3)),
  ThrowExpression: (digest) => check_not_assignment(digest),
  // Expression >> Combiner //
  GetSuperEnclaveExpression: (digest) => combine(
    check_not_assignment(digest),
    {
      __proto__: empty,
      enclave_super_access: true}),
  SetSuperEnclaveExpression: (digest1, digest2) => combine(
    combine(
      check_not_assignment(digest1),
      check_not_assignment(digest2)),
    {
      __proto__: empty,
      enclave_super_access: true,
      assignment: true}),
  CallSuperEnclaveExpression: (digest) => combine(
    check_not_assignment(digest),
    {
      __proto__: empty,
      enclave_super_call: true}),
  EvalExpression: (enclave, identifiers, digest) => (
    Throw.assert(
      enclave !== "script" && enclave !== "module",
      null,
      `Direct eval call cannot indicate a script/module enclave`),
    combine(
      check_not_assignment(digest),
      {
        __proto__: mask(empty, enclave, true),
        variables: identifiers})),
  DynamicImportExpression: (digest) => check_not_assignment(digest),
  ApplyExpression: (digest1, digest2, digests) => check_not_assignment(
    combine(
      digest1,
      combine(
        digest2,
        ArrayLite.reduce(digests, combine, empty)))),
  ConstructExpression: (digest, digests) => check_not_assignment(
    combine(
      digest,
      ArrayLite.reduce(digests, combine, empty))),
  UnaryExpression: (operator, digest) => check_not_assignment(digest),
  BinaryExpression: (operator, digest1, digest2) => check_not_assignment(
    combine(digest1, digest2)),
  ObjectExpression: (digest, digestss) => check_not_assignment(
    combine(
      digest,
      ArrayLite.reduce(
        ArrayLite.map(digestss, combine_property),
        combine,
        empty)))}; }) ());

const mask = (digest, enclave, boolean) => {
  if (enclave !== null) {
    digest = {__proto__:digest};
    for (let index = 0; index < effects[enclave].length; index++) {
      global_Reflect_defineProperty(digest, effects[enclave][index], {__proto__: null, value:boolean, writable:true, enumerable:true, configurable:true});
    }
  }
  return digest;
};

//
//
//
//
// const generateInclude = (values) => (value) => includes(values, value);
//
// export const isUnaryOperator = generateInclude(enumerations.UnaryOperator);
//
// export const isBinaryOperator = generateInclude(enumerations.BinaryOperator);
//
// export const isAranKeyword = generateInclude(enumerations.AranKeyword);
//
// export const isKeyword = generateInclude(enumerations.Keyword);
//
// export const isIntrinsic = generateInclude(enumerations.Intrinsic);
//
// export const getIntrinsicArray = () => enumerations.Intrinsic;
//


///////////
// Build //
///////////

exports.toggleNormalMode = () => {
  const generators = {
    [0]: (tag) => () => [tag],
    [1]: (tag) => (field1) => [tag, field1],
    [2]: (tag) => (field1, field2) => [tag, field1, field2],
    [3]: (tag) => (field1, field2, field3) => [tag, field1, field2, field3],
    [4]: (tag) => (field1, field2, field3, field4) => [tag, field1, field2, field3, field4],
  };
  ArrayLite.forEach(global_Reflect_ownKeys(syntax), (type) => {
    ArrayLite.forEach(global_Reflect_ownKeys(syntax[type]), (tag) => {
      makers[tag] = generators[syntax[type][tag].length](tag);
    });
  });
};

exports.toggleNormalMode();

exports.toggleDebugMode = () => {
  // Predicates //
  const predicates = ((() => {
    const is_name = (string) => global_Reflect_apply(
      global_RegExp_prototype_test,
      /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
      [string]);
    const is_boolean = (value) => typeof value === "boolean";
    return {
      __proto__: null,
      Strict: is_boolean,
      Asynchronous: is_boolean,
      Generator: is_boolean,
      Delegate: is_boolean,
      Enclave: includes(enumerations.Enclave),
      Kind: includes(enumerations.Kind),
      Sort: includes(enumerations.Sort),
      BinaryOperator: includes(enumerations.BinaryOperator),
      UnaryOperator: includes(enumerations.UnaryOperator),
      Intrinsic: includes(enumerations.Intrinsic),
      Primitive: (node) => (
        node === null ||
        node === void 0 ||
        typeof node === "boolean" ||
        typeof node === "number" ||
        typeof node === "bigint" ||
        typeof node === "string"),
      Source: (node) => typeof node === "string",
      Specifier: (node) => (
        node === null ||
        (
          typeof node === "string" &&
          is_name(node))),
      ReadableEnclaveVariableIdentifier: (node) => (
        typeof node === "string" &&
        (
          node === "new.target" ||
          node === "this" ||
          node === "eval" ||
          node === "arguments" ||
          (
            is_name(node) &&
            !ArrayLite.has(enumerations.Keyword, node)))),
      WritableEnclaveVariableIdentifier: (node) => (
        typeof node === "string" &&
        is_name(node) &&
        !ArrayLite.has(enumerations.Keyword, node)),
      LabelIdentifier: (node) => (
        typeof node === "string" &&
        is_name(node) &&
        !ArrayLite.has(enumerations.Keyword, node) &&
        !ArrayLite.has(enumerations.AranKeyword, node)),
      VariableIdentifier: (node) => (
        typeof node === "string" &&
        is_name(node) &&
        !ArrayLite.has(enumerations.Keyword, node) &&
        !ArrayLite.has(enumerations.AranKeyword, node))};
  }) ());
  const closures = ((() => {
    const check_not_assignment = (digest) => (
      Throw.assert(!digest.assignment, null, `Assignment expression should be dropped`),
      digest);
    const check_not_completion = (digest) => (
      Throw.assert(!digest.completion, null, `Completion statement should appear last`),
      digest);
    const types = {
      __proto__: null,
      assignment: "boolean",
      completion: "boolean",
      yield: "boolean",
      await: "boolean",
      labels: "array",
      links: "array",
      variables: "array",
      enclave_variable: "boolean",
      enclave_this: "boolean",
      enclave_arguments: "boolean",
      enclave_new_target: "boolean",
      enclave_super_access: "boolean",
      enclave_super_call: "boolean",
      enclave_loose_variable: "boolean",
      enclave_rigid_variable: "boolean"
    };
    const keys = global_Reflect_ownKeys(types);
    const empty = {__proto__:null};
    for (const key in types) {
      if (types[key] === "boolean") {
        empty[key] = false;
      } else {
        // console.assert(types[key] === "array");
        empty[key] = [];
      }
    }
    const combine = (digest1, digest2) => {
      const digest3 = {__proto__:null};
      for (const key in types) {
        if (types[key] === "boolean") {
          digest3[key] = digest1[key] || digest2[key];
        } else {
          // console.assert(types[key] === "array");
          digest3[key] = ArrayLite.concat(digest1[key], digest2[key]);
        }
      }
      return digest3;
    };


    const combine_list = (digest1, digest2) => combine(
      check_not_completion(digest1),
      digest2);
    const combine_property = ({0:digest1, 1:digest2}) => combine(digest1, digest2);
    const get_links = ({links}) => links;
    const key_object_1 = {
      __proto__: null,
      "var": "enclave_loose_variable",
      "let": "enclave_rigid_variable",
      "const": "enclave_rigid_variable"};
    const key_object_2 = {
      __proto__: null,
      "new.target": "enclave_new_target",
      "this": "enclave_this",
      "arguments": "enclave_arguments"};

  const database = {__proto__:null};
  for (const type in syntax) {
    database[type] = new global_WeakMap();
  }
  const check = (type, node) => {
    if (typeof type === "string") {
      if (type in database) {
        Throw.assert(global_Reflect_apply(global_WeakMap_prototype_has, database[type], [node]), null, `Invalid compound node: expected a ${type}, got ${Throw.inspect(node)}`);
        return global_Reflect_apply(global_WeakMap_prototype_get, database[type], [node]);
      }
      Throw.assert(predicates[type](node), null, `Invalid atomic node: expected a ${type}, got ${Throw.inspect(node)}`);
      return node;
    }
    // console.assert(global_Array_isArray(type));
    Throw.assert(global_Array_isArray(node), null, `Invalid array node: expected a ${global_JSON_stringify(type)}, got ${Throw.inspect(node)}`);
    if (type.length === 2 && type[1] === "*") {
      type = ArrayLite.repeat(type[0], node.length);
    }
    Throw.assert(type.length === node.length, null, `Array length mistmatch: expected a ${global_JSON_stringify(type)}, got: [${ArrayLite.join(ArrayLite.map(node, Throw.inspect), ", ")}]`)
    return ArrayLite.map(type, (_, index) => check(type[index], node[index]));
  };
  ArrayLite.forEach(global_Reflect_ownKeys(syntax), (type) => {
    ArrayLite.forEach(global_Reflect_ownKeys(syntax[type]), (constructor) => {
      exports[constructor] = (...fields) => {
        const digest = global_Reflect_apply(closures[constructor], void 0, check(syntax[type][constructor], fields));
        const node = ArrayLite.concat([constructor], fields);
        global_Reflect_apply(global_WeakMap_prototype_set, database[type], [node, digest]);
        return node;
      };
      global_Reflect_defineProperty(exports[constructor], "length", {
        __proto__: null,
        value: syntax[type][constructor].length,
        writable: false,
        enumerable: false,
        configurable: true
      });
    });
  });
};

///////////////
// Accessors //
///////////////

exports.getType = (node) => node[0];

exports.dispatch = (context, node, callbacks, callback) => (
  node[0] in callbacks ?
  (
    node.length === 1 ?
    callbacks[node[0]](context, node) :
    (
      node.length === 2 ?
      callbacks[node[0]](context, node, node[1]) :
      (
        node.length === 3 ?
        callbacks[node[0]](context, node, node[1], node[2]) :
        (
          node.length === 4 ?
          callbacks[node[0]](context, node, node[1], node[2], node[3]) :
          (
            node.length === 5 ?
            callbacks[node[0]](context, node, node[1], node[2], node[3], node[4]) :
            Throw.abort(null, `Invalid node length for dispatch`)))))) :
  (
    Throw.assert(callback !== null, null, `Missing callback for ${node[0]}`),
    callback(context, node, node[0])));

exports.extract = (context, node, type, callback) => (
  Throw.assert(node[0] === type, null, `Type mismatch for extract`),
  (
    node.length === 1 ?
    callback(context, node) :
    (
      node.length === 2 ?
      callback(context, node, node[1]) :
      (
        node.length === 3 ?
        callback(context, node, node[1], node[2]) :
        (
          node.length === 4 ?
          callback(context, node, node[1], node[2], node[3]) :
          (
            node.length === 5 ?
            callback(context, node, node[1], node[2], node[3], node[4]) :
            Throw.abort(null, `Invalid node length for extract`)))))));

exports.match = (context, value, match) => (
  typeof match === "function" ?
  match(context, value) :
  (
    // Works both for array of nodes and node (we cannot assume that value[0] is a type tag)
    global_Array_isArray(value) ?
    (
      global_Array_isArray(match) ?
      (
        value.length === match.length &&
        ArrayLite.every(
          value,
          (_, index) => exports.match(context, value[index], match[index]))) :
      false) :
    value === match));

// Allign is only used for testing so we don't care about performance and use reflection.
exports.allign = (context, node1, node2, callbacks, callback) => (
  (
    node1[0] === node2[0] &&
    node1[0] in callbacks) ?
  global_Reflect_apply( // console.assert(node1.length === node2.length)
    callbacks[node1[0]],
    // (node1[0] in callbacks ? callbacks[node1[0]] : console.log(`Missing ${node1[0]}`)),
    void 0,
    ArrayLite.concat(
      [context, node1, node2],
      ArrayLite.slice(node1, 1, node1.length),
      ArrayLite.slice(node2, 1, node2.length))) :
  (
    Throw.assert(callback !== null, null, `Missing callback for ${node1[0]} and ${node2[0]}`),
    callback(context, node1, node2, node1[0], node2[0])));

"use strict";

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");

const global_JSON_stringify = global.JSON.stringify;
const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Array_isArray = global.Array.isArray;
const global_Proxy = global.Proxy;
const global_WeakMap = global.WeakMap;
const global_WeakMap_prototype_has = global.WeakMap.prototype.has;
const global_WeakMap_prototype_get = global.WeakMap.prototype.get;
const global_WeakMap_prototype_set = global.WeakMap.prototype.set;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Reflect_apply = global.Reflect.apply;
const global_Function = global.Function;
const global_String_prototype_trim = global.String.prototype.trim;
const global_Reflect_defineProperty = global.Reflect.defineProperty;

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

const syntax = {
  __proto__: null,
  Program: {
    __proto__: null,
    ScriptProgram: ["Block"],
    EvalProgram: [["VariableIdentifier", "*"], "Block"],
    ModuleProgram: [["Link", "*"], "Block"]
  },
  Link: {
    __proto__: null,
    ImportLink: ["Specifier", "Source"],
    ExportLink: ["Specifier"],
    AggregateLink: ["Specifier", "Source", "Specifier"]
  },
  Branch: {
    __proto__: null,
    Branch: [["LabelIdentifier", "*"], "Block"]
  },
  Block: {
    __proto__: null,
    Block: [["VariableIdentifier", "*"], "Statement"]
  },
  Statement: {
    __proto__: null,
    // BlockLess //
    ExpressionStatement: ["Expression"],
    ReturnStatement: ["Expression"],
    CompletionStatement: ["Expression"],
    BreakStatement: ["LabelIdentifier"],
    DebuggerStatement: [],
    ListStatement: [["Statement", "*"]],
    DeclareEnclaveStatement: ["Kind", "WritableEnclaveVariableIdentifier", "Expression"],
    // BlockFull //
    BranchStatement: ["Branch"],
    IfStatement: ["Expression", "Branch", "Branch"],
    WhileStatement: ["Expression", "Branch"],
    TryStatement: ["Branch", "Branch", "Branch"]
  },
  Expression: {
    __proto__: null,
    // Producer //
    ImportExpression: ["Specifier", "Source"],
    PrimitiveExpression: ["Primitive"],
    IntrinsicExpression: ["Intrinsic"],
    ReadExpression: ["VariableIdentifier"],
    ReadEnclaveExpression: ["ReadableEnclaveVariableIdentifier"],
    TypeofEnclaveExpression: ["ReadableEnclaveVariableIdentifier"],
    ClosureExpression: ["Sort", "Asynchronous", "Generator", "Block"],
    // Consumer //
    AwaitExpression: ["Expression"],
    YieldExpression: ["Delegate", "Expression"],
    ExportExpression: ["Specifier", "Expression"],
    WriteExpression: ["VariableIdentifier", "Expression"],
    WriteEnclaveExpression: ["Strict", "WritableEnclaveVariableIdentifier", "Expression"],
    SequenceExpression: ["Expression", "Expression"],
    ConditionalExpression: ["Expression", "Expression", "Expression"],
    ThrowExpression: ["Expression"],
    // Combiners //
    MemberSuperEnclaveExpression: ["Expression"],
    CallSuperEnclaveExpression: ["Expression"],
    EvalExpression: ["Expression"],
    RequireExpression: ["Expression"],
    ApplyExpression: ["Expression", "Expression", ["Expression", "*"]],
    ConstructExpression: ["Expression", ["Expression", "*"]],
    UnaryExpression: ["UnaryOperator", "Expression"],
    BinaryExpression: ["BinaryOperator", "Expression", "Expression"],
    ObjectExpression: ["Expression", [["Expression", "Expression"], "*"]]
  }
};

const enumerations = {
  __proto__: null,
  Kind: ["var", "let", "const"],
  Sort: ["arrow", "function", "constructor", "method"],
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
    "aran.globalObjectRecord",
    "aran.globalDeclarativeRecord",
    "aran.deadzoneMarker",
    "aran.asynchronousGeneratorPrototype",
    "aran.generatorPrototype",
    // Grabbable //
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
  ]
};

const includes = (values) => (value) => ArrayLite.includes(values, value);

exports.isUnaryOperator = includes(enumerations.UnaryOperator);

exports.isBinaryOperator = includes(enumerations.BinaryOperator);

exports.isAranKeyword = includes(enumerations.AranKeyword);

exports.isKeyword = includes(enumerations.Keyword);

exports.isIntrinsic = includes(enumerations.Intrinsic);

exports.getIntrinsicEnumeration = () => enumerations.Intrinsic;

///////////
// Build //
///////////

exports.toggleNormalMode = () => {
  const build = {
    [0]: (constructor) => () => [constructor],
    [1]: (constructor) => (field1) => [constructor, field1],
    [2]: (constructor) => (field1, field2) => [constructor, field1, field2],
    [3]: (constructor) => (field1, field2, field3) => [constructor, field1, field2, field3],
    [4]: (constructor) => (field1, field2, field3, field4) => [constructor, field1, field2, field3, field4],
  };
  ArrayLite.forEach(global_Reflect_ownKeys(syntax), (type) => {
    ArrayLite.forEach(global_Reflect_ownKeys(syntax[type]), (constructor) => {
      exports[constructor] = build[syntax[type][constructor].length](constructor);
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
          node === "import.meta" ||
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
    const check_not_assignment = (result) => (
      Throw.assert(!result.assignment, null, `Assignment expression should be dropped`),
      result);
    const check_not_completion = (result) => (
      Throw.assert(!result.completion, null, `Completion statement should appear last`),
      result);
    const empty = {
      assignment: false,
      completion: false,
      yield: false,
      await: false,
      labels: [],
      links: [],
      variables: []
    };
    const combine = (result1, result2) => ({
      assignment: result1.assignment || result2.assignment,
      completion: result2.completion || result2.completion,
      yield: result1.yield || result2.yield,
      await: result1.await || result2.await,
      labels: ArrayLite.concat(result1.labels, result2.labels),
      links: ArrayLite.concat(result1.links, result2.links),
      variables: ArrayLite.concat(result1.variables, result2.variables)
    });
    const combine_list = (result1, result2) => combine(
      check_not_completion(result1),
      result2);
    const combine_property = ({0:result1, 1:result2}) => combine(result1, result2);
    // console.assert(!result.assignment)
    // console.assert(!result.completion)
    const checkout = (result) => (
      Throw.assert(!result.await, null, `Await expression inside program`),
      Throw.assert(!result.yield, null, `Yield expression inside program`),
      Throw.assert(result.labels.length === 0, null, `Program-unbound label: ${ArrayLite.join(result.labels, ", ")}`),
      Throw.assert(result.variables.length === 0, null, `Program-unbound variable: ${ArrayLite.join(result.variables, ", ")}`),
      Throw.assert(result.links.length === 0, null, `Program-unbound link: ${ArrayLite.join(result.links, ", ")}`),
      void 0);
    return {
      __proto__: null,
      // Program //
      ScriptProgram: (result) => checkout(result),
      EvalProgram: (identifiers, result) => checkout(
        {
          __proto__: result,
          variables: ArrayLite.filterOut(
            result.variables,
            (identifier) => ArrayLite.includes(identifiers, identifier))}),
      ModuleProgram: (results, result) => checkout(
        {
          __proto__: result,
          links: ArrayLite.filterOut(
            result.links,
            (link) => ArrayLite.some(
              results,
              (result) => ArrayLite.includes(result.links, link)))}),
      // Link //
      ImportLink: (specifier, source) => ({
        __proto__: empty,
        links: [`import ${specifier === null ? "*" : specifier} from ${global_JSON_stringify(source)}`]}),
      ExportLink: (specifier) => (
        Throw.assert(specifier !== null, null, `Export specifier cannot be null`),
        {
          __proto__: empty,
          links: [`export ${specifier}`]}),
      AggregateLink: (specifier1, source, specifier2) => (
        Throw.assert(specifier1 === null || specifier2 !== null, null, `The export specifier of an aggregate link cannot be null when it import specifier is not null`),
        empty),
      // Branch //
      Branch: (identifiers, result) => ({
        __proto__: result,
        labels: ArrayLite.filterOut(
          result.labels,
          (identifier) => ArrayLite.includes(identifiers, identifier))}),
      // Block //
      Block: (identifiers, result) => ({
        __proto__: result,
        completion: (
          Throw.assert(result.completion, null, `The last statement of a block must be a completion statement`),
          false),
        variables: ArrayLite.filterOut(
          result.variables,
          (identifier) => (
            identifier === "input" ||
            ArrayLite.includes(identifiers, identifier)))}),
      // Statement >> Atomic //
      ExpressionStatement: (result) => ({
        __proto__: result,
        assignment: false}),
      ReturnStatement: (result) => check_not_assignment(result),
      CompletionStatement: (result) => ({
        __proto__: check_not_assignment(result),
        completion: true}),
      BreakStatement: (label) => ({
        __proto__: empty,
        labels: [label]}),
      DebuggerStatement: () => empty,
      ListStatement: (results) => ArrayLite.reduce(results, combine_list, empty),
      DeclareEnclaveStatement: (kind, identifier, result) => check_not_assignment(result),
      // Statement >> Compound //
      BranchStatement: (result) => result,
      IfStatement: (result1, result2, result3) => combine(
        check_not_assignment(result1),
        combine(result2, result3)),
      WhileStatement: (result1, result2) => combine(
        check_not_assignment(result1),
        result2),
      TryStatement: (result1, result2, result3) => combine(
        result1,
        combine(result2, result3)),
      // Expression >> Producer //
      ImportExpression: (specifier, source) => ({
        __proto__: empty,
        links: [`import ${specifier === null ? "*" : specifier} from ${global_JSON_stringify(source)}`]}),
      PrimitiveExpression: (primitive) => empty,
      IntrinsicExpression: (intrinsic) => empty,
      ReadExpression: (identifier) => ({
        __proto__: empty,
        variables: [identifier]}),
      ReadEnclaveExpression: (identifier) => empty,
      TypeofEnclaveExpression: (identifier) => empty,
      ClosureExpression: (sort, asynchronous, generator, result) => (
        Throw.assert(result.labels.length === 0, null, `Closure-unbound label: ${result.labels[0]}`),
        Throw.assert(asynchronous || !result.await, null, `Await expression inside non-asynchronous closure expression`),
        Throw.assert(generator || !result.yield, null, `Yield expression inside non-generator closure expression`),
        Throw.assert(sort !== "arrow" || !generator, null, `Arrow closure expression cannot be generator`),
        Throw.assert(sort !== "method" || !generator, null, `Method closure expression cannot be generator`),
        Throw.assert(sort !== "constructor" || (!generator && !asynchronous), null, `Constructor closure expression cannot be asynchronous nor generator`),
        {
          __proto__: empty,
          links: result.links,
          variables: result.variables}),
      // Expression >> Consumer //
      AwaitExpression: (result) => combine(
        check_not_assignment(result),
        {
          __proto__: empty,
          await: true}),
      YieldExpression: (delegate, result) => combine(
        check_not_assignment(result),
        {
          __proto__: empty,
          yield: true}),
      ExportExpression: (specifier, result) => (
        Throw.assert(specifier !== null, null, `Export specifier cannot be null`),
        combine(
          check_not_assignment(result),
          {
            __proto__: empty,
            assignment: true,
            links: [`export ${specifier}`]})),
      WriteExpression: (identifier, result) => combine(
        check_not_assignment(result),
        {
          __proto__: empty,
          assignment: true,
          variables: [identifier]}),
      WriteEnclaveExpression: (strict, identifier, result) => combine(
        check_not_assignment(result),
        {
          __proto__: empty,
          assignment: true}),
      SequenceExpression: (result1, result2) => combine(
        {
          __proto__: result1,
          assignment: false},
        result2),
      ConditionalExpression: (result1, result2, result3) => combine(
        check_not_assignment(result1),
        combine(result2, result3)),
      ThrowExpression: (result) => check_not_assignment(result),
      // Expression >> Combiner //
      MemberSuperEnclaveExpression: (result) => check_not_assignment(result),
      CallSuperEnclaveExpression: (result) => check_not_assignment(result),
      EvalExpression: (result) => check_not_assignment(result),
      RequireExpression: (result) => check_not_assignment(result),
      ApplyExpression: (result1, result2, results) => check_not_assignment(
        combine(
          result1,
          combine(
            result2,
            ArrayLite.reduce(results, combine, empty)))),
      ConstructExpression: (result, results) => check_not_assignment(
        combine(
          result,
          ArrayLite.reduce(results, combine, empty))),
      UnaryExpression: (operator, result) => check_not_assignment(result),
      BinaryExpression: (operator, result1, result2) => check_not_assignment(
        combine(result1, result2)),
      ObjectExpression: (result, resultss) => check_not_assignment(
        combine(
          result,
          ArrayLite.reduce(
            ArrayLite.map(resultss, combine_property),
            combine,
            empty)))}; }) ());
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
        const result = global_Reflect_apply(closures[constructor], void 0, check(syntax[type][constructor], fields));
        const node = ArrayLite.concat([constructor], fields);
        global_Reflect_apply(global_WeakMap_prototype_set, database[type], [node, result]);
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

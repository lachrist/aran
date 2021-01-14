"use strict";

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");

const global_JSON_stringify = global.JSON.stringify;
const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Array_isArray = global.Array.isArray;
const global_Proxy = global.Proxy;
const global_WeakSet = global.WeakSet;
const global_WeakSet_prototype_add = global.WeakSet.prototype.add;
const global_WeakSet_prototype_has = global.WeakSet.prototype.has;
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
    Program: [["Link"], "Block"]
  },
  Link: {
    __proto__: null,
    ImportLink: ["Specifier", "Source"],
    ExportLink: ["Specifier"],
    AggregateLink: ["Specifier", "Source", "Specifier"]
  },
  Branch: {
    __proto__: null,
    Branch: [["Label"], "Block"]
  },
  Block: {
    __proto__: null,
    Block: [["Identifier"], "Statement"]
  },
  Statement: {
    __proto__: null,
    // BlockLess //
    ExpressionStatement: ["Expression"],
    ReturnStatement: ["Expression"],
    CompletionStatement: ["Expression"],
    BreakStatement: ["Label"],
    DebuggerStatement: [],
    ListStatement: [["Statement"]],
    DeclareEnclaveStatement: ["Kind", "WriteEnclaveIdentifier", "Expression"],
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
    ReadExpression: ["Identifier"],
    ReadEnclaveExpression: ["ReadEnclaveIdentifier"],
    TypeofEnclaveExpression: ["ReadEnclaveIdentifier"],
    ClosureExpression: ["Sort", "Asynchronous", "Generator", "Block"],
    // Consumer //
    AwaitExpression: ["Expression"],
    YieldExpression: ["Delegate", "Expression"],
    ExportExpression: ["Specifier", "Expression"],
    WriteExpression: ["Identifier", "Expression"],
    WriteEnclaveExpression: ["Strict", "WriteEnclaveIdentifier", "Expression"],
    SequenceExpression: ["Expression", "Expression"],
    ConditionalExpression: ["Expression", "Expression", "Expression"],
    ThrowExpression: ["Expression"],
    // Combiners //
    SuperMemberEnclaveExpression: ["Expression"],
    SuperCallEnclaveExpression: ["Expression"],
    EvalExpression: ["Expression"],
    RequireExpression: ["Expression"],
    ApplyExpression: ["Expression", "Expression", ["Expression"]],
    ConstructExpression: ["Expression", ["Expression"]],
    UnaryExpression: ["Unary", "Expression"],
    BinaryExpression: ["Binary", "Expression", "Expression"],
    ObjectExpression: ["Expression", [["Expression", "Expression"]]]
  }
};

const enumerations = {
  __proto__: null,
  Kind: ["var", "let", "const"],
  Strict: [true, false],
  Sort: ["arrow", "function", "constructor", "method"],
  Asynchronous: [true, false],
  Generator: [true, false],
  Delegate: [true, false],
  Binary: [
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
  Unary: [
    "-",
    "+",
    "!",
    "~",
    "typeof",
    "void",
    "delete"
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
  ]
};

const includes = (array) => (string) => ArrayLite.includes(array, string);

exports.isUnary = includes(enumerations.Unary);

exports.isBinary = includes(enumerations.Binary);

exports.isKeyword = includes(enumerations.Keyword);

exports.isAranKeyword = includes(enumerations.AranKeyword);

const isname = (string) => global_Reflect_apply(
  global_RegExp_prototype_test,
  /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
  [string]);

const predicates = {
  __proto__: null,
  Primitive: (node) => (
    node === null ||
    node === void 0 ||
    typeof node === "boolean" ||
    typeof node === "number" ||
    typeof node === "bigint" ||
    typeof node === "string"),
  Source: (node) => typeof node === "string",
  Intrinsic: (node) => typeof node === "string",
  Specifier: (node) => (
    node === null ||
    (
      typeof node === "string" &&
      isname(node))),
  ReadEnclaveIdentifier: (node) => (
    typeof node === "string" &&
    (
      node === "new.target" ||
      node === "import.meta" ||
      node === "this" ||
      node === "eval" ||
      node === "arguments" ||
      (
        isname(node) &&
        !ArrayLite.has(enumerations.Keyword, node)))),
  WriteEnclaveIdentifier: (node) => (
    typeof node === "string" &&
    isname(node) &&
    !ArrayLite.has(enumerations.Keyword, node)),
  Label: (node) => (
    typeof node === "string" &&
    isname(node) &&
    !ArrayLite.has(enumerations.Keyword, node) &&
    !ArrayLite.has(enumerations.AranKeyword, node)),
  Identifier: (node) => (
    typeof node === "string" &&
    isname(node) &&
    !ArrayLite.has(enumerations.Keyword, node) &&
    !ArrayLite.has(enumerations.AranKeyword, node))};

for (const type in enumerations) {
  predicates[type] = includes(enumerations[type]);
}

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
  const database = {__proto__:null};
  for (const type in syntax) {
    database[type] = new global_WeakSet();
  }
  const traps = {
    __proto__: null,
    setPrototypeOf: (target, prototype) => Throw.abort(null, `setPrototypeOf on immutable node`),
    defineProperty: (target, key, descriptor) => Throw.abort(null, `defineProperty on immutable node`)
  };
  const check = (type, node) => {
    if (typeof type === "string") {
      if (type in database) {
        Throw.assert(global_Reflect_apply(global_WeakSet_prototype_has, database[type], [node]), null, `Invalid compound node: expected a ${type}, got ${Throw.inspect(node)}`);
      } else {
        Throw.assert(predicates[type](node), null, `Invalid atomic node: expected a ${type}, got ${Throw.inspect(node)}`);
      }
      return node;
    }
    // console.assert(global_Array_isArray(type));
    if (!global_Array_isArray(node)) {
      Throw.abort(null, `Invalid array node: expected a ${global_JSON_stringify(type)}, got ${Throw.inspect(node)}`);
    }
    if (type.length === 1) {
      return new global_Proxy(ArrayLite.map(node, (node) => check(type[0], node)), traps);
    }
    if (type.length !== node.length) {
      Throw.abort(null, `Length mismatch in array node: expected ${global_JSON_stringify(type)}, got [${ArrayLite.map(node, Throw.inspect)}]`);
    }
    return new global_Proxy(ArrayLite.map(node, (node, index) => check(type[index], node)), traps);
  };
  const check_completion = (statement, last) => {
    const constructor = statement[0];
    if (constructor === "ListStatement") {
      const statements = statement[1];
      if (statements.length === 0) {
        Throw.assert(!last, null, `Missing completion on empty list statement`);
      } else {
        for (let index = 0; index < statements.length - 1; index++) {
          check_completion(statements[index], false);
        }
        check_completion(statements[statements.length - 1], last);
      }
    } else {
      Throw.assert((constructor === "CompletionStatement") === last, null, `Completion mismatch`);
    }
  }
  ArrayLite.forEach(global_Reflect_ownKeys(syntax), (type) => {
    ArrayLite.forEach(global_Reflect_ownKeys(syntax[type]), (constructor) => {
      exports[constructor] = (...fields) => {
        if (fields.length !== syntax[type][constructor].length) {
          Throw.abort(null, `Wrong number of fields for ${constructor}: expected ${global_JSON_stringify(syntax[type][constructor])}, got: [${ArrayLite.map(fields, Throw.inspect)}]`);
        }
        fields = ArrayLite.map(fields, (field, index) => check(syntax[type][constructor][index], field));
        if (constructor === "Block") {
          check_completion(fields[1], true);
        }
        const node = new global_Proxy(ArrayLite.concat([constructor], fields), traps);
        global_Reflect_apply(global_WeakSet_prototype_add, database[type], [node]);
        return node;
      };
      global_Reflect_defineProperty(exports[constructor], "length", {
        __proto__: null,
        value: syntax[type][constructor].length,
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

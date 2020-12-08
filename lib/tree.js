"use strict";

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");

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
// type Builtin = {"Reflect.get", ...}
// type Parameter = {"ERROR", "THIS", "NEW_TARGET", "ARGUMENTS"}
//
// type FieldType = {"expression", ...}
//
// type Constructor = BlockConstructor U StatementConstructor U ExpressionConstructor
// type BlockConstructor = {"BLOCK"}
// type StatementConstructor = {"Lift", ...}
// type ExpressionConstructor = {"primitive", ...}

////////////
// Syntax //
////////////

const syntax = {
  block: {
    BLOCK: [["declarable"], ["statement"]] },
  statement: {
    // BlockLess //
    Lift: ["expression"],
    Export: ["key", "expression"],
    Aggregate: ["source"],
    Return: ["expression"],
    Break: ["label"],
    Continue: ["label"],
    Debugger: [],
    Bundle: [["statement"]],
    // BlockFull //
    Lone: [["label"], "block"],
    If: [["label"], "expression", "block", "block"],
    While: [["label"], "expression", "block"],
    Try: [["label"], "block", "block", "block"]
  },
  expression: {
    // Producers //
    import: ["source"],
    primitive: ["primitive"],
    builtin: ["builtin"],
    read: ["identifier"],
    arrow: ["block"],
    function: ["block"],
    method: ["block"],
    constructor: ["block"],
    // Consumers //
    write: ["identifier", "expression"],
    sequence: ["expression", "expression"],
    conditional: ["expression", "expression", "expression"],
    throw: ["expression"],
    eval: ["expression"],
    // Combiners //
    require: ["expression"],
    apply: ["expression", "expression", ["expression"]],
    construct: ["expression", ["expression"]],
    unary: ["unary", "expression"],
    binary: ["binary", "expression", "expression"],
    object: ["expression", [["expression", "expression"]]]
  }
};

const enumerations = {
  binary: [
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
  unary: [
    "-",
    "+",
    "!",
    "~",
    "typeof",
    "void",
    "delete"
  ]
};

exports._unary_operator_array = enumerations.unary;

exports._binary_operator_array = enumerations.binary;

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
  // AranSpecific //
  "eval",
  "method",
  "constructor"
];

const isname = (string) => global_Reflect_apply(
  global_RegExp_prototype_test,
  /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u,
  [string]);

const predicates = {
  primitive: (node) => (
    node === null ||
    node === void 0 ||
    typeof node === "boolean" ||
    typeof node === "number" ||
    typeof node === "bigint" ||
    typeof node === "string"),
  source: (node) => typeof node === "string",
  builtin: (node) => typeof node === "string",
  key: (node) => (
    typeof node === "string" &&
    isname(node)),
  label: (node) => (
    typeof node === "string" &&
    isname(node) &&
    !ArrayLite.has(keywords, node)),
  identifier: (node) => (
    (
      typeof node === "string" &&
      isname(node) &&
      !ArrayLite.has(keywords, node)) ||
    node === "this" ||
    node === "new.target" ||
    node === "import.meta"),
  declarable: (node) => (
    typeof node === "string" &&
    isname(node) &&
    !ArrayLite.has(keywords, node) &&
    node !== "error" &&
    node !== "arguments" &&
    node !== "callee")};

const flaten = (statement) => statement[0] === "Bundle" ? statement[1] : [statement];

///////////
// Build //
///////////

exports._toggle_normal_mode = () => {
  const build = {
    [0]: (constructor) => () => [constructor],
    [1]: (constructor) => (field1) => [constructor, field1],
    [2]: (constructor) => (field1, field2) => [constructor, field1, field2],
    [3]: (constructor) => (field1, field2, field3) => [constructor, field1, field2, field3],
    [4]: (constructor) => (field1, field2, field3, field4) => [constructor, field1, field2, field3, field4]
  };
  ArrayLite.forEach(["expression", "statement", "block"], (type) => {
    ArrayLite.forEach(global_Reflect_ownKeys(syntax[type]), (constructor) => {
      exports[constructor] = build[syntax[type][constructor].length](constructor);
    });
  });
  exports.Bundle = (statements) => ["Bundle", ArrayLite.flatMap(statements, flaten)];
  exports.BLOCK = (identifiers, statements) => ["BLOCK", identifiers, ArrayLite.flatMap(statements, flaten)];
};

exports._toggle_normal_mode();

exports._toggle_debug_mode = () => {
  const database = {
    __proto__: null,
    expression: new global_WeakSet(),
    statement: new global_WeakSet(),
    block: new global_WeakSet()
  };
  const traps = {
    __proto__: null,
    setPrototypeOf: (target, prototype) => Throw.abort(null, `setPrototypeOf on immutable node`),
    defineProperty: (target, key, descriptor) => Throw.abort(null, `defineProperty on immutable node`)
  };
  const check = (type, node) => {
    if (typeof type === "string") {
      if (type === "block" || type === "statement" || type === "expression") {
        if (!global_Reflect_apply(global_WeakSet_prototype_has, database[type], [node])) {
          Throw.abort(null, `Invalid compound node`);
        }
      } else if (type === "unary" || type === "binary") {
        if (!ArrayLite.includes(enumerations[type], node)) {
          Throw.abort(null, `Invalid enumeration-based atomic node`);
        }
      } else {
        // console.assert(type === "builtin" || type === "primitive" || type === "identifier" || type === "label" || type == "declarable");
        if (!predicates[type](node)) {
          Throw.abort(null, `Invalid predicate-based atomic node`);
        }
      }
      return node;
    }
    // console.assert(global_Array_isArray(type));
    if (!global_Array_isArray(node)) {
      Throw.abort(null, `Expected array node`);
    }
    if (type.length === 1) {
      return new global_Proxy(ArrayLite.map(node, (node) => check(type[0], node)), traps);
    }
    if (type.length !== node.length) {
      Throw.abort(null, `Length mismatch in array node`);
    }
    return new global_Proxy(ArrayLite.map(node, (node, index) => check(type[index], node)), traps);
  };
  ArrayLite.forEach(["statement", "expression", "block"], (type) => {
    ArrayLite.forEach(global_Reflect_ownKeys(syntax[type]), (constructor) => {
      exports[constructor] = (...fields) => {
        if (fields.length !== syntax[type][constructor].length) {
          Throw.abort(null, `Wrong number of fields`);
        }
        fields = ArrayLite.map(fields, (field, index) => check(syntax[type][constructor][index], field));
        if (constructor === "Bundle") {
          fields[0] = ArrayLite.flatMap(fields[0], flaten);
        } else if (constructor === "BLOCK") {
          fields[1] = ArrayLite.flatMap(fields[1], flaten);
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

//////////////
// Dispatch //
//////////////

exports._dispatch = (callbacks, context, node) => {
  if (node.length === 1) {
    return callbacks[node[0]](context, node);
  }
  if (node.length === 2) {
    return callbacks[node[0]](context, node, node[1]);
  }
  if (node.length === 3) {
    return callbacks[node[0]](context, node, node[1], node[2]);
  }
  if (node.length === 4) {
    return callbacks[node[0]](context, node, node[1], node[2], node[3]);
  }
  // console.assert(node.length === 5);
  return callbacks[node[0]](context, node, node[1], node[2], node[3], node[4]);
}

exports._dispatch_expression = exports._dispatch;

exports._dispatch_statement = exports._dispatch;

exports._dispatch_block = exports._dispatch;

////////////
// Allign //
////////////

// Allign is only used for testing so we don't care about performance and use reflection.

exports._allign = (callbacks, context, node1, node2) => (
  node1[0] === node2[0] ?
  global_Reflect_apply( // console.assert(node1.length === node2.length)
    callbacks[node1[0]],
    void 0,
    ArrayLite.concat(
      [context, node1, node2],
      ArrayLite.slice(node1, 1, node1.length),
      ArrayLite.slice(node2, 1, node2.length))) :
  callbacks.__type_mismatch__(context, node1, node2, node1[0], node2[0]));

exports._allign_block = exports._allign;

exports._allign_statement = exports._allign;

exports._allign_expression = exports._allign;

"use strict";

const ArrayLite = require("array-lite");

const global_Array_isArray = global.Array.isArray;
const global_Proxy = global.Proxy;
const global_Error = global.Error;
const global_WeakSet = global.WeakSet;
const global_WeakSet_prototype_add = global.WeakSet.prototype.add;
const global_WeakSet_prototype_has = global.WeakSet.prototype.has;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Reflect_apply = global.Reflect.apply;
const global_Function = global.Function;
const global_String_prototype_trim = global.String.prototype.trim;

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
    BLOCK: [["declarable"], ["statement"]]
  },
  statement: {
    // BlockLess //
    Lift: ["expression"],
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
    primitive: ["primitive"],
    builtin: ["builtin"],
    arrow: ["block"],
    function: ["block"],
    read: ["identifier"],
    // Consumers //
    write: ["identifier", "expression"],
    sequence: ["expression", "expression"],
    conditional: ["expression", "expression", "expression"],
    throw: ["expression"],
    eval: [["identifier"], "expression"],
    // Combiners //
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
  ],
  builtin: [
    "global",
    "eval",
    "RegExp",
    "ReferenceError",
    "TypeError",
    "Reflect.get",
    "Reflect.set",
    "Reflect.has",
    "Reflect.construct",
    "Reflect.apply",
    "Reflect.deleteProperty",
    "Reflect.setPrototypeOf",
    "Reflect.getPrototypeOf",
    "Reflect.defineProperty",
    "Reflect.getOwnPropertyDescriptor",
    "Symbol.unscopables",
    "Symbol.iterator",
    "Object",
    "Object.assign",
    "Object.freeze",
    "Object.keys",
    "Object.create",
    "Object.prototype",
    "Object.defineProperty",
    "Object.setPrototypeOf",
    "Proxy",
    "Array",
    "Array.of",
    "Array.from",
    "Array.prototype.fill",
    "Array.prototype.concat",
    "Array.prototype.values",
    "Array.prototype.includes",
    "Array.prototype.slice",
    "Array.prototype.push",
    "Function.prototype.arguments.__get__",
    "Function.prototype.arguments.__set__"
  ]
};

const reserved = [
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
  "false"
];

const is_name = (node) => (
  typeof node === "string" &&
  /^(\p{ID_Start}|\$|_)(\p{ID_Continue}|\$|\u200C|\u200D)*$/u.test(node) &&
  !ArrayLite.has(reserved, node));

const predicates = {
  primitive: (node) => (
    node === null ||
    node === void 0 ||
    typeof node === "boolean" ||
    typeof node === "number" ||
    typeof node === "bigint" ||
    typeof node === "string"),
  label: (node) => (
    node === null ||
    is_name(node)),
  declarable: (node) => (
    is_name(node) &&
    node !== "root" &&
    node !== "arguments" &&
    node !== "eval" &&
    node !== "evalcheck" &&
    node !== "ERROR" &&
    node !== "NEW_TARGET" &&
    node !== "THIS" &&
    node !== "ARGUMENTS"),
  identifier: (node) => (
    is_name(node) &&
    node !== "root" &&
    node !== "arguments" &&
    node !== "eval" &&
    node !== "evalcheck")};

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
    setPrototypeOf: (target, prototype) => {
      throw new global_Error("setPrototypeOf on immutable node");
    },
    defineProperty: (target, key, descriptor) => {
      throw new global_Error("defineProperty on immutable node");
    }
  };
  const check = (type, node) => {
    if (typeof type === "string") {
      if (type === "block" || type === "statement" || type === "expression") {
        if (!global_Reflect_apply(global_WeakSet_prototype_has, database[type], [node])) {
          throw new global_Error("Invalid compound node");
        }
      } else if (type === "unary" || type === "binary" || type === "builtin") {
        if (!ArrayLite.includes(enumerations[type], node)) {
          throw new global_Error("Invalid enumeration-based atomic node");
        }
      } else {
        // console.assert(type === "primitive" || type === "identifier" || type === "label" || type == "declarable");
        if (!predicates[type](node)) {
          throw new global_Error("Invalid predicate-based atomic node");
        }
      }
      return node;
    }
    // console.assert(global_Array_isArray(type));
    if (!global_Array_isArray(node)) {
      throw new global_Error("Expected array node");
    }
    if (type.length === 1) {
      return new global_Proxy(ArrayLite.map(node, (node) => check(type[0], node)), traps);
    }
    if (type.length !== node.length) {
      throw new global_Error("Length mismatch in array node");
    }
    return new global_Proxy(ArrayLite.map(node, (node, index) => check(type[index], node)), traps);
  };
  ArrayLite.forEach(["statement", "expression", "block"], (type) => {
    ArrayLite.forEach(global_Reflect_ownKeys(syntax[type]), (constructor) => {
      exports[constructor] = (...fields) => {
        if (fields.length !== syntax[type][constructor].length) {
          throw new global_Error("Wrong number of fields");
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
    });
  });
};

//////////////
// Dispatch //
//////////////

exports._dispatch_expression = (callbacks, context, expression) => {
  if (expression.length === 2) {
    return callbacks[expression[0]](context, expression, expression[1]);
  }
  if (expression.length === 3) {
    return callbacks[expression[0]](context, expression, expression[1], expression[2]);
  }
  // console.assert(expression.length === 4);
  return callbacks[expression[0]](context, expression, expression[1], expression[2], expression[3]);
};

exports._dispatch_statement = (callbacks, context, statement) => {
  if (statement.length === 1) {
    return callbacks[statement[0]](context, statement);
  }
  if (statement.length === 2) {
    return callbacks[statement[0]](context, statement, statement[1]);
  }
  if (statement.length === 3) {
    return callbacks[statement[0]](context, statement, statement[1], statement[2]);
  }
  if (statement.length === 4) {
    return callbacks[statement[0]](context, statement, statement[1], statement[2], statement[3]);
  }
  // console.assert(statement.length === 5);
  return callbacks[statement[0]](context, statement, statement[1], statement[2], statement[3], statement[4]);
};

exports._dispatch_block = (callbacks, context, block) => callbacks.BLOCK(context, block, block[1], block[2]);

////////////
// Allign //
////////////

// Allign is only used for testing so we don't care about performance and use reflection.

const allign = (callbacks, context, node1, node2) => (
  node1[0] === node2[0] ?
  global_Reflect_apply( // console.assert(node1.length === node2.length)
    callbacks[node1[0]],
    void 0,
    ArrayLite.concat(
      [context, node1, node2],
      ArrayLite.slice(node1, 1, node1.length),
      ArrayLite.slice(node2, 1, node2.length))) :
  callbacks.__type_mismatch__(context, node1, node2, node1[0], node2[0]));

exports._allign_block = allign;

exports._allign_statement = allign;

exports._allign_expression = allign;

//
// {
//   // Map BlockTag [Parameter]
//   const parameter_array_object = {
//     __proto__: null,
//     "program": ["THIS"],
//     "eval": [],
//     "function": ["NEW_TARGET", "THIS", "ARGUMENTS"],
//     "arrow": ["ARGUMENTS"],
//     "lone": [],
//     "then": [],
//     "else": [],
//     "while": [],
//     "try": [],
//     "catch": ["ERROR"],
//     "finally": []
//   };
//   exports._get_parameter_array = (nullable_constructor, index) => {
//     if (nullable_constructor === null && index === 0) {
//       return ["THIS"];
//     }
//     if (nullable_constructor === "function" && index === 0) {
//       return ["NEW_TARGET", "THIS", "ARGUMENTS"];
//     }
//     if (nullable_constructor === "arrow" && index === 0) {
//       return ["ARGUMENTS"];
//     }
//     if (nullable_constructor === "Try" && index === 2) {
//       return ["ERROR"];
//     }
//     return [];
//   }
// }
//

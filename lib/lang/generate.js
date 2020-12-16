"use strict";

const Throw = require("../throw.js");
const Tree = require("../tree.js");
const ArrayLite = require("array-lite");

const global_JSON_stringify = global.JSON.stringify;
const global_RegExp_prototype_test = global.RegExp.prototype.test;
const global_Reflect_apply = global.Reflect.apply;
const global_String = global.String;

const STEP = "  ";

const primitive_undefined_matcher = ["primitive", void 0];

////////////
// Helper //
////////////

const generate_label_array = (labels) => ArrayLite.join(
  ArrayLite.map(
    labels,
    (label) => label + ": "),
  "");

const generate_apply_argument_part = (newline, this_expression, argument_expression_array) => (
  (
    is_simple_expression(this_expression) &&
    ArrayLite.every(argument_expression_array, is_simple_expression)) ?
  (
    "(" +
    ArrayLite.join(
      ArrayLite.concat(
        (
          Tree._match(null, this_expression, primitive_undefined_matcher) ?
          [] :
          ["@" + generate(null, this_expression)]),
        ArrayLite.map(
          argument_expression_array,
          (argument_expression) => generate(null, argument_expression))),
      ", ") +
    ")") :
  (
    newline += STEP,
    (
      ("(" + newline) +
      ArrayLite.join(
        ArrayLite.concat(
          (
            Tree._match(null, this_expression, primitive_undefined_matcher) ?
            [] :
            ["@" + generate(newline, this_expression)]),
          ArrayLite.map(
            argument_expression_array,
            (argument_expression) => generate(newline, argument_expression))),
        ("," + newline)) +
      ")")));

const generate_construct_argument_part = (newline, argument_expression_array) => (
  ArrayLite.every(argument_expression_array, is_simple_expression) ?
  (
    "(" +
    ArrayLite.join(
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => generate(null, argument_expression)),
      ", ") +
    ")") :
  (
    newline += STEP,
    (
      "(" +
      newline +
      ArrayLite.join(
        ArrayLite.map(
          argument_expression_array,
          (argument_expression) => generate(newline, argument_expression)),
        "," + newline) +
      ")")));

///////////
// Visit //
///////////

const generate = (newline, node) => Tree._dispatch(newline, node, callbacks);

const callbacks = {
  __proto__: null,
  // Program //
  _program: (newline, node, preludes, block) => (
    ArrayLite.join(
      ArrayLite.map(
        preludes,
        (prelude) => generate(newline, prelude)),
      "") +
    generate(newline, block)),
  // Prelude //
  _import: (newline, node, specifier, source) => (
    "import " +
    (specifier === null ? "*" : specifier) +
    " from " +
    global_JSON_stringify(source) +
    ";" +
    newline),
  _export: (newline, node, specifier) => (
    "export " +
    (
      Throw.assert(specifier !== null, null, `Null prelude export specifier`),
      specifier) +
    ";" +
    newline),
  _aggregate: (newline, node, specifier1, source, specifier2) => (
    "aggregate " +
    (
      specifier1 === null ?
      "*" :
      specifier1) +
    " from " +
    global_JSON_stringify(source) +
    (
      specifier2 === null ?
      "" :
      " as " + specifier2) +
    ";" +
    newline),
  // Block //
  BLOCK: (newline, block, identifiers, statements) => (
    newline += STEP,
    (
      "{" +
      (
        identifiers.length === 0 ?
        "" :
        (
          newline +
          "let " +
          ArrayLite.join(identifiers, ", ") +
          ";")) +
      ArrayLite.join(
        ArrayLite.map(
          statements,
          (statement) => generate(newline, statement)),
        "") +
      "}")),
  // Statement //
  Lift: (newline, statement, expression) => (
    newline +
    generate(newline, expression) +
    ";"),
  Return: (newline, statement, expression) => (
    newline +
    "return " +
    generate(newline, expression) +
    ";"),
  Break: (newline, statement, label) => (
    newline +
    ("break " + label + ";")),
  Continue: (newline, statement, label) => (
    newline +
    ("continue " + label + ";")),
  Debugger: (newline, statement) => newline + "debugger;",
  Bundle: (newline, statement, statements) => ArrayLite.join(
    ArrayLite.map(
      statements,
      (statement) => generate(newline, statement)),
    ""),
  Lone: (newline, statement, labels, block) => (
    newline +
    generate_label_array(labels) +
    generate(newline, block)),
  If: (newline, statement, labels, expression, block1, block2) => (
    newline +
    generate_label_array(labels) +
    ("if (" + newline + STEP) +
    generate(newline + STEP, expression) +
    (")" + newline + "/* then */ ") +
    generate(newline, block1) +
    (newline + "else ") +
    generate(newline, block2)),
  While: (newline, statement, labels, expression, block) => (
    newline +
    generate_label_array(labels) +
    ("while (" + newline + STEP) +
    generate(newline + STEP, expression) +
    (")" + newline + "/* do */ ") +
    generate(newline, block)),
  Try: (newline, statement, labels, block1, block2, block3) => (
    newline +
    generate_label_array(labels) +
    "try " +
    generate(newline, block1) +
    ("" + newline + "catch ") +
    generate(newline, block2) +
    ("" + newline + "finally ") +
    generate(newline, block3)),
  // Expression //
  primitive: (newline, expression, primitive) => (
    primitive === void 0 ?
    "void 0" :
    (
      typeof primitive === "string" ?
      global_JSON_stringify(primitive) :
      global_String(primitive))),
  builtin: (newline, expression, builtin) => (
    "#" +
    (
      global_Reflect_apply(
        global_RegExp_prototype_test,
        /^[$_a-zA-Z][$_a-zA-Z0-9]*(\.[$_a-zA-Z][$_a-zA-Z0-9]*)*$/,
        [builtin]) ?
      builtin :
      global_JSON_stringify(builtin))),
  arrow: (newline, expression, block) => (
    "() => " +
    generate(newline, block)),
  function: (newline, expression, block) => (
    "function () " +
    generate(newline, block)),
  method: (newline, expression, block) => (
    "method () " +
    generate(newline, block)),
  constructor: (newline, expression, block) => (
    "constructor () " +
    generate(newline, block)),
  read: (newline, expression, identifier) => identifier,
  write: (newline, expression, identifier, right_expression) => (
    identifier +
    " = " +
    generate(newline, right_expression)),
  sequence: (newline, expression, first_expression, second_expression) => (
    (
      is_simple_expression(first_expression) &&
      is_simple_expression(second_expression)) ?
    (
      "(" +
      generate(null, first_expression) +
      ", " +
      generate(null, second_expression) +
      ")") :
    (
      newline += STEP,
      (
        ("(" + newline) +
        generate(newline, first_expression) +
        ("," + newline) +
        generate(newline, second_expression) +
        ")"))),
  conditional: (newline, expression, test_expression, consequent_expression, alternate_expression) => (
    (
      is_simple_expression(test_expression) &&
      is_simple_expression(consequent_expression) &&
      is_simple_expression(alternate_expression)) ?
    (
      "(" +
      generate(null, test_expression) +
      " ? " +
      generate(null, consequent_expression) +
      " : " +
      generate(null, alternate_expression) +
      ")") :
    (
      newline += STEP,
      (
        ("(" + newline) +
        generate(newline, test_expression) +
        (" ?" + newline) +
        generate(newline, consequent_expression) +
        (" :" + newline) +
        generate(newline, alternate_expression) +
        ")"))),
  throw: (newline, expression, argument_expression) => (
    "throw " +
    generate(newline, argument_expression)),
  eval: (newline, expression, argument_expression) => (
    "eval " +
    generate(newline, argument_expression)),
  apply: (newline, expression, callee_expression, this_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) ?
    (
      generate(null, callee_expression) +
      generate_apply_argument_part(newline, this_expression, argument_expression_array)) :
    (
      newline += STEP,
      (
        ("(" + newline) +
        generate(newline, callee_expression) +
        newline +
        generate_apply_argument_part(newline, this_expression, argument_expression_array) +
        ")"))),
  construct: (newline, expression, callee_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) ?
    (
      "new " +
      generate(null, callee_expression) +
      generate_construct_argument_part(newline, argument_expression_array)) :
    (
      newline += STEP,
      (
        ("(" + newline + "new ") +
        generate(newline, callee_expression) +
        newline +
        generate_construct_argument_part(newline, argument_expression_array) +
        ")"))),
  import: (newline, node, specifier, source) => (
    "import " +
    (specifier === null ? "*" : specifier) +
    " from " +
    global_JSON_stringify(source)),
  export: (newline, node, specifier, expression) => (
    "export " +
    (
      Throw.assert(specifier !== null, null, `Null expression export specifier`),
      specifier) +
    " " +
    generate(newline, expression)),
  require: (newline, expression, source_expression) => (
    "require " +
    generate(newline, source_expression)),
  unary: (newline, expression, unary, argument_expression) => (
    (unary + " ") +
    generate(newline, argument_expression)),
  binary: (newline, expression, binary, left_expression, right_expression) => (
    (
      is_simple_expression(left_expression) &&
      is_simple_expression(right_expression)) ?
    (
      "(" +
      generate(null, left_expression) +
      (" " + binary + " ") +
      generate(null, right_expression) +
      ")") :
    (
      newline += STEP,
      (
        ("(" + newline) +
        generate(newline + STEP, left_expression) +
        (" " + binary + "" + newline) +
        generate(newline + STEP, right_expression) +
        ")"))),
  object: (newline, expression, prototype_expression, properties) => (
    (
      (properties.length === 0) &&
      is_simple_expression(prototype_expression)) ?
    (
      "{__proto__:" +
      generate(null, prototype_expression) +
      "}") :
    (
      newline += STEP,
      (
        "{" +
        newline +
        "__proto__: " +
        generate(newline, prototype_expression) +
        ArrayLite.join(
          ArrayLite.map(
            properties,
            (property) => (
              "," +
              newline +
              "[" +
              generate(newline, property[0]) +
              "]:" +
              (
                (
                  is_simple_expression(property[0]) &&
                  is_simple_expression(property[1])) ?
                " " :
                newline) +
              generate(newline, property[1]))),
          "") +
        "}")))};

///////////
// Query //
///////////

const TRUE = () => true;

const FALSE = () => false;

const is_simple_expression = (expression) => Tree._dispatch(null, expression, is_simple_expression_callback_object);

const is_simple_expression_callback_object = {
  __proto__: null,
  import: TRUE,
  primitive: TRUE,
  builtin: TRUE,
  arrow: FALSE,
  function: FALSE,
  method: FALSE,
  constructor: FALSE,
  read: TRUE,
  write: (unit, expression, identifier, right_expression) => is_simple_expression(right_expression),
  sequence: FALSE,
  conditional: FALSE,
  throw: (unit, expression, argument_expression) => is_simple_expression(argument_expression),
  eval: (unit, expression, argument_expression) => is_simple_expression(argument_expression),
  export: (unit, expression, specifier, argument_expression) => is_simple_expression(argument_expression),
  require: (unit, expression, argument_expression) => is_simple_expression(argument_expression),
  apply: (unit, expression, callee_expression, this_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) &&
    Tree._match(null, this_expression, primitive_undefined_matcher) &&
    argument_expression_array.length === 0),
  construct: (unit, expression, callee_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) &&
    argument_expression_array.length === 0),
  unary: (unit, expression, unary, argument_expression) => is_simple_expression(argument_expression),
  binary: FALSE,
  object: (unit, expression, prototype_expression, properties) => (
    properties.length === 0 &&
    is_simple_expression(prototype_expression))};

/////////////
// Exports //
/////////////

exports._generate = (node) => generate("\n", node);

exports._generate_indented = (node, indent) => generate("\n" + indent, node);

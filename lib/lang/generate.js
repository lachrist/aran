
const Tree = require("../tree.js");
const ArrayLite = require("array-lite");

const global_JSON_stringify = global.JSON.stringify;
const global_String = global.String;

const STEP = "  ";

// const generate = (expression, indent) => (
//   Tree._dispatch_expression(expression_callback_object, indent, expression));
//
// const generate_statement = (statement, indent) => (
//   indent +
//   Tree._dispatch_statement(statement_callback_object, indent, statement) +
//   ";\n");
//
// const generate_block = (block, indent) => (
//   "{\n" +
//   Tree._dispatch_block(block_callback_object, indent, block) +
//   "}");

///////////
// Block //
///////////

const generate_block = (indent, block) => Tree._dispatch_block(block_callback_object, indent, block);

const block_callback_object = {
  BLOCK: (indent, block, identifiers, statements) => (
    indent += STEP,
    (
      "{" +
      (
        identifiers.length === 0 ?
        "" :
        (
          "\n" +
          indent +
          "let " +
          ArrayLite.join(identifiers, ", ") +
          ";")) +
      ArrayLite.join(
        ArrayLite.map(
          statements,
          (statement) => generate_statement(indent, statement)),
        "") +
      "}"))};

///////////////
// Statement //
///////////////

const generate_statement = (indent, statement) => Tree._dispatch_statement(statement_callback_object, indent, statement);

const generate_label_array = (labels) => ArrayLite.join(
  ArrayLite.map(
    labels,
    (label) => label + ": "),
  "");

const statement_callback_object = {
  Lift: (indent, statement, expression) => (
    ("\n" + indent) +
    generate_expression(indent, expression) +
    ";"),
  Return: (indent, statement, expression) => (
    ("\n" + indent) +
    "return " +
    generate_expression(indent, expression) +
    ";"),
  Break: (indent, statement, label) => (
    ("\n" + indent) +
    ("break " + label + ";")),
  Continue: (indent, statement, label) => (
    ("\n" + indent) +
    ("continue " + label + ";")),
  Debugger: (indent, statement) => "\n" + indent + "debugger;",
  Bundle: (indent, statement, statements) => ArrayLite.join(
    ArrayLite.map(
      statements,
      (statement) => generate_statement(indent, statement)),
    ""),
  Lone: (indent, statement, labels, block) => (
    ("\n" + indent) +
    generate_label_array(labels) +
    generate_block(indent, block)),
  If: (indent, statement, labels, expression, block1, block2) => (
    ("\n" + indent) +
    generate_label_array(labels) +
    ("if (\n" + indent + STEP) +
    generate_expression(indent + STEP, expression) +
    (")\n" + indent + "/* then */ ") +
    generate_block(indent, block1) +
    ("\n" + indent + "else ") +
    generate_block(indent, block2)),
  While: (indent, statement, labels, expression, block) => (
    ("\n" + indent) +
    generate_label_array(labels) +
    ("while (\n" + indent + STEP) +
    generate_expression(indent + STEP, expression) +
    (")\n" + indent + "/* do */ ") +
    generate_block(indent, block)),
  Try: (indent, statement, labels, block1, block2, block3) => (
    ("\n" + indent) +
    generate_label_array(labels) +
    "try " +
    generate_block(indent, block1) +
    ("\n" + indent + "catch ") +
    generate_block(indent, block2) +
    ("\n" + indent + "finally ") +
    generate_block(indent, block3))};

////////////////
// Expression //
////////////////

const generate_expression = (indent, block) => Tree._dispatch_expression(expression_callback_object, indent, block);

const expression_callback_object = {
  primitive: (indent, expression, primitive) => (
    primitive === void 0 ?
    "void 0" :
    (
      typeof primitive === "string" ?
      global_JSON_stringify(primitive) :
      global_String(primitive))),
  builtin: (indent, expression, builtin) => (
    "#" +
    builtin),
  arrow: (indent, expression, block) => (
    "() => " +
    generate_block(indent, block)),
  function: (indent, expression, block) => (
    "function () " +
    generate_block(indent, block)),
  method: (indent, expression, block) => (
    "method () " +
    generate_block(indent, block)),
  constructor: (indent, expression, block) => (
    "constructor () " +
    generate_block(indent, block)),
  read: (indent, expression, identifier) => identifier,
  write: (indent, expression, identifier, right_expression) => (
    identifier +
    " = " +
    generate_expression(indent, right_expression)),
  sequence: (indent, expression, first_expression, second_expression) => (
    (
      is_simple_expression(first_expression) &&
      is_simple_expression(second_expression)) ?
    (
      "(" +
      generate_expression(null, first_expression) +
      ", " +
      generate_expression(null, second_expression) +
      ")") :
    (
      indent += STEP,
      (
        ("(\n" + indent) +
        generate_expression(indent, first_expression) +
        (",\n" + indent) +
        generate_expression(indent, second_expression) +
        ")"))),
  conditional: (indent, expression, test_expression, consequent_expression, alternate_expression) => (
    (
      is_simple_expression(test_expression) &&
      is_simple_expression(consequent_expression) &&
      is_simple_expression(alternate_expression)) ?
    (
      "(" +
      generate_expression(null, test_expression) +
      " ? " +
      generate_expression(null, consequent_expression) +
      " : " +
      generate_expression(null, alternate_expression) +
      ")") :
    (
      indent += STEP,
      (
        ("(\n" + indent) +
        generate_expression(indent, test_expression) +
        (" ?\n" + indent) +
        generate_expression(indent, consequent_expression) +
        (" :\n" + indent) +
        generate_expression(indent, alternate_expression) +
        ")"))),
  throw: (indent, expression, argument_expression) => (
    "throw " +
    generate_expression(indent, argument_expression)),
  eval: (indent, expression, argument_expression) => (
    "eval(" +
    generate_expression(indent, argument_expression) +
    ")"),
  apply: (indent, expression, callee_expression, this_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) ?
    (
      generate_expression(null, callee_expression) +
      generate_apply_argument_part(indent, this_expression, argument_expression_array)) :
    (
      indent += STEP,
      (
        ("(\n" + indent) +
        generate_expression(indent, callee_expression) +
        ("\n" + indent) +
        generate_apply_argument_part(indent, this_expression, argument_expression_array) +
        ")"))),
  construct: (indent, expression, callee_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) ?
    (
      "new " +
      generate_expression(null, callee_expression) +
      generate_construct_argument_part(indent, argument_expression_array)) :
    (
      indent += STEP,
      (
        ("(\n" + indent + "new ") +
        generate_expression(indent, callee_expression) +
        ("\n" + indent) +
        generate_construct_argument_part(indent, argument_expression_array) +
        ")"))),
  unary: (indent, expression, unary, argument_expression) => (
    (unary + " ") +
    generate_expression(indent, argument_expression)),
  binary: (indent, expression, binary, left_expression, right_expression) => (
    (
      is_simple_expression(left_expression) &&
      is_simple_expression(right_expression)) ?
    (
      "(" +
      generate_expression(null, left_expression) +
      (" " + binary + " ") +
      generate_expression(null, right_expression) +
      ")") :
    (
      indent += STEP,
      (
        ("(\n" + indent) +
        generate_expression(indent + STEP, left_expression) +
        (" " + binary + "\n" + indent) +
        generate_expression(indent + STEP, right_expression) +
        ")"))),
  object: (indent, expression, prototype_expression, properties) => (
    (
      (properties.length === 0) &&
      is_simple_expression(prototype_expression)) ?
    (
      "{__proto__:" +
      generate_expression(null, prototype_expression) +
      "}") :
    (
      indent += STEP,
      (
        "{\n" +
        indent +
        "__proto__: " +
        generate_expression(indent, prototype_expression) +
        ArrayLite.join(
          ArrayLite.map(
            properties,
            (property) => (
              ",\n" +
              indent +
              "[" +
              generate_expression(indent, property[0]) +
              "]:" +
              (
                (
                  is_simple_expression(property[0]) &&
                  is_simple_expression(property[1])) ?
                " " :
                ("\n" + indent)) +
              generate_expression(indent, property[1]))),
          "") +
        "}")))};

const generate_apply_argument_part = (indent, this_expression, argument_expression_array) => (
  (
    is_simple_expression(this_expression) &&
    ArrayLite.every(argument_expression_array, is_simple_expression)) ?
  (
    "(" +
    ArrayLite.join(
      ArrayLite.concat(
        (
          is_undefined_expression(this_expression) ?
          [] :
          ["@" + generate_expression(null, this_expression)]),
        ArrayLite.map(
          argument_expression_array,
          (argument_expression) => generate_expression(null, argument_expression))),
      ", ") +
    ")") :
  (
    indent += STEP,
    (
      ("(\n" + indent) +
      ArrayLite.join(
        ArrayLite.concat(
          (
            is_undefined_expression(this_expression) ?
            [] :
            ["@" + generate_expression(indent, this_expression)]),
          ArrayLite.map(
            argument_expression_array,
            (argument_expression) => generate_expression(indent, argument_expression))),
        (",\n" + indent)) +
      ")")));

const generate_construct_argument_part = (indent, argument_expression_array) => (
  ArrayLite.every(argument_expression_array, is_simple_expression) ?
  (
    "(" +
    ArrayLite.join(
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => generate_expression(null, argument_expression)),
      ", ") +
    ")") :
  (
    indent += STEP,
    (
      "(\n" +
      indent +
      ArrayLite.join(
        ArrayLite.map(
          argument_expression_array,
          (argument_expression) => generate_expression(indent, argument_expression)),
        ",\n" + indent) +
      ")")));

///////////
// Query //
///////////

const TRUE = () => true;

const FALSE = () => false;

const is_simple_expression = (expression) => Tree._dispatch_expression(is_simple_expression_callback_object, null, expression);

const is_simple_expression_callback_object = {
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
  apply: (unit, expression, callee_expression, this_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) &&
    is_undefined_expression(this_expression) &&
    argument_expression_array.length === 0),
  construct: (unit, expression, callee_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) &&
    argument_expression_array.length === 0),
  unary: (unit, expression, unary, argument_expression) => is_simple_expression(argument_expression),
  binary: FALSE,
  object: (unit, expression, prototype_expression, properties) => (
    properties.length === 0 &&
    is_simple_expression(prototype_expression))};

const is_undefined_expression = (expression) => Tree._dispatch_expression(is_undefined_expression_callback_object, null, expression);

const is_undefined_expression_callback_object = {
  primitive: (unit, expression, primitive) => primitive === void 0,
  builtin: FALSE,
  arrow: FALSE,
  function: FALSE,
  method: FALSE,
  constructor: FALSE,
  read: FALSE,
  write: FALSE,
  sequence: FALSE,
  conditional: FALSE,
  throw: FALSE,
  eval: FALSE,
  apply: FALSE,
  construct: FALSE,
  unary: FALSE,
  binary: FALSE,
  object: FALSE};

/////////////
// Exports //
/////////////

exports._expression = (expression) => generate_expression("", expression);

exports._statement = (statement) => generate_statement("", statement);

exports._block = (block) => generate_block("", block);

exports._indented_expression = generate_expression;

exports._indented_statement = generate_statement;

exports._indented_block = generate_block;

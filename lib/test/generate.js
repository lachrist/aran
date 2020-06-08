
const Lang = require("../lang.js");

const STEP = "  ";

const generate_expression = (expression, indent) => (
  Lang._dispatch_expression(expression_callback_object, indent, expression));

const generate_statement = (statement, indent) => (
  indent +
  Lang._dispatch_statement(statement_callback_object, indent, statement) +
  ";\n");

const generate_block = (block, indent) => (
  "{\n" +
  Lang._dispatch_block(block_callback_object, indent, block) +
  "}");

const block_callback_object = {
  BLOCK: (indent, block, identifiers, statements) => (
    (
      identifier.length === 0 ?
      "" :
      indent + "let " ArrayLite.join(identifiers, ", ") + ";\n") +
    ArrayLite.join(
      ArrayLite.map(
        statements,
        (statement) => generate_statement(statement, indent + STEP))))};

(
  new (
    1 ?
    2 : x = 3)
  (
    @this,
    1,
    2,
    3))

f(
  @this,
  1,
  2,
  3)

if ((
  213 ?
  0123 :
  9123))
{
  123;
  456;}
else {
  sadokasdok;
  okq123;}

const expression_callback_object = {
  primitive: (indent, expression, primitive) => (
    primitive === void 0 ?
    "void 0" :
    (
      typeof primitive === "string" ?
      JSON_stringify(primitive) :
      String(primitive))),
  builtin: (indent, expression, builtin) => (
    "#" +
    builtin),
  arrow: (indent, expression, block) => (
    "() => " +
    generate_inline_block(indent, block)),
  function: (indent, expression, block) => (
    "function () " +
    generate_inline_block(indent, block)),
  read: (indent, expression, identifier) => identifier,
  write: (indent, expression, identifier, right_expression) => (
    identifier +
    " = " +
    generate_expression(indent, expression)),
  sequence: (indent, expression, first_expression, second_expression) => (
    (
      is_simple_expression(first_expression) &&
      is_simple_expression(second_expression)) ?
    (
      "(" +
      generate_expression(null, first_expression) +
      ", " +
      generate_expression(null, second_expression)) :
    (
      "(\n" +
      indent +
      generate_expression(indent + STEP, first_expression) +
      ",\n" +
      indent +
      generate_expression(indent + STEP, first_expression))),
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
      generate_expression(null, alternate_expression)) :
    (
      "(\n" +
      indent +
      generate_expression(indent + STEP, test_expression) +
      " ?\n" +
      indent +
      generate_expression(indent + STEP, consequent_expression) +
      " :\n" +
      indent +
      generate_expression(indent + STEP, alternate_expression) +
      ")")),
  throw: (indent, expression, argument_expression) => (
    "throw" +
    generate_expression(indent, expression)),
  eval: (indent, expression, identifiers, argument_expression) => (
    "eval(" +
    ArrayLite.join(
      ArrayLite.map(
        identifiers,
        (identifiers) => "§" + identifier + ", "),
      ""),
    generate_expression(indent, argument_expression) +
    ")"),
  apply: (indent, expression, callee_expression, this_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) ?
    (
      generate_expression(null, callee_expression) +
      generate_apply_argument_part(indent, this_expression, argument_expression_array)) :
    (
      "(\n" +
      indent +
      generate_expression(indent + STEP, callee_expression) +
      "\n" +
      indent +
      generate_apply_argument_part(indent + STEP, this_expression, argument_expression_array) +
      ")")),
  construct: (indent, expression, callee_expression, argument_expression_array) => (
    is_simple_expression(callee_expression) ?
    (
      "new "
      generate_expression(null, callee_expression) +
      generate_construct_argument_part(indent, argument_expression_array)) :
    (
      "(\n" +
      indent +
      "new " +
      generate_expression(indent + STEP, callee_expression) +
      "\n" +
      indent +
      generate_construct_argument_part(indent + STEP, argument_expression_array) +
      ")")),
  unary: (indent, expression, unary, argument_expression) => (
    operator +
    " " +
    generate_expression(indent, expression)),
  binary: (indent, expression, binary, left_expression, right_expression) => (
    "(\n" +
    indent +
    generate_expression(indent + STEP, left_expression) +
    binary +
    "\n" +
    indent +
    generate_expression(indent + STEP, right_expression) +
    ")"),
  object: (indent, expression, prototype_expression, properties) => (
    "{\n" +
    indent +
    "__proto__: " +
    generate_expression(indent + STEP) +
    ArrayLite.join(
      ArrayLite.map(
        properties,
        (property) => (
          ",\n" +
          indent +
          "[" +
          generate_expression(indent + STEP, property[0]) +
          "]:" +
          (
            (
              is_complex_expression(property[0]) &&
              is_complex_expression(property[1])) ?
            (
              "\n" +
              indent) :
            " ") +
          generate_expression(indent + STEP, property[1]))),
      "") +
    "}")};

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
    "(\n" +
    indent +
    ArrayLite.join(
      ArrayLite.concat(
        (
          is_undefined_expression(this_expression) ?
          [] :
          ["@" + generate_expression(indent + STEP, this_expression)]),
        ArrayLite.map(
          argument_expression_array,
          (argument_expression) => generate_expression(indent + STEP, argument_expression))),
      ",\n" + indent) +
    ")"));

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
    "(" +
    ArrayLite.join(
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => generate_expression(indent + STEP, argument_expression)),
      ",\n" + indent) +
    ")"));

const is_expression_complex = (expression) => Lang._dispatch_expression(query_expression_callback_object, null, expression);

const TRUE = () => true;

const FALSE = () => false;

const query_callback_object = {
  primitive: TRUE,
  builtin: TRUE,
  arrow: FALSE,
  function: FALSE,
  read: TRUE,
  write: (unit, expression, identifier, right_expression) => is_expression_simple(right_expression),
  sequence: FALSE,
  conditional: FALSE,
  throw: (unit, expression, argument_expression) => is_expression_simple(argument_expression),
  eval: (unit, expression, identifiers, argument_expression) => is_expression_simple(argument_expression),
  apply: FALSE,
  construct: (unit, expression, callee_expression, expressions) => (
    expressions.length === 0 &&
    is_expression_simple(callee_expression)),
  unary: (unit, expression, unary, argument_expression) => is_expression_simple(argument_expression),
  binary: FALSE,
  object: (unit, expression, prototype_expression, properties) => (
    properties.length === 0 &&
    is_expression_simple(prototype_expression))};

const query_callback_prototype = {
  primitive: FALSE,
  builtin: FALSE,
  arrow: FALSE,
  function: FALSE,
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

const is_undefined_callback_object = {
  __proto__: query_callback_prototype,
  primitive: (unit, expression, primitive) => primitive === void 0}

const is_string_callback_object = {}

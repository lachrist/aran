"use strict";

const global_Number_prototype_toString = global.Number.prototype.toString;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_charCodeAt = global.String.prototype.charCodeAt;
const global_Object_assign = global.Object.assign;
const global_JSON_stringify = global.JSON.stringify;
const global_String = global.String;
const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");

const DROPPED_USAGE = "dropped";
const CALLEE_USAGE = "callee";
const NORMAL_USAGE = null;

const lift_matcher = ["Lift", () => true];
const primitive_undefined_matcher = ["primitive", void 0];
const override_callee_matcher_1 = [
  "block",
  (identifiers) => true,
  (statements) => (
    statements.length > 0 &&
    Tree._match(
      null,
      statements[0],
      override_callee_matcher_2))];
const override_callee_matcher_2 = [
  "apply",
  ["builtin", "Reflect.set"],
  ["primitive", void 0],
  [
    ["read", "input"],
    ["primitive", "callee"],
    (expression) => true]];

const labelize = (labels) => ArrayLite.map(labels, labelize_map)
const labelize_map = (label) => `${label}: `;

const fetch = (context, type) => (
  context.type === type ?
  context :
  global_Reflect_getPrototypeOf(context, type));

const encode = (string) => {
  let result = "";
  for (let index = 0; index < string.length; index++) {
    let item = global_Reflect_apply(
      global_Number_prototype_toString,
      global_Reflect_apply(
        global_String_prototype_charCodeAt,
        string,
        [index]),
      [16]);
    while (item.length < 4) {
      item = "0" + item;
    }
    result += item;
  }
  return result;
};

module.exports = (program, options, _counter) => (
  _counter = 0,
  visit_program(
    program,
    global_Object_assign(
      {
        __proto__: null,
        type: "program",
        newline: "\n",
        step: "  ",
        local: false,
        builtin: "__aran_builtin__",
        namespace: {
          builtin: "BUILTIN",
          arguments: "ARGUMENTS",
          error: "ERROR",
          export: (specifier) => `EXPORT_${specifier}`,
          import: (specifier, source) => (
            specifier === null ?
            `IMPORT_0_FROM_${encode(source)}` :
            `IMPORT_${specifier}_FROM_${encode(source)}`),
          callee: () => `CALLEE_${global_String(_counter++)}`},
        convert: (identifier) => `$${identifier}`,
        apply: (expression1, expression2, expressions, code1, code2, codes) => null,
        construct: (expression, expressions, code, codes) => null},
    options)));

const visit_program = (program, context) => (
  context.newline +
  Tree._dispatch(
    {
      __proto__: context,
      type: "program",
      newline: `${context.newline}${context.step}` },
    program,
    program_callback_object));

const visit_prelude = (prelude, context) => (
  context.newline +
  Tree._dispatch(
    {
      __proto__: fetch(context, "program"),
      type: "prelude"},
    prelude,
    prelude_callback_object));

const visit_block = (block, context, sort, callee) => (
  context.newline +
  Tree._dispatch(
    {
      __proto__: fetch(context, "program"),
      type: "block",
      newline: `${context.newline}${context.step}`,
      sort: sort,
      callee: callee},
    block,
    block_callback_object));

const visit_statement = (statement, context, identifiers, _is_lift) => (
  _is_lift = Tree._match(null, statement, lift_matcher),
  (
    (
      _is_lift ?
      `` :
      context.newline) +
    Tree._dispatch(
      {
        __proto__: fetch(context, "block"),
        type: "statement",
        newline: (
          _is_lift ?
          context.newline :
          `${context.newline}${context.step}`),
        identifiers: identifiers},
      statement,
      statement_callback_object)));

const visit_expression = (expression, context, usage) => (
  context.newline +
  Tree._dispatch(
    {
      __proto__: fetch(context, "statement"),
      type: "expression",
      newline: `${context.newline}${context.step}`,
      usage: usage},
    expression,
    expression_callback_object));

const program_callback_object = {
  __proto__: null,
  _program: (context, node, preludes, block) => (
    (
      context.local ?
      `"use strict";` :
      `"use strict"; const ${context.namespace.builtin} = this[${global_JSON_stringify(context.builtin)}];`) +
    ArrayLite.join(
      ArrayLite.map(
        preludes,
        (prelude) => visit_prelude(prelude, context)),
      "") +
    visit_block(block, context, "program", null))};

const prelude_callback_object = {
  _import: (context, node, specifier, source) => (
    specifier === null ?
    `import * as ${context.namespace.import(specifier, source)} from ${global_JSON_stringify(source)};` :
    `import {${specifier} as ${context.namespace.import(specifier, source)}} from ${global_JSON_stringify(source)};`),
  _export: (context, node, specifier) => (
    `let ${context.namespace.export(specifier)}; ` +
    `export {${context.namespace.export(specifier)} as ${specifier}};`),
  // console.assert((specifier1 === null) === (specifier2 === null))
  _aggregate: (context, node, specifier1, source, specifier2) => (
    specifier1 === null ?
    `export * from ${global_JSON_stringify(source)};` :
    `export {${specifier1} as ${specifier2}} from ${global_JSON_stringify(source)};`)};

const coma_identifier = (identifier) => `, ${identifier}`;

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, identifiers, statements, _code) => (
    identifiers = ArrayLite.map(identifiers, context.convert),
    _code = ArrayLite.join(
      ArrayLite.map(
        statements,
        (statement) => visit_statement(statement, context, identifiers)),
      ""),
    (
      (
        context.sort === "catch" ?
        `catch (${context.namespace.error}) { ` :
        (
          (
            context.sort === "finally" ||
            context.sort === "else") ?
          `${context.sort} { ` :
          `{ `)) +
      `let ${context.convert("input")}${ArrayLite.join(ArrayLite.map(identifiers, coma_identifier), "")}; ` +
      (
        context.sort === "arrow" ?
        `${context.convert("input")} = {__proto__:null, callee:${context.callee}, arguments:${context.namespace.arguments}};` :
        (
          context.sort === "method" ?
          `${context.convert("input")} = {__proto__:null, callee:${context.callee}, arguments:${context.namespace.arguments}, this:this};` :
          (
            context.sort === "constructor" ?
            `${context.convert("input")} = {__proto__:null, callee:${context.callee}, arguments:${context.namespace.arguments}, "new.target":new.target};` :
            (
              context.sort === "function" ?
              `${context.convert("input")} = {__proto__:null, callee:${context.callee}, arguments:${context.namespace.arguments}, this:this, "new.target":new.target};` :
              (
                context.sort === "catch" ?
                `${context.convert("input")} = {__proto__:null, error:${context.namespace.error}};` :
                `${context.convert("input")} = {__proto__:null};`))))) +
      _code +
      ` }`))};

const statement_callback_object = {
  __proto__: null,
  // Atomic Statement //
  Lift: (context, node, expression) => `${visit_expression(expression, context, DROPPED_USAGE)};`,
  Return: (context, node, expression) => `return (${visit_expression(expression, context, NORMAL_USAGE)});`,
  Break: (context, node, label) => `break ${label};`,
  Continue: (context, node, label) => `continue ${label};`,
  Debugger: (context, node) => `debugger;`,
  // Compound Statement //
  Lone: (context, node, labels, block) => `${labelize(labels)}/* lone */${visit_block(block, context, "lone", null)}`,
  If: (context, node, labels, expression, block1, block2) => (
    `${labelize(labels)}if (${visit_expression(expression, context, NORMAL_USAGE)})` +
    `${visit_block(block1, context, "then", null)}` +
    `${visit_block(block2, context, "else", null)}`),
  While: (context, node, labels, expression, block) => (
    `${labelize(labels)}while (${visit_expression(expression, context, NORMAL_USAGE)})` +
    `${visit_block(block, context, "do", null)}`),
  Try: (context, node, labels, block1, block2, block3, _statements) => (
    `${labelize(labels)}try` +
    `${visit_block(block1, context, "try", null)}` +
    `${visit_block(block2, context, "catch", null)}` +
    `${visit_block(block3, context, "finally", null)}`)};

const make_closure_callback = (sort, make) => (context, node, block, _identifier) => (
  Tree._match(block, override_callee_matcher_1) ?
  `(${make(
    context.namespace.arguments,
    visit_block(block, context, sort, "null"))})` :
  (
    _identifier = context.namespace.callee(),
    context.identifiers[context.identifiers.length] = _identifier,
    (
      `(` +
      `${_identifier} = ${make(
        context.namespace.arguments,
        visit_block(block, context, sort, _identifier))}, ` +
      `${_identifier})`)));

const expression_callback_object = {
  __proto__: null,
  // Literal //
  primitive: (context, node, primitive) => (
    primitive === void 0 ?
    `(void 0)` :
    (
      typeof primitive === "bigint" ?
      `${global_String(primitive)}n` :
      (
        typeof primitive === "string" ?
        global_JSON_stringify(primitive) :
        global_String(primitive)))),
  builtin: (context, node, builtin) => (
    context.usage === "callee" ?
    `(null, ${context.namespace.builtin}[${global_JSON_stringify(builtin)}])` :
    `${context.namespace.builtin}[${global_JSON_stringify(builtin)}]`),
  arrow: make_closure_callback(
    "arrow",
    (identifier, code) => `(...${identifier}) =>${code}`),
  method: make_closure_callback(
    "method",
    (identifier, code) => `({ method (...${identifier})${code}}).method`),
  constructor: make_closure_callback(
    "constructor",
    (identifier, code) => `function (...${identifier})${code}`),
  function: make_closure_callback(
    "function",
    (identifier, code) => `function (...${identifier})${code}`),
  // Environment //
  read: (context, node, identifier) => context.convert(identifier),
  write: (context, node, identifier, expression, _code) => (
    _code = (
      `${context.convert(identifier)} =` +
      `${visit_expression(expression, context, NORMAL_USAGE)}`),
    context.usage === DROPPED_USAGE ? `(${_code})` : `(${_code}, void 0)`),
  eval: (context, node, expression) => `eval(${visit_expression(expression, context, NORMAL_USAGE)})`,
  require: (context, node, expression) => `import(${visit_expression(expression, context, NORMAL_USAGE)})`,
  import: (context, node, specifier, source) => context.namespace.import(specifier, source),
  export: (context, node, specifier, expression, _code) => (
    _code = (
      `${context.namespace.export(specifier)} =` +
      `${visit_expression(expression, context, NORMAL_USAGE)}`),
    context.usage === DROPPED_USAGE ? `(${_code})` : `(${_code}, void 0)`),
  // Control //
  conditional: (context, node, expression1, expression2, expression3) => (
    `(` +
    `${visit_expression(expression1, context, NORMAL_USAGE)} ?` +
    `${visit_expression(expression2, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE)} :` +
    `${visit_expression(expression3, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE)})`),
  sequence: (context, node, expression1, expression2) => (
    `(` +
    `${visit_expression(expression1, context, DROPPED_USAGE)},` +
    `${visit_expression(expression2, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE)})`),
  throw: (context, node, expression1, expression2) => `((() => { throw${visit_expression(expression1, context, NORMAL_USAGE)}; }) ())`,
  // Combiner //
  unary: (context, node, operator, expression) => (
    `(${operator}` +
    `${visit_expression(expression, context, NORMAL_USAGE)})`),
  binary: (context, node, operator, expression1, expression2) => (
    `(` +
    `${visit_expression(expression1, context, NORMAL_USAGE)} ${operator}` +
    `${visit_expression(expression2, context, NORMAL_USAGE)})`),
  object: (context, node, expression, properties) => (
    `({` +
    `${context.newline}__proto__: ${visit_expression(expression, context, NORMAL_USAGE)}` +
    ArrayLite.join(
      ArrayLite.map(
        properties,
        ({0:expression1, 1:expression2}) => (
          `${context.newline}, ${visit_expression(expression1, context, NORMAL_USAGE)}` +
          `${context.newline}: ${visit_expression(expression2, context, NORMAL_USAGE)}`)),
      "") +
    `})`),
  construct: (context, node, expression, expressions, _code, _codes) => (
    _code = visit_expression(expression, context, NORMAL_USAGE),
    _codes = ArrayLite.visit_expression(
      expressions,
      (expression) => visit_expression(expression, context, NORMAL_USAGE)),
    (
      context.construct(expression, expressions, _result, _results) ||
      (
        `(` +
        `${context.newline}new ${_code} (` +
        ArrayLite.join(
          ArrayLite.map(
            _codes,
            (code) => `${context.newline}${code}`),
          `,`) +
        `))`))),
  apply: (context, node, expression1, expression2, expressions, _is_this_undefined, _code1, _code2, _codes) => (
    _is_this_undefined = Tree._match(expression2, primitive_undefined_matcher),
    _code1 = visit_expression(expression1, context, _is_this_undefined ? CALLEE_USAGE : NORMAL_USAGE),
    _code2 = visit_expression(expression2, context, NORMAL_USAGE),
    _codes = ArrayLite.map(
      expressions,
      (expression) => visit_expression(expression, context, NORMAL_USAGE)),
    (
      context.apply(expression1, expression2, expressions, _code1, _code2, _codes) ||
      (
        _is_this_undefined ?
        (
          `(` +
          `${context.newline}${_code1} (` +
          ArrayLite.join(
            ArratLite.map(
              _codes,
              (code) => `${context.newline}${code}`),
            `,`) +
          `))`) :
        (
          `builtin["Reflect.apply"](` +
          `${context.newline}${_code1},` +
          `${context.newline}${_code2}, [` +
          ArrayLite.join(
            ArrayLite.map(
              _codes,
              (code) => `${context.newline}${code}`),
            `,`) +
          `])`))))};

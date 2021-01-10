"use strict";

const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_String_prototype_startsWith = global.String.prototype.startsWith;
const global_Number_prototype_toString = global.Number.prototype.toString;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_charCodeAt = global.String.prototype.charCodeAt;
const global_Object_assign = global.Object.assign;
const global_JSON_stringify = global.JSON.stringify;
const global_String = global.String;
const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");
const Tree = require("./tree.js");

const DROPPED_USAGE = "dropped";
const CALLEE_USAGE = "callee";
const NORMAL_USAGE = null;

const lift_matcher = ["Lift", () => true];
const lone_matcher = ["Lone", () => true];
const primitive_undefined_matcher = ["primitive", void 0];
const override_callee_matcher_1 = [
  "BLOCK",
  (context, labels) => true,
  (context, identifiers) => true,
  (context, statements) => (
    statements.length > 0 &&
    Tree._match(
      null,
      statements[0],
      override_callee_matcher_2))];
const override_callee_matcher_2 = [
  "Lift",
  [
    "apply",
    ["intrinsic", "Reflect.set"],
    ["primitive", void 0],
    [
      ["read", "input"],
      ["primitive", "callee"],
      ["read", (context, identifier) => true]]]];

const build = {
  code: {
    __proto__:null,
    __newline__: (newline, code) => `${newline}${code}`},
  estree: {
    __proto__:null,
    __newline__: (newline, estree) => estree}};

const fetch = (context, type) => (
  context.type === type ?
  context :
  fetch(
    global_Reflect_getPrototypeOf(context),
    type));

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

// interface Options = {
//   source: "module" | "script" | "eval",
//   local: boolean,
//   output: "code" | "estree",
//   newline: string,
//   indent: string,
//   instrinsic: string,
//   namespace: {
//     callee: string,
//     instrinsic: string,
//     arguments: string,
//     error: string,
//     export: string,
//     import: string
//   },
//   generate: {
//     identifier: (string) -> string,
//     label: (string) -> string,
//     apply: (...) -> null | result,
//     construct: (...) -> null | result
//   }
// };

module.exports = (program, options) => visit_program(
  program,
  global_Object_assign(
    {__proto__:null},
    options,
    {
      build: build[options.output],
      namespace: ArrayLite.reduce(
        global_Reflect_ownKeys(options.namespace),
        (namespace, key) => (
          namespace[key] = options.prefix + options.namespace[key],
          namespace),
        {__proto__:null}),
      generate: {
        __proto__: options.generate,
        identifier: (identifier) => options.prefix + options.generate.identifier(identifier)}}));

const visit_program = (program, context) => context.build.__newline__(
  context.newline,
  Tree._dispatch(
    {
      __proto__: context,
      type: "program",
      counter: 0,
      newline: `${context.newline}${context.indent}` },
    program,
    program_callback_object));

const visit_prelude = (prelude, context, identifiers) => context.build.__newline__(
  context.newline,
  Tree._dispatch(
    {
      __proto__: fetch(context, "program"),
      type: "prelude",
      identifiers: identifiers},
    prelude,
    prelude_callback_object));

const visit_block = (block, context, sort, callee) => context.build.__newline__(
  context.newline,
  Tree._dispatch(
    {
      __proto__: fetch(context, "program"),
      type: "block",
      newline: `${context.newline}${context.indent}`,
      sort: sort,
      callee: callee},
    block,
    block_callback_object));

const visit_statement = (statement, context, identifiers, _is_inlined) => (
  _is_inlined = (
    Tree._match(null, statement, lift_matcher) ||
    Tree._match(null, statement, lone_matcher)),
  context.build.__newline__(
    (
      _is_inlined ?
      `` :
      context.newline),
    Tree._dispatch(
      {
        __proto__: fetch(context, "block"),
        type: "statement",
        newline: (
          _is_inlined ?
          context.newline :
          `${context.newline}${context.indent}`),
        identifiers: identifiers},
      statement,
      statement_callback_object)));

const visit_expression = (expression, context, usage) => context.build.__newline__(
  context.newline,
  Tree._dispatch(
    {
      __proto__: fetch(context, "statement"),
      type: "expression",
      newline: `${context.newline}${context.indent}`,
      usage: usage},
    expression,
    expression_callback_object));

/////////////
// Program //
/////////////

build.code._program = (source, local, namespace_intrinsic, intrinsic, identifiers, codes, code) => (
  `"use strict";` +
  (
    identifiers.length === 0 ?
    `` :
    ` let ${ArrayLite.join(identifiers, ", ")};`) +
  ArrayLite.join(codes, "") +
  ` ((() =>${code}) ());`);
build.estree._program = (source, local, namespace_intrinsic, intrinsic, identifiers, estrees, estree) => ({
  type: "Program",
  sourceType: source === "module" ? "module" : "script",
  body: ArrayLite.concat(
    [
      {
        type: "ExpressionStatement",
        expression: {
          type: "Literal",
          value: "use strict"}}],
    (
      identifiers.length === 0 ?
      [] :
      [
        {
          type: "VariableDeclaration",
          kind: "let",
          declarations: ArrayLite.map(identifiers, declarator)}]),
    estrees,
    [
      {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "ArrowFunctionExpression",
            generator: false,
            async: false,
            expression: false,
            params: [],
            body: estree},
          arguments: []}}])});

const program_callback_object = {
  __proto__: null,
  _program: (context, node, preludes, block, _identifiers) => (
    _identifiers = [],
    context.build._program(
      context.source,
      context.local,
      context.namespace.intrinsic,
      context.intrinsic,
      _identifiers,
      ArrayLite.map(
        preludes,
        (prelude) => visit_prelude(prelude, context, _identifiers)),
      visit_block(block, context, context.source, null)))};

/////////////
// Prelude //
/////////////

build.code._import = (specifier, identifier, source) => (
  specifier === null ?
  `import * as ${identifier} from ${global_JSON_stringify(source)};` :
  `import {${specifier} as ${identifier}} from ${global_JSON_stringify(source)};`);
build.estree._import = (specifier, identifier, source) => ({
  type: "ImportDeclaration",
  specifiers: [
    (
      specifier === null ?
      {
        type:"ImportNamespaceSpecifier",
        local: {
          type: "Identifier",
          name: identifier}} :
      {
        type: "ImportSpecifier",
        local: {
          type: "Identifier",
          name: identifier},
        imported: {
          type: "Identifier",
          name: specifier}})],
  source: {
    type: "Literal",
    value: source}});

build.code._export = (identifier, specifier) => (
  `export {${identifier} as ${specifier}};`);
build.estree._export = (identifier, specifier) => ({
  type: "ExportNamedDeclaration",
  declaration: null,
  specifiers: [
    {
      type: "ExportSpecifier",
      local: {
        type: "Identifier",
        name: identifier},
      exported: {
        type: "Identifier",
        name: specifier}}],
  source: null});

build.code._aggregate = (specifier1, source, specifier2) => (
  specifier1 === null ?
  `export * from ${global_JSON_stringify(source)};` :
  `export {${specifier1} as ${specifier2}} from ${global_JSON_stringify(source)};`);
build.estree._aggregate = (specifier1, source, specifier2) => (
  specifier1 === null ?
  {
    type: "ExportAllDeclaration",
    source: {
      type: "Literal",
      value: source}} :
  {
    type: "ExportNamedDeclaration",
    declaration: null,
    specifiers: [
      {
        type: "ExportSpecifier",
        local: {
          type: "Identifier",
          name: specifier1},
        exported: {
          type: "Identifier",
          name: specifier2}}],
    source: {
      type: "Literal",
      value: source}});

const prelude_callback_object = {
  __proto__: null,
  _import: (context, node, specifier, source) => context.build._import(
    specifier,
    `${context.namespace.import}_${specifier === null ? `0` : specifier}_${encode(source)}`,
    source),
  _export: (context, node, specifier, _identifier) => (
    _identifier = `${context.namespace.export}_${specifier}`,
    context.identifiers[context.identifiers.length] = _identifier,
    context.build._export(_identifier, specifier)),
  // console.assert((specifier1 === null) === (specifier2 === null))
  _aggregate: (context, node, specifier1, source, specifier2) => context.build._aggregate(
    specifier1,
    source,
    specifier2)};

///////////
// Block //
///////////

const declarator = (identifier) => ({
  type: "VariableDeclarator",
  id: {
    type: "Identifier",
    name: identifier},
  init: null});

const labelize_estree = (estree, label) => ({
  type: "LabeledStatement",
  label: {
    type: "Identifier",
    name: label},
  body: estree});

// console.assert(identifiers.length > 0) // because of the input identifier
build.code.BLOCK = (context, input_identifier, labels, identifiers, codes, _callee) => (
  _callee = context.callee === null ? "null" : context.callee,
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
    (
      labels.length > 0 ?
      `${ArrayLite.join(labels, ": ")}: { ` :
      ``) +
    (
      (
        context.sort === "script" ||
        context.sort === "module" ||
        (
          context.sort === "eval" &&
          !context.local)) ?
      `const ${context.namespace.intrinsic} = ${context.intrinsic}; ` :
      ``) +
    `let ${ArrayLite.join(identifiers, ", ")}; ` +
    (
      context.sort === "arrow" ?
      `${input_identifier} = {__proto__:null, callee:${_callee}, arguments:${context.namespace.arguments}};` :
      (
        context.sort === "method" ?
        `${input_identifier} = {__proto__:null, callee:${_callee}, arguments:${context.namespace.arguments}, this:this};` :
        (
          context.sort === "constructor" ?
          `${input_identifier} = {__proto__:null, callee:${_callee}, arguments:${context.namespace.arguments}, "new.target":new.target};` :
          (
            context.sort === "function" ?
            `${input_identifier} = {__proto__:null, callee:${_callee}, arguments:${context.namespace.arguments}, this:this, "new.target":new.target};` :
            (
              context.sort === "catch" ?
              `${input_identifier} = {__proto__:null, error:${context.namespace.error}};` :
              `${input_identifier} = {__proto__:null};`))))) +
    ArrayLite.join(codes, "") +
    (labels.length > 0 ? ` }` : ``) +
    ` }`));
build.estree.BLOCK = (context, input_identifier, labels, identifiers, estrees, _estree) => (
  _estree = {
    type: "BlockStatement",
    body: ArrayLite.concat(
      (
        (
          context.sort === "script" ||
          context.sort === "module" ||
          (
            context.sort === "eval" &&
            !context.local)) ?
        [
          {
            type: "VariableDeclaration",
            kind: "const",
            declarations: [
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: context.namespace.intrinsic},
                init: {
                  type: "Identifier",
                  name: context.intrinsic}}]}] :
        []),
      [
        {
          type: "VariableDeclaration",
          kind: "let",
          declarations: ArrayLite.map(identifiers, declarator)},
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "Identifier",
              name: input_identifier},
            right: {
              type: "ObjectExpression",
              properties: ArrayLite.concat(
                [
                  {
                    type: "Property",
                    kind: "init",
                    method: false,
                    computed: false,
                    key: {
                      type: "Identifier",
                      name: "__proto__"},
                    value: {
                      type: "Literal",
                      value: null}}],
                (
                  (
                    context.sort === "arrow" ||
                    context.sort === "method" ||
                    context.sort === "constructor" ||
                    context.sort === "function") ?
                  [
                    {
                      type: "Property",
                      kind: "init",
                      method: false,
                      computed: false,
                      shorthand: false,
                      key: {
                        type: "Identifier",
                        name: "callee"},
                      value: (
                        context.callee === null ?
                        {
                          type: "Literal",
                          value: null} :
                        {
                          type: "Identifier",
                          name: context.callee})},
                    {
                      type: "Property",
                      kind: "init",
                      method: false,
                      computed: false,
                      shorthand: false,
                      key: {
                        type: "Identifier",
                        name: "arguments"},
                      value: {
                        type: "Identifier",
                        name: context.namespace.arguments}}] :
                  []),
                (
                  (
                    context.sort === "method" ||
                    context.sort === "function") ?
                  [
                    {
                      type: "Property",
                      kind: "init",
                      method: false,
                      computed: false,
                      shorthand: false,
                      key: {
                        type: "Identifier",
                        name: "this"},
                      value: {
                        type: "ThisExpression"}}] :
                  []),
                (
                  (
                    context.sort === "constructor" ||
                    context.sort === "function") ?
                  [
                    {
                      type: "Property",
                      kind: "init",
                      method: false,
                      computed: false,
                      shorthand: false,
                      key: {
                        type: "Literal",
                        value: "new.target"},
                      value: {
                        type: "MetaProperty",
                        meta: {
                          type: "Identifier",
                          name: "new"},
                        property: {
                          type: "Identifier",
                          name: "target"}}}] :
                  []),
                (
                  context.sort === "catch" ?
                  [
                    {
                      type: "Property",
                      kind: "init",
                      method: false,
                      computed: false,
                      shorthand: false,
                      key: {
                        type: "Identifier",
                        name: "error"},
                      value: {
                        type: "Identifier",
                        name: context.namespace.error}}] :
                  []))}}}],
      estrees)},
  _estree = (
    labels.length > 0 ?
    {
      type: "BlockStatement",
      body: [
        ArrayLite.reduce(
          ArrayLite.reverse(labels),
          labelize_estree,
          _estree)]} :
    _estree),
  (
    context.sort === "catch" ?
    {
      type: "CatchClause",
      param: {
        type: "Identifier",
        name: context.namespace.error},
      body: _estree} :
    _estree));

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, labels, identifiers, statements, _identifiers, _results) => (
    _identifiers = ArrayLite.map(
      ArrayLite.concat(["input"], identifiers),
      context.generate.identifier),
    _results = ArrayLite.map(
      statements,
      (statement) => visit_statement(statement, context, _identifiers)),
    context.build.BLOCK(
      context,
      context.generate.identifier("input"),
      ArrayLite.map(
        labels,
        context.generate.label),
      _identifiers,
      _results))};

//////////////////////
// Atomic Statement //
//////////////////////

build.code.Lift = (code) => `${code};`;
build.estree.Lift = (estree) => ({
  type: "ExpressionStatement",
  expression: estree});

build.code.EnclaveDeclare = (kind, identifier, code) => `${kind} ${identifier} =${code};`;
build.estree.EnclaveDeclare = (kind, identifier, estree) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: identifier},
      init: estree}]});

build.code.Return = (code) => `return (${code});`;
build.estree.Return = (estree) => ({
  type: "ReturnStatement",
  argument: estree});

build.code.Break = (label) => `break ${label};`;
build.estree.Break = (label) => ({
  type: "BreakStatement",
  label: {
    type: "Identifier",
    name: label}});

build.code.Debugger = (label) => `debugger;`;
build.estree.Debugger = (label) => ({
  type: "DebuggerStatement"});

////////////////////////
// Compound Statement //
////////////////////////

build.code.Lone = (code) => code;
build.estree.Lone = (estree) => estree;

build.code.If = (code1, code2, code3) => `if (${code1})${code2}${code3}`;
build.estree.If = (estree1, estree2, estree3) => ({
  type: "IfStatement",
  test: estree1,
  consequent: estree2,
  alternate: estree3});

build.code.While = (code1, code2) => `while (${code1})${code2}`;
build.estree.While = (estree1, estree2) => ({
  type: "WhileStatement",
  test: estree1,
  body: estree2});

build.code.Try = (code1, code2, code3) => `try${code1}${code2}${code3}`;
build.estree.Try = (estree1, estree2, estree3) => ({
  type: "TryStatement",
  block: estree1,
  handler: estree2,
  finalizer: estree3});

const statement_callback_object = {
  __proto__: null,
  // Atomic Statement //
  EnclaveDeclare: (context, node, kind, identifier, expression) => context.build.EnclaveDeclare(
    kind,
    identifier,
    visit_expression(expression, context, NORMAL_USAGE)),
  Lift: (context, node, expression) => context.build.Lift(
    visit_expression(expression, context, DROPPED_USAGE)),
  Return: (context, node, expression) => context.build.Return(
    visit_expression(expression, context, NORMAL_USAGE)),
  Break: (context, node, label) => context.build.Break(
    context.generate.label(label)),
  Debugger: (context, node) => context.build.Debugger(),
  // Compound Statement //
  Lone: (context, node, block) => context.build.Lone(
    visit_block(block, context, "lone", null)),
  If: (context, node, expression, block1, block2) => context.build.If(
    visit_expression(expression, context, NORMAL_USAGE),
    visit_block(block1, context, "then", null),
    visit_block(block2, context, "else", null)),
  While: (context, node, expression, block) => context.build.While(
    visit_expression(expression, context, NORMAL_USAGE),
    visit_block(block, context, "do", null)),
  Try: (context, node, block1, block2, block3) => context.build.Try(
    visit_block(block1, context, "try", null),
    visit_block(block2, context, "catch", null),
    visit_block(block3, context, "finally", null))};

////////////////////////
// Expression Literal //
////////////////////////

build.code.closure = (usage, sort, asynchronous, generator, callee, namespace_arguments, code) => (
  asynchronous = asynchronous ? "async " : "",
  generator = generator ? "*" : "",
  code = (
    sort === "arrow" ?
    `${asynchronous}${generator}(...${namespace_arguments}) =>${code}` :
    (
      sort === "method" ?
      `({${asynchronous}${generator}method (...${namespace_arguments})${code}}).method` :
      // console.assert(sort === "constructor" || sort === "function")
      `${asynchronous}function${generator} (...${namespace_arguments})${code}`)),
  (
    (
      sort === "method" &&
      usage === CALLEE_USAGE &&
      callee === null) ?
    `(null, ${code})` :
    (
      callee === null ?
      `(${code})` :
      `(${callee} = ${code})`)));
build.estree.closure = (usage, sort, asynchronous, generator, callee, namespace_arguments, estree) => (
  estree = {
    type: sort === "arrow" ? "ArrowFunctionExpression" : "FunctionExpression",
    async: asynchronous,
    generator: generator,
    expression: false,
    params: [
      {
        type: "RestElement",
        argument: {
          type: "Identifier",
          name: namespace_arguments}}],
    body: estree},
  estree = (
    sort === "method" ?
    {
      type: "MemberExpression",
      computed: false,
      optional: false,
      object: {
        type: "ObjectExpression",
        properties: [
          {
            type: "Property",
            kind: "init",
            method: true,
            shorthand: false,
            computed: false,
            key: {
              type: "Identifier",
              name: "method"},
            value: estree}]},
      property: {
        type: "Identifier",
        name: "method"}} :
    estree),
  estree = (
    (
      sort === "method" &&
      usage === CALLEE_USAGE &&
      callee === null) ?
    {
      type: "SequenceExpression",
      expressions: [
        {
          type: "Literal",
          value: null},
        estree]} :
    estree),
  (
    callee === null ?
    estree :
    {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: callee},
      right: estree}));

build.code.primitive = (primitive) => (
  primitive === void 0 ?
  `(void 0)` :
  (
    typeof primitive === "bigint" ?
    `${global_String(primitive)}n` :
    (
      typeof primitive === "string" ?
      global_JSON_stringify(primitive) :
      global_String(primitive))));
build.estree.primitive = (primitive) => (
  primitive === void 0 ?
  {
    type: "UnaryExpression",
    prefix: true,
    operator: "void",
    argument: {
      type: "Literal",
      value: 0}} :
  {
    type: "Literal",
    value: primitive});

build.code.intrinsic = (usage, namespace_intrinsic, intrinsic_name, _code) => (
  _code = `${namespace_intrinsic}[${global_JSON_stringify(intrinsic_name)}]`,
  usage === "callee" ? `(null, ${_code})` : `(${_code})`);
build.estree.intrinsic = (usage, namespace_intrinsic, intrinsic_name, _estree) => (
  _estree = {
    type: "MemberExpression",
    computed: true,
    optional: false,
    object: {
      type: "Identifier",
      name: namespace_intrinsic},
    property: {
      type: "Literal",
      value: intrinsic_name}},
  (
    usage === CALLEE_USAGE ?
    {
      type: "SequenceExpression",
      expressions: [
        {
          type: "Literal",
          value: null},
        _estree]} :
    _estree));

////////////////////////////
// Expression Environment //
////////////////////////////

build.code.read = (identifier) => identifier;
build.estree.read = (identifier) => ({
  type: "Identifier",
  name: identifier});

build.code.enclave_read = build.code.read;
build.estree.enclave_read = build.estree.read;

build.code.enclave_typeof = (identifier) => `typeof ${identifier}`;
build.estree.enclave_typeof = (identifier) => ({
  type: "UnaryExpression",
  operator: "typeof",
  prefix: true,
  argument: {
    type: "Identifier",
    name: identifier}});

build.code.enclave_write = (input_identifier, namespace, strict, usage, identifier, code) => (
  strict ?
  build.code.write(usage, identifier, code) :
  (
    `(((${input_identifier}) => { ` +
      `try { ${identifier} = ${input_identifier}; } ` +
      `catch (${namespace.error}) { ` +
        `if (${namespace.error} instanceof ${namespace.intrinsic}.ReferenceError) ` +
          `${namespace.intrinsic}["aran.globalObjectRecord"].t = ${input_identifier}; ` +
        `else ` +
          `throw ${namespace.error}; } }) (${code}))`)),
build.estree.enclave_write = (input_identifier, namespace, strict, usage, identifier, estree) => (
  strict ?
  build.estree.write(usage, identifier, estree) :
  {
    type: "CallExpression",
    optional: false,
    callee: {
      type: "ArrowFunctionExpression",
      generator: false,
      async: false,
      expression: false,
      params: [
        {
          type: "Identifier",
          name: input_identifier}],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "TryStatement",
            block: {
              type: "BlockStatement",
              body: [
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: {
                      type: "Identifier",
                      name: identifier},
                    right: {
                      type: "Identifier",
                      name: input_identifier}}}]},
            handler: {
              type: "CatchClause",
              param: {
                type: "Identifier",
                name: namespace.error},
              body: {
                type: "BlockStatement",
                body: [
                  {
                    type: "IfStatement",
                    test: {
                      type: "BinaryExpression",
                      operator: "instanceof",
                      left: {
                        type: "Identifier",
                        name: namespace.error},
                      right: {
                        type: "MemberExpression",
                        optional: false,
                        computed: false,
                        object: {
                          type: "Identifier",
                          name: namespace.intrinsic},
                        property: {
                          type: "Identifier",
                          name: "ReferenceError"}}},
                    consequent: {
                      type: "ExpressionStatement",
                      expression: {
                        type: "AssignmentExpression",
                        operator: "=",
                        left: {
                          type: "MemberExpression",
                          optional: false,
                          computed: false,
                          object: {
                            type: "MemberExpression",
                            optional: false,
                            computed: true,
                            object: {
                              type: "Identifier",
                              name: namespace.intrinsic},
                            property: {
                              type: "Literal",
                              value: "aran.globalObjectRecord"}},
                          property: {
                            type: "Identifier",
                            name: identifier}},
                        right: {
                          type: "Identifier",
                          name: input_identifier}}},
                    alternate: {
                      type: "ThrowStatement",
                      argument: {
                        type: "Identifier",
                        name: namespace.error }}}]}},
            finalizer: null}]}},
    arguments: [estree]});

build.code.enclave_super_member = (code) => `super[${code}]`;
build.estree.enclave_super_member = (estree) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: {
    type: "Super"},
  property: estree});

build.code.enclave_super_call = (code) => `super(...${code})`;
build.estree.enclave_super_call = (estree) => ({
  type: "CallExpression",
  optional: false,
  callee: {
    type: "Super"},
  arguments: [
    {
      type: "SpreadElement",
      argument: estree}]});

build.code.write = (usage, identifier, code) => (
  code = `${identifier} =${code}`,
  usage === DROPPED_USAGE ? `(${code})` : `(${code}, void 0)`);
build.estree.write = (usage, identifier, estree) => (
  estree = {
    type: "AssignmentExpression",
    operator: "=",
    left: {
      type: "Identifier",
      name: identifier},
    right: estree},
  (
    usage === DROPPED_USAGE ?
    estree :
    {
      type: "SequenceExpression",
      expressions: [
        estree,
        {
          type: "UnaryExpression",
          operator: "void",
          argument: {
            type: "Literal",
            value: 0}}]}));

build.code.eval = (code) => `eval(${code})`;
build.estree.eval = (estree) => ({
  type: "CallExpression",
  optional: false,
  callee: {
    type: "Identifier",
    name: "eval"},
  arguments: [estree]});

build.code.require = (code) => `import(${code})`;
build.estree.require = (estree) => ({
  type: "ImportExpression",
  source: estree});

build.code.import = build.code.read;
build.estree.import = build.estree.read;

build.code.export = build.code.write;
build.estree.export = build.estree.write;

////////////////////////
// Expression Control //
////////////////////////

build.code.await = (code) => `(await${code})`;
build.estree.await = (estree) => ({
  type: "AwaitExpression",
  argument: estree});

build.code.yield = (delegate, code) => `(yield${delegate ? "*" : ""}(${code}))`;
build.estree.yield = (delegate, estree) => ({
  type: "YieldExpression",
  delegate: delegate,
  argument: estree});

build.code.conditional = (code1, code2, code3) => `(${code1} ?${code2} :${code3})`;
build.estree.conditional = (estree1, estree2, estree3) => ({
  type: "ConditionalExpression",
  test: estree1,
  consequent: estree2,
  alternate: estree3});

build.code.sequence = (code1, code2) => `(${code1},${code2})`;
build.estree.sequence = (estree1, estree2) => ({
  type: "SequenceExpression",
  expressions: [estree1, estree2]});

build.code.throw = (code) => `((() => { throw (${code}); }) ())`;
build.estree.throw = (estree) => ({
  type: "CallExpression",
  optional: false,
  callee: {
    type: "ArrowFunctionExpression",
    generator: false,
    expression: false,
    async: false,
    params: [],
    body: {
      type: "BlockStatement",
      body: [
        {
          type: "ThrowStatement",
          argument: estree}]}},
  arguments: []});

/////////////////////////
// Expression Combiner //
/////////////////////////

build.code.unary = (operator, code) => `(${operator}${code})`;
build.estree.unary = (operator, estree) => ({
  type: "UnaryExpression",
  prefix: true,
  operator: operator,
  argument: estree})

build.code.binary = (operator, code1, code2) => `(${code1} ${operator}${code2})`;
build.estree.binary = (operator, estree1, estree2) => ({
  type: "BinaryExpression",
  operator: operator,
  left: estree1,
  right: estree2});

const object_property_code = ({0:code1, 1:code2}) => `,[${code1}]:${code2}`;
const object_property_estree = ({0:estree1, 1:estree2}) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: true,
  key: estree1,
  value: estree2});
build.code.object = (code, codess) => `({__proto__:${code}${ArrayLite.join(ArrayLite.map(codess, object_property_code), "")}})`;
build.estree.object = (estree, estreess) => ({
  type: "ObjectExpression",
  properties: ArrayLite.concat(
    [
      {
        type: "Property",
        kind: "init",
        method: false,
        shorthand: false,
        computed: false,
        key: {
          type: "Identifier",
          name: "__proto__"},
        value: estree}],
    ArrayLite.map(estreess, object_property_estree))});

build.code.apply = (namespace_intrinsic, code, nullable_code, codes) => (
  nullable_code === null ?
  `(${code} (${ArrayLite.join(codes, ",")}))` :
  `(${namespace_intrinsic}["Reflect.apply"](${code},${nullable_code}, [${ArrayLite.join(codes, ",")}]))`);
build.estree.apply = (namespace_intrinsic, estree, nullable_estree, estrees) => (
  nullable_estree === null ?
  {
    type: "CallExpression",
    optional: false,
    callee: estree,
    arguments: estrees} :
  {
    type: "CallExpression",
    optional: false,
    callee: {
      type: "MemberExpression",
      optional: false,
      computed: true,
      object: {
        type: "Identifier",
        name: namespace_intrinsic},
      property: {
        type: "Literal",
        value: "Reflect.apply"}},
    arguments: [
      estree,
      nullable_estree,
      {
        type: "ArrayExpression",
        elements: estrees}]});

build.code.construct = (code, codes) => `(new${code} (${ArrayLite.join(codes, ",")}))`;
build.estree.construct = (estree, estrees) => ({
  type: "NewExpression",
  callee: estree,
  arguments: estrees});

const check_enclave_identifier = (prefix, identifier) => Throw.assert(
  !global_Reflect_apply(
    global_String_prototype_startsWith,
    identifier,
    [prefix]),
  Throw.EnclaveLimitationAranError,
  `Enclave identifier should not start with ${prefix}`);

const expression_callback_object = {
  __proto__: null,
  // Literal //
  primitive: (context, node, primitive) => context.build.primitive(
    primitive),
  intrinsic: (context, node, intrinsic) => context.build.intrinsic(
    context.usage,
    context.namespace.intrinsic,
    intrinsic),
  closure: (context, node, sort, asynchronous, generator, block, _identifier) => context.build.closure(
    context.usage,
    sort,
    asynchronous,
    generator,
    (
      _identifier =
      (
        Tree._match(null, block, override_callee_matcher_1) ?
        null :
        (
          context.identifiers[context.identifiers.length] =
          `${context.namespace["actual-callee"]}_${global_String(fetch(context, "program").counter++)}`))),
    context.namespace.arguments,
    visit_block(block, context, sort, _identifier)),
  // Environment //
  read: (context, node, identifier) => context.build.read(
    context.generate.identifier(identifier)),
  enclave_read: (context, node, identifier) => (
    check_enclave_identifier(context.prefix, identifier),
    context.build.enclave_read(identifier)),
  enclave_typeof: (context, node, identifier) => (
    check_enclave_identifier(context.prefix, identifier),
    context.build.enclave_typeof(identifier)),
  write: (context, node, identifier, expression, _code) => context.build.write(
    context.usage,
    context.generate.identifier(identifier),
    visit_expression(expression, context, NORMAL_USAGE)),
  enclave_write: (context, node, strict, identifier, expression, _code) => (
    check_enclave_identifier(context.prefix, identifier),
    context.build.enclave_write(
      context.generate.identifier("input"),
      context.namespace,
      strict,
      context.usage,
      identifier,
      visit_expression(expression, context, NORMAL_USAGE))),
  enclave_super_member: (context, node, expression) => context.build.enclave_super_member(
    visit_expression(expression, context, NORMAL_USAGE)),
  enclave_super_call: (context, node, expression) => context.build.enclave_super_call(
    visit_expression(expression, context, NORMAL_USAGE)),
  eval: (context, node, expression) => context.build.eval(
    visit_expression(expression, context, NORMAL_USAGE)),
  require: (context, node, expression) => context.build.require(
    visit_expression(expression, context, NORMAL_USAGE)),
  await: (context, node, expression) => context.build.await(
    visit_expression(expression, context, NORMAL_USAGE)),
  yield: (context, node, delegate, expression) => context.build.yield(
    delegate,
    visit_expression(expression, context, NORMAL_USAGE)),
  import: (context, node, specifier, source) => context.build.import(
    `${context.namespace.import}_${specifier === null ? `0` : specifier}_${encode(source)}`),
  export: (context, node, specifier, expression, _code) => context.build.export(
    context.usage,
    `${context.namespace.export}_${specifier}`,
    visit_expression(expression, context, NORMAL_USAGE)),
  // Control //
  conditional: (context, node, expression1, expression2, expression3) => context.build.conditional(
    visit_expression(expression1, context, NORMAL_USAGE),
    visit_expression(expression2, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE),
    visit_expression(expression3, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE)),
  sequence: (context, node, expression1, expression2) => context.build.sequence(
    visit_expression(expression1, context, DROPPED_USAGE),
    visit_expression(expression2, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE)),
  throw: (context, node, expression1, expression2) => context.build.throw(
    visit_expression(expression1, context, NORMAL_USAGE)),
  // Combiner //
  unary: (context, node, operator, expression) => context.build.unary(
    operator,
    visit_expression(expression, context, NORMAL_USAGE)),
  binary: (context, node, operator, expression1, expression2) => context.build.binary(
    operator,
    visit_expression(expression1, context, NORMAL_USAGE),
    visit_expression(expression2, context, NORMAL_USAGE)),
  object: (context, node, expression, properties) => context.build.object(
    visit_expression(expression, context, NORMAL_USAGE),
    ArrayLite.map(
      properties,
      ({0:expression1, 1:expression2}) => [
        visit_expression(expression1, context, NORMAL_USAGE),
        visit_expression(expression2, context, NORMAL_USAGE)])),
  construct: (context, node, expression, expressions, _result, _results, _nullable_result) => (
    _result = visit_expression(expression, context, NORMAL_USAGE),
    _results = ArrayLite.map(
      expressions,
      (expression) => visit_expression(expression, context, NORMAL_USAGE)),
    _nullable_result = context.generate.construct(expression, expressions, _result, _results),
    (
      _nullable_result === null ?
      context.build.construct(_result, _results) :
      _nullable_result)),
  apply: (context, node, expression1, expression2, expressions, _is_this_undefined, _result, _nullable_result_1, _results, _nullable_result_2) => (
    _is_this_undefined = Tree._match(null, expression2, primitive_undefined_matcher),
    _result = visit_expression(expression1, context, _is_this_undefined ? CALLEE_USAGE : NORMAL_USAGE),
    _nullable_result_1 = (
      _is_this_undefined ?
      null :
      visit_expression(expression2, context, NORMAL_USAGE)),
    _results = ArrayLite.map(
      expressions,
      (expression) => visit_expression(expression, context, NORMAL_USAGE)),
    _nullable_result_2 = context.generate.apply(expression1, expression2, expressions, _result, _nullable_result_1, _results),
    (
      _nullable_result_2 === null ?
      context.build.apply(
        context.namespace.intrinsic,
        _result,
        _nullable_result_1,
        _results) :
      _nullable_result_2))};

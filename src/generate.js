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

const empty_label_branch_matcher = ["Branch", [], (block) => true];
const expression_statement_matcher = ["ExpressionStatement", (expression) => true];
const branch_statement_matcher = ["BranchStatement", (branch) => true];
const undefined_primitive_expression_matcher = ["PrimitiveExpression", void 0];
const override_callee_matcher_1 = [
  "Block",
  (context, labels) => true,
  (context, identifiers) => true,
  (context, statements) => (
    statements.length > 0 &&
    Tree.match(
      null,
      statements[0],
      override_callee_matcher_2))];
const override_callee_matcher_2 = [
  "ExpressionStatement",
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
    __newline__: (inlined, newline, indent, depth, code) => (
      inlined ?
      code :
      (
        newline +
        global_Reflect_apply(global_String_prototype_repeat, indent, [depth]) +
        code))},
  estree: {
    __proto__:null,
    __newline__: (inlined, newline, indent, depth, estree) => estree}};

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
//     ExportExpression: string,
//     ImportExpression: string
//   },
//   generate: {
//     identifier: (string) -> string,
//     label: (string) -> string,
//     ApplyExpression: (...) -> null | result,
//     ConstructExpression: (...) -> null | result
//   }
// };

module.exports = (program, options) => visit_program(
  program,
  {
    __proto__: {
      __proto__: options,
      type: "root",
      depth: 0,
      counter: 0,
      build: build[options.output]}});

  // global_Object_assign(
  //   {
  //     __proto__:null,
  //     counter: 0,
  //     build: build[options.output]}
  //   options),
  // 
  //   options,
  //   {
  //     build: build[options.output],
  //     namespace: ArrayLite.reduce(
  //       global_Reflect_ownKeys(options.namespace),
  //       (namespace, key) => (
  //         namespace[key] = options.prefix + options.namespace[key],
  //         namespace),
  //       {__proto__:null}),
  //     generate: {
  //       __proto__: options.generate,
  //       identifier: (identifier) => options.prefix + options.generate.identifier(identifier)}}));

const visit_program = (program, context) => context.build.__newline__(
  false,
  context.newline,
  context.indent,
  context.depth,
  Tree.dispatch(
    {
      __proto__: context,
      type: "program",
      depth: context.depth + 1 },
    program,
    program_callback_object));

const visit_link = (link, context, identifiers) => context.build.__newline__(
  false,
  context.newline,
  context.indent,
  context.depth,
  Tree.dispatch(
    {
      __proto__: fetch(context, "root"),
      type: "link",
      depth: context.depth + 1,
      identifiers: identifiers},
    link,
    link_callback_object));

const visit_branch = (branch, context, sort, _inlined) => (
  _inlined = Tree.match(null, branch, empty_label_branch_matcher),
  context.build.__newline__(
    _inlined,
    context.newline,
    context.indent,
    context.depth,
    Tree.dispatch(
      {
        __proto__: fetch(context, "root"),
        type: "branch",
        depth: context.depth + (_inlined ? 0 : 1),
        sort: sort,
        identifiers: identifiers},
      statement,
      statement_callback_object)));

const visit_block = (block, context, sort, callee) => context.build.__newline__(
  false,
  context.newline,
  context.indent,
  context.depth,
  Tree.dispatch(
    {
      __proto__: fetch(context, "root"),
      type: "block",
      depth: context.depth + 1,
      sort: sort,
      callee: callee},
    block,
    block_callback_object));

const visit_statement = (statement, context, identifiers, _inlined) => (
  _inlined = (
    Tree.match(null, statement, expression_statement_matcher) ||
    Tree.match(null, statement, branch_statement_matcher)),
  context.build.__newline__(
    _inlined,
    context.newline,
    context.indent,
    context.deph,
    Tree.dispatch(
      {
        __proto__: fetch(context, "block"),
        type: "statement",
        depth: context.depth + (_inline ? 0 : 1),
        identifiers: identifiers},
      statement,
      statement_callback_object)));

const visit_expression = (expression, context, usage) => context.build.__newline__(
  false,
  context.newline,
  context.indent,
  context.depth,
  Tree.dispatch(
    {
      __proto__: fetch(context, "statement"),
      type: "expression",
      depth: context.depth + 1,
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
  Program: (context, node, links, block, _identifiers) => (
    _identifiers = [],
    context.build._program(
      context.source,
      context.local,
      context.namespace.intrinsic,
      context.intrinsic,
      _identifiers,
      ArrayLite.map(
        links,
        (link) => visit_link(link, context, _identifiers)),
      visit_block(block, context, context.source, null)))};

/////////////
// Prelude //
/////////////

build.code.ImportLink = (specifier, identifier, source) => (
  specifier === null ?
  `import * as ${identifier} from ${global_JSON_stringify(source)};` :
  `import {${specifier} as ${identifier}} from ${global_JSON_stringify(source)};`);
build.estree.ImportLink = (specifier, identifier, source) => ({
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

build.code.ExportLink = (identifier, specifier) => (
  `export {${identifier} as ${specifier}};`);
build.estree.ExportLink = (identifier, specifier) => ({
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

build.code.AggregateLink = (specifier1, source, specifier2) => (
  specifier1 === null ?
  `export * from ${global_JSON_stringify(source)};` :
  `export {${specifier1} as ${specifier2}} from ${global_JSON_stringify(source)};`);
build.estree.AggregateLink = (specifier1, source, specifier2) => (
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

const link_callback_object = {
  __proto__: null,
  ImportLink: (context, node, specifier, source) => context.build.ImportLink(
    specifier,
    `${context.namespace.import}_${specifier === null ? `0` : specifier}_${encode(source)}`,
    source),
  ExportLink: (context, node, specifier, _identifier) => (
    _identifier = `${context.namespace.export}_${specifier}`,
    context.identifiers[context.identifiers.length] = _identifier,
    context.build.ExportLink(_identifier, specifier)),
  // console.assert((specifier1 === null) === (specifier2 === null))
  AggregateLink: (context, node, specifier1, source, specifier2) => context.build.AggregateLink(
    specifier1,
    source,
    specifier2)};

////////////
// Branch //
////////////

const labelize_code = (label) => `${label}:`

const labelize_estree = (estree, label) => ({
  type: "LabeledStatement",
  label: {
    type: "Identifier",
    name: label},
  body: estree});

build.code.Branch = (labels, code) => (
  labels > 0 ?
  (
    `{ ` +
    ArrayLite.join(
      ArrayLite.map(colon, labelize_code),
      " ") +
    code +
    ` }`) :
  code);
build.estree.Branch = (labels, estree) => (
  labels > 0 ?
  {
    type: "BlockStatement",
    body: ArrayLite.reduceRight(labelize_estree, estree)} :
  estree);

const branch_callback_object = {
  __proto__: null,
  Branch: (context, node, labels, block) => context.build.branch(
    ArrayLite.map(labels, context.generate.label),
    visit_block(context, block, context.sort, null))};

///////////
// Block //
///////////

const declarator = (identifier) => ({
  type: "VariableDeclarator",
  id: {
    type: "Identifier",
    name: identifier},
  init: null});

// console.assert(identifiers.length > 0) // because of the input identifier
build.code.Block = (sort, callee, arguments_identifier, error_identifier, identifiers, codes) => (
  callee = context.callee === null ? "null" : context.callee,
  (
    (
      (
        sort === "script" ||
        sort === "module" ||
        sort === "eval") ?
      `` :
      `{ `) +
    `let ${ArrayLite.join(identifiers, ", ")}; ` +
    (
      context.sort === "arrow" ?
      `${identifiers[0]} = {__proto__:null, callee:${callee}, arguments:${arguments_identifier}};` :
      (
        context.sort === "method" ?
        `${identifiers[0]} = {__proto__:null, callee:${callee}, arguments:${arguments_identifier}, this:this};` :
        (
          context.sort === "constructor" ?
          `${identifiers[0]} = {__proto__:null, callee:${callee}, arguments:${arguments_identifier}, "new.target":new.target};` :
          (
            context.sort === "function" ?
            `${identifiers[0]} = {__proto__:null, callee:${callee}, arguments:${arguments_identifier}, this:this, "new.target":new.target};` :
            (
              context.sort === "catch" ?
              `${identifiers[0]} = {__proto__:null, error:${error_identifier}};` :
              `${identifiers[0]} = {__proto__:null};`))))) +
    ArrayLite.join(codes, "") +
    (
      (
        sort === "script" ||
        sort === "module" ||
        sort === "eval") ?
      `` :
      ` }`)));
build.estree.Block = (context, input_identifier, identifiers, estrees, _estree) => ({
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
    estrees)});

const flaten = (statement) => Tree.dispatch(null, statement, flaten_callback_object, flaten_callback);
const flaten_callback = (context, statement, type) => [statement];
const flaten_callback_object = {
  __proto__: null,
  ListStatement: (context, statement, statments) => ArrayLite.flatMap(statements, flaten)};

const block_callback_object = {
  __proto__: null,
  Block: (context, node, identifiers, statement, _identifiers, _results) => (
    _identifiers = ArrayLite.map(
      ArrayLite.concat(["input"], identifiers),
      context.generate.identifier),
    _results = ArrayLite.map(
      flaten(statement),
      (statement) => visit_statement(statement, context, _identifiers)),
    context.build.Block(
      context,
      context.generate.identifier("input"),
      _identifiers,
      _results))};

//////////////////////
// Atomic Statement //
//////////////////////

build.code.ExpressionStatement = (code) => `${code};`;
build.estree.ExpressionStatement = (estree) => ({
  type: "ExpressionStatement",
  expression: estree});

build.code.DeclareEnclaveStatement = (kind, identifier, code) => `${kind} ${identifier} =${code};`;
build.estree.DeclareEnclaveStatement = (kind, identifier, estree) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: {
        type: "Identifier",
        name: identifier},
      init: estree}]});

build.code.ReturnStatement = (code) => `return (${code});`;
build.estree.ReturnStatement = (estree) => ({
  type: "ReturnStatement",
  argument: estree});

build.code.BreakStatement = (label) => `break ${label};`;
build.estree.BreakStatement = (label) => ({
  type: "BreakStatement",
  label: {
    type: "Identifier",
    name: label}});

build.code.DebuggerStatement = (label) => `debugger;`;
build.estree.DebuggerStatement = (label) => ({
  type: "DebuggerStatement"});

////////////////////////
// Compound Statement //
////////////////////////

build.code.BranchStatement = (code) => code;
build.estree.BranchStatement = (estree) => estree;

build.code.IfStatement = (code1, code2, code3) => `if (${code1})${code2} else${code3}`;
build.estree.IfStatement = (estree1, estree2, estree3) => ({
  type: "IfStatement",
  test: estree1,
  consequent: estree2,
  alternate: estree3});

build.code.WhileStatement = (code1, code2) => `while (${code1})${code2}`;
build.estree.WhileStatement = (estree1, estree2) => ({
  type: "WhileStatement",
  test: estree1,
  body: estree2});

build.code.TryStatement = (error, code1, code2, code3) => `try${code1} catch (${error})${code2} finally${code3}`;
build.estree.TryStatement = (error, estree1, estree2, estree3) => ({
  type: "TryStatement",
  block: estree1,
  handler: {
    type: "CatchClause",
    param: {
      type: "Identifier",
      name: error},
    body: estree2,
  finalizer: estree3});

const statement_callback_object = {
  __proto__: null,
  // Atomic Statement //
  DeclareEnclaveStatement: (context, node, kind, identifier, expression) => context.build.DeclareEnclaveStatement(
    kind,
    identifier,
    visit_expression(expression, context, NORMAL_USAGE)),
  ExpressionStatement: (context, node, expression) => context.build.ExpressionStatement(
    visit_expression(expression, context, DROPPED_USAGE)),
  ReturnStatement: (context, node, expression) => context.build.ReturnStatement(
    visit_expression(expression, context, NORMAL_USAGE)),
  BreakStatement: (context, node, label) => context.build.BreakStatement(
    context.generate.label(label)),
  DebuggerStatement: (context, node) => context.build.DebuggerStatement(),
  // Compound Statement //
  BranchStatement: (context, node, block) => context.build.BranchStatement(
    visit_branch(block, context, "lone")),
  IfStatement: (context, node, expression, block1, block2) => context.build.IfStatement(
    visit_expression(expression, context, NORMAL_USAGE),
    visit_branch(block1, context, "then"),
    visit_branch(block2, context, "else")),
  WhileStatement: (context, node, expression, block) => context.build.WhileStatement(
    visit_expression(expression, context, NORMAL_USAGE),
    visit_branch(block, context, "do")),
  TryStatement: (context, node, block1, block2, block3) => context.build.TryStatement(
    visit_branch(block1, context, "try"),
    visit_branch(block2, context, "catch"),
    visit_branch(block3, context, "finally"))};

////////////////////////
// Expression Literal //
////////////////////////

build.code.ClosureExpression = (usage, sort, asynchronous, generator, callee, namespace_arguments, code) => (
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
build.estree.ClosureExpression = (usage, sort, asynchronous, generator, callee, namespace_arguments, estree) => (
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
      ObjectExpression: {
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

build.code.PrimitiveExpression = (primitive) => (
  primitive === void 0 ?
  `(void 0)` :
  (
    typeof primitive === "bigint" ?
    `${global_String(primitive)}n` :
    (
      typeof primitive === "string" ?
      global_JSON_stringify(primitive) :
      global_String(primitive))));
build.estree.PrimitiveExpression = (primitive) => (
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

build.code.IntrinsicExpression = (usage, namespace_intrinsic, intrinsic_name, _code) => (
  _code = `${namespace_intrinsic}[${global_JSON_stringify(intrinsic_name)}]`,
  usage === "callee" ? `(null, ${_code})` : `(${_code})`);
build.estree.IntrinsicExpression = (usage, namespace_intrinsic, intrinsic_name, _estree) => (
  _estree = {
    type: "MemberExpression",
    computed: true,
    optional: false,
    ObjectExpression: {
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

build.code.ReadExpression = (identifier) => identifier;
build.estree.ReadExpression = (identifier) => ({
  type: "Identifier",
  name: identifier});

build.code.ReadEnclaveExpression = build.code.read;
build.estree.ReadEnclaveExpression = build.estree.read;

build.code.TypeofEnclaveExpression = (identifier) => `typeof ${identifier}`;
build.estree.TypeofEnclaveExpression = (identifier) => ({
  type: "UnaryExpression",
  operator: "typeof",
  prefix: true,
  argument: {
    type: "Identifier",
    name: identifier}});

build.code.WriteEnclaveExpression = (input_identifier, namespace, strict, usage, identifier, code) => (
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
build.estree.WriteEnclaveExpression = (input_identifier, namespace, strict, usage, identifier, estree) => (
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
                        ObjectExpression: {
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
                          ObjectExpression: {
                            type: "MemberExpression",
                            optional: false,
                            computed: true,
                            ObjectExpression: {
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

build.code.MemberSuperEnclaveExpression = (code) => `super[${code}]`;
build.estree.MemberSuperEnclaveExpression = (estree) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  ObjectExpression: {
    type: "Super"},
  property: estree});

build.code.CallSuperEnclaveExpression = (code) => `super(...${code})`;
build.estree.CallSuperEnclaveExpression = (estree) => ({
  type: "CallExpression",
  optional: false,
  callee: {
    type: "Super"},
  arguments: [
    {
      type: "SpreadElement",
      argument: estree}]});

build.code.WriteExpression = (usage, identifier, code) => (
  code = `${identifier} =${code}`,
  usage === DROPPED_USAGE ? `(${code})` : `(${code}, void 0)`);
build.estree.WriteExpression = (usage, identifier, estree) => (
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

build.code.EvalExpression = (code) => `eval(${code})`;
build.estree.EvalExpression = (estree) => ({
  type: "CallExpression",
  optional: false,
  callee: {
    type: "Identifier",
    name: "eval"},
  arguments: [estree]});

build.code.RequireExpression = (code) => `import(${code})`;
build.estree.RequireExpression = (estree) => ({
  type: "ImportExpression",
  source: estree});

build.code.ImportExpression = build.code.read;
build.estree.ImportExpression = build.estree.read;

build.code.ExportExpression = build.code.write;
build.estree.ExportExpression = build.estree.write;

////////////////////////
// Expression Control //
////////////////////////

build.code.AwaitExpression = (code) => `(await${code})`;
build.estree.AwaitExpression = (estree) => ({
  type: "AwaitExpression",
  argument: estree});

build.code.YieldExpression = (delegate, code) => `(yield${delegate ? "*" : ""}(${code}))`;
build.estree.YieldExpression = (delegate, estree) => ({
  type: "YieldExpression",
  delegate: delegate,
  argument: estree});

build.code.ConditionalExpression = (code1, code2, code3) => `(${code1} ?${code2} :${code3})`;
build.estree.ConditionalExpression = (estree1, estree2, estree3) => ({
  type: "ConditionalExpression",
  test: estree1,
  consequent: estree2,
  alternate: estree3});

build.code.SequenceExpression = (code1, code2) => `(${code1},${code2})`;
build.estree.SequenceExpression = (estree1, estree2) => ({
  type: "SequenceExpression",
  expressions: [estree1, estree2]});

build.code.ThrowExpression = (code) => `((() => { throw (${code}); }) ())`;
build.estree.ThrowExpression = (estree) => ({
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

build.code.UnaryExpression = (operator, code) => `(${operator}${code})`;
build.estree.UnaryExpression = (operator, estree) => ({
  type: "UnaryExpression",
  prefix: true,
  operator: operator,
  argument: estree})

build.code.BinaryExpression = (operator, code1, code2) => `(${code1} ${operator}${code2})`;
build.estree.BinaryExpression = (operator, estree1, estree2) => ({
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
build.code.ObjectExpression = (code, codess) => `({__proto__:${code}${ArrayLite.join(ArrayLite.map(codess, object_property_code), "")}})`;
build.estree.ObjectExpression = (estree, estreess) => ({
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

build.code.ApplyExpression = (namespace_intrinsic, code, nullable_code, codes) => (
  nullable_code === null ?
  `(${code} (${ArrayLite.join(codes, ",")}))` :
  `(${namespace_intrinsic}["Reflect.apply"](${code},${nullable_code}, [${ArrayLite.join(codes, ",")}]))`);
build.estree.ApplyExpression = (namespace_intrinsic, estree, nullable_estree, estrees) => (
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
      ObjectExpression: {
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

build.code.ConstructExpression = (code, codes) => `(new${code} (${ArrayLite.join(codes, ",")}))`;
build.estree.ConstructExpression = (estree, estrees) => ({
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
  PrimitiveExpression: (context, node, primitive) => context.build.PrimitiveExpression(
    primitive),
  IntrinsicExpression: (context, node, intrinsic) => context.build.IntrinsicExpression(
    context.usage,
    context.namespace.intrinsic,
    intrinsic),
  ClosureExpression: (context, node, sort, asynchronous, generator, block, _identifier) => context.build.ClosureExpression(
    context.usage,
    sort,
    asynchronous,
    generator,
    (
      _identifier =
      (
        Tree.match(null, block, override_callee_matcher_1) ?
        null :
        (
          context.identifiers[context.identifiers.length] =
          `${context.namespace["actual-callee"]}_${global_String(fetch(context, "program").counter++)}`))),
    context.namespace.arguments,
    visit_block(block, context, sort, _identifier)),
  // Environment //
  ReadExpression: (context, node, identifier) => context.build.ReadExpression(
    context.generate.identifier(identifier)),
  ReadEnclaveExpression: (context, node, identifier) => (
    check_enclave_identifier(context.prefix, identifier),
    context.build.ReadEnclaveExpression(identifier)),
  TypeofEnclaveExpression: (context, node, identifier) => (
    check_enclave_identifier(context.prefix, identifier),
    context.build.TypeofEnclaveExpression(identifier)),
  WriteExpression: (context, node, identifier, expression, _code) => context.build.WriteExpression(
    context.usage,
    context.generate.identifier(identifier),
    visit_expression(expression, context, NORMAL_USAGE)),
  WriteEnclaveExpression: (context, node, strict, identifier, expression, _code) => (
    check_enclave_identifier(context.prefix, identifier),
    context.build.WriteEnclaveExpression(
      context.generate.identifier("input"),
      context.namespace,
      strict,
      context.usage,
      identifier,
      visit_expression(expression, context, NORMAL_USAGE))),
  MemberSuperEnclaveExpression: (context, node, expression) => context.build.MemberSuperEnclaveExpression(
    visit_expression(expression, context, NORMAL_USAGE)),
  CallSuperEnclaveExpression: (context, node, expression) => context.build.CallSuperEnclaveExpression(
    visit_expression(expression, context, NORMAL_USAGE)),
  EvalExpression: (context, node, expression) => context.build.EvalExpression(
    visit_expression(expression, context, NORMAL_USAGE)),
  RequireExpression: (context, node, expression) => context.build.RequireExpression(
    visit_expression(expression, context, NORMAL_USAGE)),
  AwaitExpression: (context, node, expression) => context.build.AwaitExpression(
    visit_expression(expression, context, NORMAL_USAGE)),
  YieldExpression: (context, node, delegate, expression) => context.build.YieldExpression(
    delegate,
    visit_expression(expression, context, NORMAL_USAGE)),
  ImportExpression: (context, node, specifier, source) => context.build.ImportExpression(
    `${context.namespace.import}_${specifier === null ? `0` : specifier}_${encode(source)}`),
  ExportExpression: (context, node, specifier, expression, _code) => context.build.ExportExpression(
    context.usage,
    `${context.namespace.export}_${specifier}`,
    visit_expression(expression, context, NORMAL_USAGE)),
  // Control //
  ConditionalExpression: (context, node, expression1, expression2, expression3) => context.build.ConditionalExpression(
    visit_expression(expression1, context, NORMAL_USAGE),
    visit_expression(expression2, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE),
    visit_expression(expression3, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE)),
  SequenceExpression: (context, node, expression1, expression2) => context.build.SequenceExpression(
    visit_expression(expression1, context, DROPPED_USAGE),
    visit_expression(expression2, context, context.usage === DROPPED_USAGE ? DROPPED_USAGE : NORMAL_USAGE)),
  ThrowExpression: (context, node, expression1, expression2) => context.build.ThrowExpression(
    visit_expression(expression1, context, NORMAL_USAGE)),
  // Combiner //
  UnaryExpression: (context, node, operator, expression) => context.build.UnaryExpression(
    operator,
    visit_expression(expression, context, NORMAL_USAGE)),
  BinaryExpression: (context, node, operator, expression1, expression2) => context.build.BinaryExpression(
    operator,
    visit_expression(expression1, context, NORMAL_USAGE),
    visit_expression(expression2, context, NORMAL_USAGE)),
  ObjectExpression: (context, node, expression, properties) => context.build.ObjectExpression(
    visit_expression(expression, context, NORMAL_USAGE),
    ArrayLite.map(
      properties,
      ({0:expression1, 1:expression2}) => [
        visit_expression(expression1, context, NORMAL_USAGE),
        visit_expression(expression2, context, NORMAL_USAGE)])),
  ConstructExpression: (context, node, expression, expressions, _result, _results, _nullable_result) => (
    _result = visit_expression(expression, context, NORMAL_USAGE),
    _results = ArrayLite.map(
      expressions,
      (expression) => visit_expression(expression, context, NORMAL_USAGE)),
    _nullable_result = context.generate.construct(expression, expressions, _result, _results),
    (
      _nullable_result === null ?
      context.build.ConstructExpression(_result, _results) :
      _nullable_result)),
  ApplyExpression: (context, node, expression1, expression2, expressions, _is_this_undefined, _result, _nullable_result_1, _results, _nullable_result_2) => (
    _is_this_undefined = Tree.match(null, expression2, undefined_primitive_expression_matcher),
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
      context.build.ApplyExpression(
        context.namespace.intrinsic,
        _result,
        _nullable_result_1,
        _results) :
      _nullable_result_2))};

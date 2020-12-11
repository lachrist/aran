"use strict";

const global_Object_is = global.Object.is;
const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");

const builders = {
  code: {
    // Block //
    module (identifiers, aggregates, imports, codes, exports) { return (
      (
        identifiers.length === 0 ?
        `` :
        `${this.__newline__}let ${ArrayLite.join(identifiers, ", ")};`) +
      ArrayLite.map(
        aggregates,
        ({source}) => `${this.__newline__}export * from ${global_JSON_stringify(source)};`) +
      ArrayLite.map(
        imports,
        ({local, source}) => `${this.__newline__}import * as ${local} from ${global_JSON_stringify(source)};`) +
      ArrayLite.join(codes, "") +
      ArrayLite.exports(
        exports,
        ({local, exported}) => `${this.__newline__}export {${local} as ${exported}};`)); },
    script (identifiers, codes) { return (
      `${this.__newline__}"use strict";` +
      `${this.__newline__}((() => {` +
      (
        identifiers.length === 0 ?
        `` :
        `${this.__newline__}let ${ArrayLite.join(identifiers, ", ")};`) +
      ArrayLite.join(codes, "") +
      `${this.__newline__}} ());`); },
    block (identifiers, codes) { return (
      `{` +
      (
        identifiers.length === 0 ?
        `` :
        `${this.__newline__}let ${ArrayLite.join(identifiers, ", ")};`) +
      ArrayLite.join(codes, "") +
      `}`); },
    // Atomic Statement //
    empty () { return (
      `${this.__newline__};`) },
    break (label) { return(
      `${this.__newline__}break ${label};`); },
    continue (label) { return(
      `${this.__newline__}continue ${label};`); },
    debugger () { return (
      `${this.__newline__}debugger;`); },
    return (code) { return (
      `${this.__newline__}return ${code};`); },
    lift (code) { return (
      `${this.__newline__}${code};`); },
    // Compound Statement
    lone (labels, code) { return (
      `${this.__newline__}/* lone */ ${ArrayLite.join(labels, ": ")}${code}`); },
    if (labels, code1, code2, code3) { return (
      `${this.__newline__}${ArrayLite.join(labels, ": ")}if (${code1})` +
      `${this.__newline__}/* then */ ${code2}` +
      `${this.__newline__}else ${code3}`); },
    while (labels, code1, code2) { return (
      `${this.__newline__}${ArrayLite.join(labels, ": ")}while (${code1})` +
      `${this.__newline__}/* do */ ${code2}`); },
    try (code1, code2, code3) { return (
      `${this.__newline__}${ArrayLite.join(labels, ": ")}try ${code1}` +
      `${this.__newline__}catch (error) ${code2}` +
      `${this.__newline__}finally ${code3}`); },
    // Expression Literal //
    builtin (identifier, key) { return `(${identifier}[${global_JSON_stringify(key)}])` },
    primitive (primitive) { return (
      typeof primitive === "bigint" ?
      `${global_String(primitive)}n` :
      (
        typeof primitive === "string" ?
        global_JSON_stringify(primitive) :
        (
          primitive === void 0 ?
          "(void 0)" :
          global_String(primitive)))); },
    arrow (identifier1, identifier2, code) { return `((...${this.__namespace__}) => ${code})`; },
    function (code) { return `function (...${identifier}) ${code}`; },
    constructor (code) { return `function (...${identifier}) ${code}`; },
    method (code) { return `(({ method (...${identifier}) ${code}}).method)`; },
    // Expression >> Environment //
    read (identifier) { return identifier; },
    write (identifier, code) { return `(${identifier} = ${code})`; },
    // Expression >> Control //
    throw (code) { return `((() => { throw ${code}; }) ())`; },
    require (code) { return `import(${code})`; },
    eval (code) => { return `eval(${code})`; },
    conditional (code1, code2, code2) { return (
      `(` +
      `${this.__newline__}${code1} ?` +
      `${this.__newline__}${code2} :` +
      `${this.__newline__}${code3})`); },
    sequence (code1, code2) { return (
      `(` +
      `${this.__newline__}${code1},` +
      `${this.__newline__}${code2})`); },
    // Expression >> Combiner //
    unary (operator, code) { return `(${operator} ${code})`; },
    binary (operator, code1, code2) { return (
      `(` +
      `${this.__newline__}${code1} ${operator}` +
      `${this.__newline__}${code2} )`); },
    object (code, codess) { return (
      codess.length === 0 ?
      `({__proto__:${code}})` :
      (
        `({` +
        `${this.__newline__}__proto__: ${code}`
        ArrayLite.map(
          codess,
          ({0:code1, 1:code2}) => (
            `,${this.__newline__}[${code1}]:`
            `${this.__newline__}${code2}`)) +
        `})`)); },
    array (codes) { return (
      codes.length === 0 ?
      `([])` :
      (
        codes.length === 1 ?
        `([${codes[1]}])` :
        (
          `([${this.__newline__}` +
          ArrayLite.join(codes, `,${this.__newline__}`) +
          `])`))); },
    construct (code, codes) { return (
      codes.length === 0 ?
      `(new ${code}())` :
      (
        `(` +
        `${this.__newline__}new ${code}(` +
        `${this.__newline__}${ArrayLite.join(codes, `,${this.__newline__}`)}` +
        `)`)); },
     call (code, codes) { return (
      codes.length === 0 ?
      `(${code}())` :
      (
        `(` +
        `${this.__newline__}${code}(` +
        `${this.__newline__}${ArrayLite.join(codes, `,${this.__newline__}`)}` +
        `)`)); }};

const make_builtin_expression = (convert, builtin_identifier, builtin) => ({
  type: "MemberExpression",
  optional: false,
  computed: true,
  object: {
    type: "Identifier",
    name: convert(builtin_identifier)},
  property: {
    type: "Literal",
    value: builtin}});

const null_const = () => null;
const false_const = () => false;
const null_expression_callback_object = {__proto__:null};
const false_expression_callback_object = {__proto__:null};
ArrayLite.forEach(
  [
    // Producer //
    "primitive",
    "builtin",
    "read",
    "arrow",
    "constructor",
    "function",
    "method",
    // Consumers //
    "eval",
    "write",
    "sequence",
    "conditional",
    "throw",
    // Combiners //
    "unary",
    "binary",
    "object",
    "construct",
    "apply"],
  (type) => {
    null_expression_callback_object[type] = null_const;
    false_expression_callback_object[type] = false_const});

const is_primitive_expression_callback_object = {
  __proto__: false_expression_callback_object,
  primitive: (context, node, primitive) => global_Object_is(context, primitive) };

const extract_throw_argument_expression_callback_object = {
  __proto__: null_expression_callback_object,
  throw: (context, node, expression) => expression};

const labelize = (labels, estree) => ArrayLite.reduce(
  ArrayLite.reverse(labels),
  (estree, label) => ({
    type: "LabeledStatement",
    label: {
      type: "Identifier",
      name: label},
    body: estree}),
  estree);

const visit_block = (block, context) => Tree._dispatch_block(
  block_callback_object,
  context,
  block);

const visit_statement = (statement, context) => Tree._dispatch_statement(
  block_callback_object,
  context,
  statement);

const visit_expression = (expression, context) => Tree._dispatch_block(
  expression_callback_object,
  context,
  expression);

const make_block_context = (context, tag, callee) => ({
  __proto__: global_Reflect_getPrototypeOf(context),
  tag: tag,
  callee: callee});

const make_statement_context = (block_context, identifiers) => ({
  __proto__: global_Reflect_getPrototypeOf(block_context),
  identifiers: identifiers});

const make_expression_context = (either_expression_context_statement_context, dropped) => (
  dropped === either_expression_context_statement_context.dropped ?
  either_expression_context_statement_context :
  {
    __proto__: global_Reflect_getPrototypeOf(either_expression_context_statement_context),
    identifiers: either_expression_context_statement_context.identifiers,
    dropped: dropped});

// const context = {
//   convert,
//   namespace,
//   apply,
//   construct,
//   tag,
//   identifiers,
//   prelude,
//   epiloge,
//   indent,
//   dropped};

const STEP = "  ";

const visit = (node, context, options) => Tree._dispatch(
  callbacks,
  global_Object_assign(
    {__proto__: null},
    context,
    options,
    (
      context.build.__type__ === "code" ?
      {
        build: {
          __proto__: global_Reflect_getPrototypeOf(context.build),
          __newline__: context.build.__newline__ + STEP}} :
      null)),
  node);

// type Block = aran.Block
// type Local = Boolean
// type Namespace = (Callee, Builtin)
// type Callee = () => aran.Identifiers
// type Builtin = aran.Identifier
// type Convert = aran.Identifier -> estree.Identifier
module.exports = (block, context, {local, namespace, convert, apply, construct}) => (
  context = {
    __proto__: {
      __proto__: null,
      convert,
      apply,
      construct,
      namespace},
    tag: context.mode,
    callee: null},
  {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: (
          context.tag === "local-eval" ?
          {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "ArrowFunctionExpression",
              id: null,
              async: false,
              generator: false,
              expression: false,
              params: [],
              body: Tree._dispatch_block(block_callback_object, context, block)},
            arguments: []} :
          {
            type: "ArrowFunctionExpression",
            id: null,
            async: false,
            generator: false,
            expression: false,
            params: [
              {
                type: "Identifier",
                name: convert(namespace.builtin)},
              {
                type: "Identifier",
                name: convert(namespace.apply)},
              {
                type: "Identifier",
                name: "eval"}],
            body: {
              type: "BlockStatement",
              body: [
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: {
                      type: "Identifier",
                      name: convert(namespace.apply)},
                    right: {
                      type: "LogicalExpression",
                      operator: "||",
                      left: {
                        type: "Identifier",
                        name: convert(namespace.apply)},
                      right: make_builtin_expression(convert, namespace.builtin, "Reflect.apply")}}},
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: {
                      type: "Identifier",
                      name: "eval"},
                    right: {
                      type: "LogicalExpression",
                      operator: "||",
                      left: {
                        type: "Identifier",
                        name: "eval"},
                      right: make_builtin_expression(convert, namespace.builtin, "eval")}}},
                {
                  type: "ReturnStatement",
                  argument: {
                    type: "CallExpression",
                    callee: {
                      type: "ArrowFunctionExpression",
                      id: null,
                      async: false,
                      generator: false,
                      expression: false,
                      params: [],
                      body: Tree._dispatch_block(block_callback_object, context, block)},
                    arguments: []}}]}})}]});

const block_callback_object = {
  __proto__: null,
  // Block //
  BLOCK: (context, node, identifiers, statements, _options) => (
    context.tag === "module" ?
    (
      _options = {
        identifiers: ArrayLite.map(identifiers, context.convert),
        imports: [],
        exports: [],
        aggregates: []},
      context.build.module(
        options,
        ArrayLite.map(
          statements,
          (statement) => visit(statement, context, _options)))) :
    (
      _options = {
        identifiers: ArrayLite.map(identifiers, context.convert)},
      (
        context.build[
          (
            (
              context.tag === "script" ||
              context.tag === "local-eval" ||
              context.tag === "global-eval") ?
            "script" :
            "block")]
        (
          context.build.block(
            _options.identifiers,
            ArrayLite.map(
              statements,
              (statement) => visit(statement, context, _options))))))),
  // Atomic Statement //
  Aggregate: (context, node, source) => (
    context.aggregates[context.aggregates.length] = {source},
    context.build.empty()),
  Export: (context, node, key, expression, _identifier) => (
    _identifier = context.namespace.export(),
    context.identifiers[context.identifiers.length] = _identifier,
    context.exports[context.exports.length] = {
      exported: key,
      local: _identifier},
    context.build.write(
      _identifier,
      visit(expression, context, {usage:null}))),
  Lift: (context, node, expression, _nullable_expression) => (
    _nullable_expression = Tree._dispatch_expression(extract_throw_argument_expression_callback_object, null, expression),
    (
      _nullable_expression === null ?
      context.build.lift(
        visit(expression, context, {usage:null})) :
      context.build.throw(
        visit(_nullable_expression, context, {usage:null})))),
  Return: (context, node, expression) => context.build.return(
    visit_expression(expression, context, {usage:null})),
  Break: (context, node, label) => context.build.break(label),
  Continue: (context, node, label) => context.build.continue(label),
  Debugger: (context, node) => context.build.debugger(),
  // Compound Statement //
  Lone: (context, node, labels, block) => context.build.lone(
    labels,
    visit(block, context, {tag:"lone"})),
  If: (context, node, labels, expression, block1, block2) => context.build.if(
    labels,
    visit(expression, context, {usage:null}),
    visit(block1, context, {tag:"then"}),
    visit(block2, context, {tag:"else"})),
  While: (context, node, labels, expression, block) => context.build.while(
    labels,
    visit(expression, context, {usage:null}),
    visit(block, context, {tag:"do"})),
  Try: (context, node, labels, block1, block2, block3, _statements) => context.build.try(
    labels,
    visit(block1, context, {tag:"try"}),
    visit(block2, context, {tag:"catch"}),
    visit(block3, context, {tag:"finally"})),
  // Literal //
  primitive: (context, node, primitive) => context.build.primitive(primitive),
  builtin: (context, node, builtin) => (
    context.usage === "callee" ?
    context.build.sequence(
      context.build.primitive(0),
      context.build.get(
        context.build.read(context.namespace.builtin),
        context.build.primitive(builtin))) :
    context.build.get(
      context.build.read(context.namespace.builtin),
      context.build.primitive(builtin))),
  arrow: make_closure_callback("arrow"),
  method: make_closure_callback("method"),
  function: make_closure_callback("arrow"),
  constructor: make_closure_callback("constructor"),
  // Environment //
  read: (context, node, identifier) => context.build.read(
    context.convert(identifier)),
  write: (context, node, identifier, expression) => (
    context.dropped ?
    context.build.write(
      context.convert(identifier),
      visit(expression, context, {usage:null})) :
    context.build.sequence(
      context.build.write(
        context.convert(identifier),
        visit(expression, context, {usage:null})),
      context.build.primitive(void 0))),
  eval: (context, node, expression) => (
    context.build.eval(
      visit(expression, context, {usage:null}))),
  require: (context, node, expression) => (
    context.build.require(
      visit(expression, context, {usage:null}))),
  import: (context, node, source, _identifier) => (
    _identifier = context.namespace.import(),
    context.identifiers[context.identifiers.length] = context.convert(_identifier),
    context.imports[context.imports.length] = {
      local: context.convert(_identifier),
      source},
    context.build.read(_identifier)),
  // Control //
  conditional: (context, node, expression1, expression2, expression3) => context.build.conditional(
    visit(expression1, context, {dropped:false}),
    visit(expression1, context, null),
    visit(expression1, context, null)),
  sequence: (context, node, expression1, expression2) => context.build.sequence(
    visit(expression1, context, {dropped:true}),
    visit(expression2, context, null)),
  throw: (context, node, expression1, expression2) => context.build.throw(
    visit(expression1, context, {dropped:false})),
  // Combiner //
  object: (context, node, expression, properties) => context.build.object(
    visit(expression, context, {dropped:false}),
    ArrayLite.map(
      properties,
      ({0:expression1, 1:expression2}) => [
        visit(expression1, context, {dropped:false}),
        visit(expression2, context, {dropped:false})])),
  unary: (context, node, operator, expression) => context.build.unary(
    operator,
    visit(expression, context, {dropped:false})),
  binary: (context, node, operator, expression1, expression2) => context.build.binary(
    operator,
    visit(expression1, context, {dropped:false}),
    visit(expression2, context, {dropped:false})),
  construct: (context, node, expression, expressions, _result, _results) => (
    _result = visit(expression, context, {usage:null}),
    _results = ArrayLite.visit(
      expressions,
      (expression) => visit(expression, context, {usage:null})),
    (
      context.construct(expression, expressions, _result, _results) ||
      context.build.construct(_result, _results))),
  apply: (context, node, expression1, expression2, expressions)(
    _is_this_undefined = Tree._dispatch_expression(is_primitive_expression_callback_object, null, expression2)
    _result1 = visit(expression1, context, {usage: _is_this_undefined ? "callee" : null}),
    _result2 = visit(expression2, context, {usage:null}),
    _results = ArrayLite.map(
      expressions,
      (expression) => visit(expression, context, {usage:null})),
    (
      context.apply(expression1, expression2, expressions, _result1, _result2, _results) ||
      (
        _is_this_undefined ?
        context.call(_result1, _results) :
        context.call(
          context.build.read(context.apply),
          [
            _result1,
            _result2,
            context.build.array(_results)])))),




    _visit = (expression) => visit(expression, context, {dropped:false}),
    (
      context.construct(_visit, expression, expressions) ||
      context.build.construct(
        _visit(expression),
        ArrayLite.map(expressions, _visit)))),
  apply: (context, node, expression1, expression2, expression2) => (
    _visit = (expression) => visit(expression, context, {dropped:false}),
    (
      context.apply(_visit, expression1, expression2, expressions) ||
      (
        Tree._dispatch_expression(
          is_primitive_expression_callback_object,
          void 0,
          expression2) ?
        context.build.call(
          _visit(expression1),
          ArrayLite.map(expression1, _visit))

}

const make_closure_callback = (tag) => (context, node, block, _identifier) => (
  _identifier = context.namespace.callee(),
  context.identifiers[context.identifiers.length] = _identifier,
  context.build[tag](
    _identifier,
    context.namespace.convert("arguments"),
    visit(block, context, {tag})));



  _estree = {
    type: (
      tag === "arrow" ?
      "ArrowFunctionExpression" :
      "FunctionExpression"),
    id: null,
    async: false,
    generator: false,
    expression: false,
    params: [
      {
        type: "RestElement",
        argument: {
          type: "Identifier",
          name: context.convert("arguments")}}],
    body: Tree._dispatch_block(
      block_callback_object,
      make_block_context(context, tag, _identifier),
      block)},
  {
    type: "SequenceExpression",
    expressions: ArrayLite.concat(
      [
        {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "Identifier",
            name: context.convert(_identifier)},
          right: (
            tag === "method" ?
            {
              type: "MemberExpression",
              optional: false,
              computed: true,
              object: {
                type: "ObjectExpression",
                properties: [
                  {
                    type: "Property",
                    computed: true,
                    shorthand: false,
                    kind: "init",
                    method: true,
                    key: {
                      type: "Literal",
                      value: 0},
                    value: _estree}]},
              property: {
                type: "Literal",
                value: 0}} :
            _estree)},
        {
          type: "UnaryExpression",
          prefix: true,
          operator: "delete",
          argument: {
            type: "MemberExpression",
            computed: false,
            optional: false,
            object: {
              type: "Identifier",
              name: context.convert(_identifier)},
            property: {
              type: "Identifier",
              name: "length"}}},
        {
          type: "UnaryExpression",
          prefix: true,
          operator: "delete",
          argument: {
            type: "MemberExpression",
            computed: false,
            optional: false,
            object: {
              type: "Identifier",
              name: context.convert(_identifier)},
            property: {
              type: "Identifier",
              name: "name"}}}],
      (
        (
          tag === "constructor" ||
          tag === "function") ?
        [
          {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "MemberExpression",
              computed: false,
              optional: false,
              object: {
                type: "Identifier",
                name: context.convert(_identifier)},
              property: {
                type: "Identifier",
                name: "prototype"}},
            right: {
              type: "Literal",
              value: null}}] :
        []),
      [
        {
          type: "Identifier",
          name: context.convert(_identifier)}])});

const expression_callback_object = {
  __proto__: null,
  // Producer //
  primitive: (context, node, primitive) => (
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
      value: primitive}),
  builtin: (context, node, builtin) => make_builtin_expression(context.convert, context.namespace.builtin, builtin),
  read: (context, node, identifier) => ({
    type: "Identifier",
    name: context.convert(identifier)}),
  arrow: make_closure_callback("arrow"),
  function: make_closure_callback("function"),
  method: make_closure_callback("method"),
  constructor: make_closure_callback("constructor"),
  // Consumers //
  eval: (context, node, expression) => ({
    type: "CallExpression",
    optional: false,
    callee: {
      type: "Identifier",
      name: "eval"},
    arguments: [
      Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, false),
        expression)]}),
  write: (context, node, identifier, expression, _estree) => (
    _estree = {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: context.convert(identifier)},
      right: Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, false),
        expression)},
    (
      context.dropped ?
      _estree :
      {
        type: "SequenceExpression",
        expressions: [
          _estree,
          {
            type: "UnaryExpression",
            prefix: true,
            operator: "void",
            argument: {
              type: "Literal",
              value: 0}}]})),
  conditional: (context, node, expression1, expression2, expression3) => ({
    type: "ConditionalExpression",
    test: Tree._dispatch_expression(
      expression_callback_object,
      make_expression_context(context, false),
      expression1),
    consequent: Tree._dispatch_expression(
      expression_callback_object,
      context,
      expression2),
    alternate: Tree._dispatch_expression(
      expression_callback_object,
      context,
      expression3)}),
  sequence: (context, node, expression1, expression2) => ({
    type: "SequenceExpression",
    expressions: [
      Tree._dispatch_expression(
        expression_callback_object,
        make_expression_context(context, true),
        expression1),
      Tree._dispatch_expression(
        expression_callback_object,
        context,
        expression2)]}),
  throw: (context, node, expression) => ({
    type: "CallExpression",
    optional: false,
    callee: {
      type: "ArrowFunctionExpression",
      id: null,
      async: false,
      generator: false,
      expression: false,
      params: [],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ThrowStatement",
            argument: Tree._dispatch_expression(
              expression_callback_object,
              make_expression_context(context, false),
              expression)}]}},
    arguments: []}),
  // Combiner //
  unary: (context, node, operator, expression) => (
    context = make_expression_context(context, false),
    {
      type: "UnaryExpression",
      prefix: true,
      operator: operator,
      argument: Tree._dispatch_expression(expression_callback_object, context, expression)}),
  binary: (context, node, operator, expression1, expression2) => (
    context = make_expression_context(context, false),
    {
      type: "BinaryExpression",
      operator: operator,
      left: Tree._dispatch_expression(expression_callback_object, context, expression1),
      right: Tree._dispatch_expression(expression_callback_object, context, expression2)}),
  object: (context, node, expression, properties) => (
    context = make_expression_context(context, false),
    {
      type: "ObjectExpression",
      properties: ArrayLite.concat(
        [
          {
            type: "Property",
            kind: "init",
            shorthand: false,
            computed: false,
            method: false,
            key: {
              type: "Identifier",
              name: "__proto__"},
            value: Tree._dispatch_expression(expression_callback_object, context, expression)}],
        ArrayLite.map(
          properties,
          (property) => ({
            type: "Property",
            kind: "init",
            shorthand: false,
            computed: true,
            method: false,
            key: Tree._dispatch_expression(expression_callback_object, context, property[0]),
            value: Tree._dispatch_expression(expression_callback_object, context, property[1])})))}),
  construct: (context, node, expression, expressions, _visit) => (
    context = make_expression_context(context, false),
    _visit = (expression) => Tree._dispatch_expression(expression_callback_object, context, expression),
    (
      context.construct(_visit, expression, expressions) ||
      {
        type: "NewExpression",
        callee: _visit(expression),
        arguments: ArrayLite.map(expressions, _visit)})),
  apply: (context, node, expression1, expression2, expressions, _estree, _visit) => (
    context = make_expression_context(context, false),
    _visit = (expression) => Tree._dispatch_expression(expression_callback_object, context, expression),
    (
      context.apply(_visit, expression1, expression2, expressions) ||
      (
        Tree._dispatch_expression(
          is_primitive_expression_callback_object,
          void 0,
          expression2) ?
        {
          type: "CallExpression",
          optional: false,
          callee: (
            _estree = _visit(expression1),
            (
              _estree.type === "MemberExpression" ?
              {
                type: "SequenceExpression",
                expressions: [
                  {
                    type: "Literal",
                    value: 0},
                  _estree]} :
              _estree)),
          arguments: ArrayLite.map(expressions, _visit)} :
        {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "Identifier",
            name: context.convert(context.namespace.apply)},
          arguments: [
            _visit(expression1),
            _visit(expression2),
            {
              type: "ArrayExpression",
              elements: ArrayLite.map(expressions, _visit)}]})))};

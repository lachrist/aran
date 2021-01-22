"use strict";

const global_Array_isArray = global.Array.isArray;
const global_String = global.String;
const global_Object_assign = global.Object.assign;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Boolean = global.Boolean;
const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");
const Tree = require("./tree");

const make_object_expression = (object) => Tree.ObjectExpression(
  Tree.PrimitiveExpression(null),
  ArrayLite.map(
    global_Reflect_ownKeys(object),
    (key) => [
      Tree.PrimitiveExpression(key),
      Tree.PrimitiveExpression(object[key])]));

///////////
// Cache //
///////////

const get_cache_used = (cache) => cache.used;

const get_cache_identifier = ({identifier}) => identifier;

const get_cache_statement = ({identifier, expression}) => Tree.ExpressionStatement(
  Tree.WriteExpression(identifier, expression));

const lookup = (dynamic, scope, identifier) => (
  identifier in scope.frame ?
  (
    dynamic ?
    (
      scope.frame[identifier].used = true,
      Tree.ReadExpression(scope.frame[identifier].identifier)) :
    scope.frame[identifier].object) :
  lookup(dynamic, scope.parent, identifier));

const make_make_cache = (unmangle, prefix) => (postfix, _object) => (
  _object = unmangle(postfix),
  {
    object: _object,
    used: false,
    identifier: `${prefix}_${postfix}`,
    expression: make_object_expression(_object)});

/////////////
// Program //
/////////////

const full_cut = () => true;

const empty_cut = () => false;

const make_cut = (pointcut) => (
  typeof pointcut === "function" ?
  pointcut :
  (
    (
      typeof pointcut === "object" && 
      pointcut !== null) ?
    (name, ...values) => (
      typeof pointcut[name] === "function" ?
      global_Reflect_apply(pointcut[name], pointcut, values) :
      global_Boolean(pointcut[name])) :
    (
      global_Boolean(pointcut) ?
      full_cut :
      empty_cut)));

const make_trap = (identifier) => (name, ...expressions) => Tree.ApplyExpression(
  Tree.ApplyExpression(
    Tree.IntrinsicExpression("Reflect.get"),
    Tree.PrimitiveExpression(void 0),
    [
      Tree.ReadEnclaveExpression(identifier),
      Tree.PrimitiveExpression(name)]),
  Tree.ReadEnclaveExpression(identifier),
  expressions);

const make_make_fresh_identifier = (identifier, _counter) => (
  _counter = 0,
  () => `${identifier}_${global_String(++_counter)}`);

// interface Options = {
//   source: "script" | "module" | "eval",
//   serials: Map(estree.Node -> Serial),
//   pointcut: any,
//   namespace: {
//     "instrument-callee": VariableIdentifier,
//     "label-cache": VariableIdentifier,
//     "variable-cache": VariableIdentifier,
//     "frame": VariableIdentifier,
//     "completion": VariableIdentifier,
//     "advice": VariableIdentifier }
//   unmangle: {
//     label: (string) -> object,
//     variable: (string) -> object
//   }
// }
module.exports = (program, options) => Tree.dispatch(
  {
    __proto__: null,
    scope: null,
    sort: options.source,
    serialize: options.serialize,
    cut: make_cut(options.pointcut),
    trap: make_trap(options.advice),
    make_label_cache: make_make_cache(options.unmangle.label, options.namespace.label_cache),
    make_variable_cache: make_make_cache(options.unmangle.variable, options.namespace.variable_cache),
    make_fresh_frame_identifier: make_make_fresh_identifier(options.namespace.frame),
    make_fresh_callee_identifier: make_make_fresh_identifier(options.namespace.instrument_callee),
    make_fresh_completion_identifier: make_make_fresh_identifier(options.namespace.completion)},
  program,
  program_callback_object);

const program_callback_object = {
  __proto__: null,
  Program: (context, node, links, block) => Tree.Program(
    links,
    visit_block_from_program(
      block,
      context,
      ArrayLite.map(
        links,
        (link) => visit_link_from_program(link))))};

//////////
// Link //
//////////

const visit_link_from_program = (link) => Tree.dispatch(
  null,
  link,
  link_callback_object);

const link_callback_object = {
  __proto__: null,
  ImportLink: (context, node, specifier, source) => ({
    __proto__: null,
    type: "import",
    import: specifier,
    source: source}),
  ExportLink: (context, node, specifier) => ({
    __proto__: null,
    type: "export",
    export: specifier}),
  AggregateLink: (context, node, specifier1, source, specifier2) => ({
    __proto__: null,
    type: "aggregate",
    import: specifier1,
    source: source,
    export: specifier2})};

////////////
// Branch //
////////////

const visit_branch_from_statement = (branch, statement_context, sort) => Tree.dispatch(
  {
    __proto__: statement_context,
    sort},
  branch,
  branch_callback_object);

const branch_callback_object = {
  __proto__: null,
  Branch: (context, node, labels, block) => Tree.Branch(
    labels,
    visit_block_from_branch(block, context, labels))};

///////////
// Block //
///////////

const visit_block_from_program = (block, program_context, links) => Tree.dispatch(
  {
    __proto__: program_context,
    callee: null,
    links,
    labels: [],
    completion: null,
    scopes: {label:null, variable:null}},
  block,
  block_callback_object);

const visit_block_from_expression = (block, expression_context, sort, callee) => Tree.dispatch(
  {
    __proto__: global_Reflect_getPrototypeOf(expression_context),
    callee,
    links: [],
    labels: [],
    sort,
    completion: null},
  block,
  block_callback_object);

const visit_block_from_branch = (block, branch_context, labels) => Tree.dispatch(
  {
    __proto__: branch_context,
    callee: null,
    links: [],
    labels},
  block,
  block_callback_object);

// https://262.ecma-international.org/11.0/index.html#sec-completion-record-specification-type

const block_callback_object = {
  __proto__: null,
  Block: (context, node, identifiers, statement, _scopes, _frame_cache, _completion_identifier, _caches, _cut1, _cut2, _identifiers1, _identifiers2, _statement1, _statement2) => (
    _identifiers2 = ArrayLite.concat(identifiers),
    _scopes = {
      label: {
        parent: context.scopes.label,
        frame: ArrayLite.reduce(
          context.labels,
          (object, label) => (
            object[label] = context.make_label_cache(label),
            object),
          {__proto__:null})},
      variable: {
        parent: context.scopes.variable,
        frame: ArrayLite.reduce(
          identifiers,
          (object, identifier) => (
            object[identifier] = context.make_identifier_cache(identifier),
            object),
          {__proto__:null})}},
    _frame_cache = {
      object: {
        __proto__: null,
        links: context.links,
        labels: ArrayLite.map(
          context.labels,
          (identifier) => lookup(false, _scopes.label, identifier)),
        variables: ArrayLite.map(
          identifiers,
          (identifier) => lookup(false, _scopes.variable, identifier))},
      used: false,
      identifier: context.make_fresh_frame_identifier(),
      expression: null},
    _completion_identifier = context.make_fresh_completion_identifier(),
    _cut1 = context.cut(
      "enter",
      context.sort,
      _frame_cache.object,
      null,
      context.serialize(node)),
    _cut2 = context.cut(
      "leave",
      context.sort,
      _frame_cache.object,
      null,
      context.serialize(node)),
    _frame_cache.used = _cut1 || _cut2,
    _frame_cache.expression = (
      _frame_cache.used ?
      Tree.ObjectExpression(
        Tree.PrimitiveExpression(null),
        [
          [
            Tree.PrimitiveExpression("links"),
            Tree.ApplyExpression(
              Tree.IntrinsicExpression("Array.of"),
              Tree.PrimitiveExpression(void 0),
              ArrayLite.map(context.links, make_object_expression))],
          [
            Tree.PrimitiveExpression("labels"),
            Tree.ApplyExpression(
              Tree.IntrinsicExpression("Array.of"),
              Tree.PrimitiveExpression(void 0),
              ArrayLite.map(
                context.labels,
                (identifier) => lookup(true, _scopes.label, identifier)))],
          [
            Tree.PrimitiveExpression("variables"),
            Tree.ApplyExpression(
              Tree.IntrinsicExpression("Array.of"),
              Tree.PrimitiveExpression(void 0),
              ArrayLite.map(
                identifiers,
                (identifier) => lookup(true, _scopes.variable, identifier)))]]) :
      null),
    _statement2 = visit_statement_from_block(
      statement,
      context,
      _scopes,
      _identifiers2,
      _cut2 ? _completion_identifier : context.completion),
    console.log(require("util").inspect(_scopes, {depth:1/0, colors:true})),
    _caches = ArrayLite.filter(
      ArrayLite.concat(
        ArrayLite.map(
          context.labels,
          (identifier) => _scopes.label.frame[identifier]),
        ArrayLite.map(
          identifiers,
          (identifier) => _scopes.variable.frame[identifier]),
        [_frame_cache]),
      get_cache_used),
    _identifiers1 = ArrayLite.concat(
      (_cut2 ? [_completion_identifier] : []),
      ArrayLite.map(_caches, get_cache_identifier)),
    _statement1 = Tree.ListStatement(
      [
        (
          context.callee === null ?
          Tree.ListStatement([]) :
          Tree.ExpressionStatement(
            Tree.ApplyExpression(
              Tree.IntrinsicExpression("Reflect.set"),
              Tree.PrimitiveExpression(void 0),
              [
                Tree.ReadExpression("input"),
                Tree.PrimitiveExpression("callee"),
                Tree.ReadExpression(context.callee)]))),
        Tree.ListStatement(
          ArrayLite.map(_caches, get_cache_statement)),
        (
          _cut1 ?
          Tree.ExpressionStatement(
            Tree.WriteExpression(
              "input",
              context.trap(
                "enter",
                Tree.PrimitiveExpression(context.sort),
                Tree.ReadExpression(_frame_cache.identifier),
                Tree.ReadExpression("input"),
                Tree.PrimitiveExpression(
                  context.serialize(node))))) :
          Tree.ListStatement([]))]),
    (
      _cut2 ?
      Tree.Block(
        _identifiers1,
        Tree.ListStatement(
          [
            _statement1,
            Tree.TryStatement(
              Tree.Branch(
                [],
                Tree.Block(_identifiers2, _statement2)),
              Tree.Branch(
                [],
                Tree.Block(
                  [],
                  Tree.CompletionStatement(
                    Tree.WriteExpression(
                      _completion_identifier,
                      Tree.ObjectExpression(
                        Tree.PrimitiveExpression(null),
                        [
                          [
                            Tree.PrimitiveExpression("type"),
                            Tree.PrimitiveExpression("throw")],
                          [
                            Tree.PrimitiveExpression("value"),
                            Tree.ApplyExpression(
                              Tree.IntrinsicExpression("Reflect.get"),
                              Tree.PrimitiveExpression(void 0),
                              [
                                Tree.ReadExpression("input"),
                                Tree.PrimitiveExpression("error")])]]))))),
              Tree.Branch(
                [],
                Tree.Block(
                  [],
                  Tree.ListStatement(
                    [
                      Tree.ExpressionStatement(
                        Tree.WriteExpression(
                          _completion_identifier,
                          context.trap(
                            "leave",
                            Tree.PrimitiveExpression(context.sort),
                            Tree.ReadExpression(_frame_cache.identifier),
                            Tree.ReadExpression(_completion_identifier),
                            Tree.PrimitiveExpression(context.serialize(node))))),
                      Tree.IfStatement(
                        Tree.BinaryExpression(
                          "===",
                          Tree.ApplyExpression(
                            Tree.IntrinsicExpression("Reflect.get"),
                            Tree.PrimitiveExpression(void 0),
                            [
                              Tree.ReadExpression(_completion_identifier),
                              Tree.PrimitiveExpression("type")]),
                          Tree.PrimitiveExpression("throw")),
                        Tree.Branch(
                          [],
                          Tree.Block(
                            [],
                            Tree.CompletionStatement(
                              Tree.ThrowExpression(
                                Tree.ApplyExpression(
                                  Tree.IntrinsicExpression("Reflect.get"),
                                  Tree.PrimitiveExpression(void 0),
                                  [
                                    Tree.ReadExpression(_completion_identifier),
                                    Tree.PrimitiveExpression("value")]))))),
                        Tree.Branch(
                          [],
                          Tree.Block(
                            [],
                            Tree.CompletionStatement(
                              Tree.PrimitiveExpression(void 0))))),
                      (
                        context.completion === null ?
                        Tree.ListStatement(
                          [
                            Tree.IfStatement(
                              Tree.BinaryExpression(
                                "===",
                                Tree.ApplyExpression(
                                  Tree.IntrinsicExpression("Reflect.get"),
                                  Tree.PrimitiveExpression(void 0),
                                  [
                                    Tree.ReadExpression(_completion_identifier),
                                    Tree.PrimitiveExpression("type")]),
                                Tree.PrimitiveExpression("return")),
                              Tree.Branch(
                                [],
                                Tree.Block(
                                  [],
                                  Tree.ListStatement(
                                    [
                                      Tree.ReturnStatement(
                                        Tree.ApplyExpression(
                                          Tree.IntrinsicExpression("Reflect.get"),
                                          Tree.PrimitiveExpression(void 0),
                                          [
                                            Tree.ReadExpression(_completion_identifier),
                                            Tree.PrimitiveExpression("value")])),
                                      Tree.CompletionStatement(
                                        Tree.PrimitiveExpression(void 0))]))),
                              Tree.Branch(
                                [],
                                Tree.Block(
                                  [],
                                  Tree.CompletionStatement(
                                    Tree.PrimitiveExpression(void 0))))),
                            Tree.CompletionStatement(
                              Tree.PrimitiveExpression(void 0))]) :
                        Tree.CompletionStatement(
                          Tree.WriteExpression(
                            context.completion,
                            Tree.ReadExpression(_completion_identifier))))])))),
            Tree.CompletionStatement(
              (
                context.completion === null ?
                Tree.ApplyExpression(
                  Tree.IntrinsicExpression("Reflect.get"),
                  Tree.PrimitiveExpression(void 0),
                  [
                    Tree.ReadExpression(_completion_identifier),
                    Tree.PrimitiveExpression("value")]) :
                Tree.PrimitiveExpression(void 0)))])) :
      Tree.Block(
        ArrayLite.concat(_identifiers1, _identifiers2),
        Tree.ListStatement([_statement1, _statement2]))))};

///////////////
// Statement //
///////////////

const visit_statement_from_statement = (statement, statement_context) => Tree.dispatch(
  statement_context,
  statement,
  statement_callback_object);

const visit_statement_from_block = (statement, block_context, scopes, identifiers, completion) => Tree.dispatch(
  {
    __proto__: block_context,
    scopes,
    identifiers,
    completion},
  statement,
  statement_callback_object);

const statement_callback_object = {
  __proto__: null,
  DeclareEnclaveStatement: (context, node, kind, identifier, expression) => Tree.EnclaveDeclare(
    kind,
    identifier,
    (
      context.cut.enclave_declare(
        kind,
        identifier,
        null,
        context.serialize(node)) ?
      context.trap.enclave_declare(
        Tree.PrimitiveExpression(kind),
        Tree.PrimitiveExpression(identifier),
        visit_expression_from_statement(context, expression, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      visit_expression_from_statement(context, expression, null))),
  ExpressionStatement: (context, node, expression) => Tree.ExpressionStatement(
    visit_expression_from_statement(expression, context, node)),
  BreakStatement: (context, node, identifier, _expression) => Tree.ListStatement(
    [
      (
        context.cut(
          "break",
          lookup(false, context.scopes.label, identifier),
          context.serialize(node)) ?
        Tree.ExpressionStatement(
          context.trap(
            "break",
            lookup(true, context.scopes.label, identifier),
            Tree.PrimitiveExpression(
              context.serialize(node)))) :
        Tree.ListStatement([])),
      (
        context.completion === null ?
        Tree.ListStatement([]) :
        Tree.ExpressionStatement(
          Tree.WriteExpression(
            context.completion,
            Tree.ObjectExpression(
              Tree.PrimitiveExpression(null),
              [
                [
                  Tree.PrimitiveExpression("type"),
                  Tree.PrimitiveExpression("break")],
                [
                  Tree.PrimitiveExpression("target"),
                  lookup(true, context.scopes.label, identifier)]])))),
      Tree.BreakStatement(identifier)]),
  CompletionStatement: (context, node, expression) => (
    expression = (
      context.cut(
        "completion",
        null,
        context.serialize(node)) ?
      context.trap(
        "completion",
        visit_expression_from_statement(expression, context, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      visit_expression_from_statement(expression, context, null)),
    Tree.CompletionStatement(
      (
        context.completion === null ?
        expression :
        Tree.WriteExpression(
          context.completion,
          Tree.ObjectExpression(
            Tree.PrimitiveExpression(null),
            [
              [
                Tree.PrimitiveExpression("type"),
                Tree.PrimitiveExpression("normal")],
              [
                Tree.PrimitiveExpression("value"),
                expression]]))))),
  ReturnStatement: (context, node, expression) => (
    expression = (
      context.cut(
        "return",
        null,
        context.serialize(node)) ?
      context.trap(
        "return",
        visit_expression_from_statement(context, expression, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      visit_expression_from_statement(context, expression, null)),
    Tree.ReturnStatement(
      (
        context.completion === null ?
        expression :
        Tree.WriteExpression(
          context.completion,
          Tree.ObjectExpression(
            Tree.PrimitiveExpression(null),
            [
              [
                Tree.PrimitiveExpression("type"),
                Tree.PrimitiveExpression("return")],
              [
                Tree.PrimitiveExpression("value"),
                expression]]))))),
  DebuggerStatement: (context, node) => Tree.ListStatement(
    [
      (
        context.cut(
          "debugger",
          context.serialize(node)) ?
        Tree.ExpressionStatement(
          context.trap(
            "debugger",
            Tree.PrimitiveExpression(
              context.serialize(node)))) :
        Tree.ListStatement([])),
      Tree.DebuggerStatement()]),
  ListStatement: (context, node, statements) => Tree.ListStatement(
    ArrayLite.map(statements, (statement) => visit_statement_from_statement(statement, context))),
  BranchStatement: (context, node, branch) => Tree.BranchStatement(
    visit_branch_from_statement(branch, context, "lone")),
  WhileStatement: (context, node, expression, branch) => Tree.WhileStatement(
    (
      context.cut(
        "test",
        "while",
        null,
        context.serialize(node)) ?
      context.trap(
        "test",
        Tree.PrimitiveExpression("while"),
        visit_expression_from_statement(context, expression, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      visit_expression_from_statement(context, expression, null)),
    visit_branch_from_statement(branch, context, "do")),
  IfStatement: (context, node, expression, branch1, branch2) => Tree.IfStatement(
    (
      context.cut(
        "test",
        "if",
        null,
        context.serialize(node)) ?
      context.trap(
        "test",
        Tree.PrimitiveExpression("if"),
        visit_expression_from_statement(context, expression, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      visit_expression_from_statement(context, expression, null)),
    visit_branch_from_statement(branch1, context, "then"),
    visit_branch_from_statement(branch2, context, "else")),
  TryStatement: (context, node, branch1, branch2, branch3) => Tree.TryStatement(
    visit_branch_from_statement(branch1, context, "try"),
    visit_branch_from_statement(branch2, context, "catch"),
    visit_branch_from_statement(branch3, context, "finally"))};

////////////////
// Expression //
////////////////

const visit_expression_from_statement = (expression, statement_context, drop) => Tree.dispatch(
  {
    __proto__: statement_context,
    drop},
  expression,
  expression_callback_object);

const visit_expression_from_expression = (expression, expression_context, drop) => Tree.dispatch(
  {
    __proto__: global_Reflect_getPrototypeOf(expression_context),
    drop},
  expression,
  expression_callback_object);

const check_dropped_1 = (context, node, expression) => (
  context.drop === null ?
  expression :
  (
    context.cut(
      "drop",
      null,
      context.serialize(context.drop)) ?
    context.trap(
      "drop",
      expression,
      Tree.PrimitiveExpression(
        context.serialize(context.drop))) :
    expression));

const check_dropped_2 = (context, node, expression) => (
  context.drop === null ?
  (
    context.cut(
      "primitive",
      void 0,
      context.serialize(node)) ?
    context.trap(
      "primitive",
      expression,
      Tree.PrimitiveExpression(
        context.serialize(node))) :
    expression) :
  expression);

const expression_callback_object = {
  __proto__: null,
  // Producer //
  PrimitiveExpression: (context, node, primitive) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "primitive",
        primitive,
        context.serialize(node)) ?
      context.trap(
        "primitive",
        Tree.PrimitiveExpression(primitive),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.PrimitiveExpression(primitive))),
  ClosureExpression: (context, node, sort, asynchronous, generator, block, _identifier) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "closure",
        sort,
        asynchronous,
        generator,
        null,
        context.serialize(node)) ?
      (
        _identifier = context.callee(),
        context.identifiers[context.identifiers.length] = _identifier,
        Tree.SequenceExpression(
          Tree.WriteExpression(
            _identifier,
            context.trap(
              "closure",
              Tree.PrimitiveExpression(sort),
              Tree.PrimitiveExpression(asynchronous),
              Tree.PrimitiveExpression(generator),
              Tree.ClosureExpression(
                sort,
                asynchronous,
                generator,
                visit_block_from_expression(block, context, sort, _identifier)),
              Tree.PrimitiveExpression(
                context.serialize(node)))),
          Tree.ReadExpression(_identifier))) :
      Tree.ClosureExpression(
        sort,
        asynchronous,
        generator,
        visit_block_from_expression(block, context, sort, null)))),
  ImportExpression: (context, node, specifier, source) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "import",
        specifier,
        source,
        null,
        context.serialize(node)) ?
      context.trap(
        "import",
        Tree.PrimitiveExpression(specifier),
        Tree.PrimitiveExpression(source),
        Tree.ImportExpression(specifier, source),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.ImportExpression(specifier, source))),
  ReadExpression: (context, node, identifier) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "read",
        lookup(false, context.scopes.variable, identifier),
        null,
        context.serialize(node)) ?
      context.trap(
        "read",
        lookup(true, context.scopes.variable, identifier),
        Tree.ReadExpression(identifier),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.ReadExpression(identifier))),
  IntrinsicExpression: (context, node, intrinsic) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "intrinsic",
        intrinsic,
        null,
        context.serialize(node)) ?
      context.trap(
        "intrinsic",
        Tree.PrimitiveExpression(intrinsic),
        Tree.IntrinsicExpression(intrinsic),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.IntrinsicExpression(intrinsic))),
  // Consumer //
  AwaitExpression: (context, node, expression) => check_dropped_1(
    context,
    node,
    Tree.AwaitExpression(
      (
        context.cut(
          "await",
          null,
          context.serialize(node)) ?
        context.trap(
          "await",
          visit_expression_from_expression(context, expression, null),
          Tree.PrimitiveExpression(
            context.serialize(node))) :
        visit_expression_from_expression(context, expression, null)))),
  YieldExpression: (context, node, delegate, expression) => check_dropped_1(
    context,
    node,
    Tree.YieldExpression(
      delegate,
      (
        context.cut(
          "yield",
          delegate,
          null,
          context.serialize(node)) ?
        context.trap(
          "yield",
          Tree.PrimitiveExpression(delegate),
          visit_expression_from_expression(context, expression, null),
          Tree.PrimitiveExpression(
            context.serialize(node))) :
        visit_expression_from_expression(context, expression, null)))),
  ThrowExpression: (context, node, expression) => Tree.ThrowExpression(
    (
      context.cut(
        "throw",
        null,
        context.serialize(node)) ?
      context.trap(
        "throw",
        visit_expression_from_expression(context, expression, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      visit_expression_from_statement(context, expression, null))),
  ExportExpression: (context, node, specifier, expression) => check_dropped_2(
    context,
    node,
    Tree.ExportExpression(
      specifier,
      (
        context.cut(
          "export",
          specifier,
          null,
          context.serialize(node)) ?
        context.trap(
          "export",
          Tree.PrimitiveExpression(specifier),
          visit_expression_from_expression(context, expression, null),
          Tree.PrimitiveExpression(
            context.serialize(node))) :
        visit_expression_from_statement(context, expression, null)))),
  WriteExpression: (context, node, identifier, expression) => check_dropped_2(
    context,
    node,
    Tree.WriteExpression(
      identifier,
      (
        context.cut(
          "write",
          lookup(false, context.scopes.variable, identifier),
          null,
          context.serialize(node)) ?
        context.trap(
          "write",
          Tree.ReadExpression(
            lookup(true, context.scopes.variable, identifier)),
          visit_expression_from_expression(context, expression, null),
          Tree.PrimitiveExpression(
            context.serialize(node))) :
        visit_expression_from_statement(context, expression, null)))),
  SequenceExpression: (context, node, expression1, expression2) => Tree.SequenceExpression(
    visit_expression_from_expression(expression1, context, node),
    visit_expression_from_expression(expression2, context, context.drop)),
  ConditionalExpression: (context, node, expression1, expression2, expression3) => Tree.ConditionalExpression(
    (
      context.cut(
        "test",
        "conditional",
        null,
        context.serialize(node)) ?
      context.trap(
        "test",
        Tree.PrimitiveExpression("conditional"),
        visit_expression_from_expression(context, expression, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      visit_expression_from_statement(context, expression, null)),
    visit_expression_from_expression(expression2, context, context.drop),
    visit_expression_from_expression(expression3, context, context.drop)),
  // Combiner //
  EvalExpression: (context, node, expression) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "eval",
        null,
        context.serialize(node)) ?
      context.trap(
        "eval",
        visit_expression_from_expression(expression, context, null),
        Tree.ClosureExpression(
          "arrow",
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.EvalExpression(
                Tree.ApplyExpression(
                  Tree.IntrinsicExpression("Reflect.get"),
                  Tree.PrimitiveExpression(void 0),
                  [
                    Tree.ApplyExpression(
                      Tree.IntrinsicExpression("Reflect.get"),
                      Tree.PrimitiveExpression(void 0),
                      [
                        Tree.ReadExpression("input"),
                        Tree.PrimitiveExpression("arguments")]),
                    Tree.PrimitiveExpression(0)]))))),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
    Tree.EvalExpression(
      visit_expression_from_expression(expression, context, null)))),
  RequireExpression: (context, node, expression) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "require",
        null,
        context.serialize(node)) ?
      context.trap(
        "require",
        visit_expression_from_expression(context, expression, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      visit_expression_from_statement(context, expression, null))),
  ReadEnclaveExpression: (context, node, identifier) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "enclave_read",
        identifier,
        null,
        context.serialize(node)) ?
      context.trap(
        "enclave_read",
        Tree.PrimitiveExpression(identifier),
        Tree.ClosureExpression(
          "arrow",
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.ReadEnclaveExpression(identifier)))),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.ReadEnclaveExpression(identifier))),
  TypeofEnclaveExpression: (context, node, identifier) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "enclave_typeof",
        identifier,
        null,
        context.serialize(node)) ?
      context.trap(
        "enclave_typeof",
        Tree.PrimitiveExpression(identifier),
        Tree.ClosureExpression(
          "arrow",
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.TypeofEnclaveExpression(identifier)))),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.TypeofEnclaveExpression(identifier))),
  WriteEnclaveExpression: (context, node, strict, identifier, expression) => check_dropped_2(
    context,
    node,
    (
      context.cut(
        "enclave_write",
        strict,
        identifier,
        null,
        null,
        context.serialize(node)) ?
      context.trap(
        "enclave_write",
        Tree.PrimitiveExpression(strict),
        Tree.PrimitiveExpression(identifier),
        visit_expression_from_expression(context, expression, null),
        Tree.ClosureExpression(
          "arrow",
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.WriteEnclaveExpression(
                strict,
                identifier,
                Tree.ApplyExpression(
                  Tree.IntrinsicExpression("Reflect.get"),
                  Tree.PrimitiveExpression(void 0),
                  [
                    Tree.ApplyExpression(
                      Tree.IntrinsicExpression("Reflect.get"),
                      Tree.PrimitiveExpression(void 0),
                      [
                        Tree.ReadExpression("input"),
                        Tree.PrimitiveExpression("arguments")]),
                    Tree.PrimitiveExpression(0)]))))),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.WriteEnclaveExpression(
        strict,
        identifier,
        visit_expression_from_expression(context, expression, null)))),
  MemberSuperEnclaveExpression: (context, node, expression) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "enclave_super_member",
        null,
        null,
        context.serialize(node)) ?
      context.trap(
        "enclave_super_member",
        visit_expression_from_expression(context, expression, null),
        Tree.ClosureExpression(
          "arrow",
          false,
          false,
          Tree.Block(
            [],
            Tree.ReturnStatement(
              Tree.MemberSuperEnclaveExpression(
                Tree.ApplyExpression(
                  Tree.IntrinsicExpression("Reflect.get"),
                  Tree.PrimitiveExpression(void 0),
                  [
                    Tree.ApplyExpression(
                      Tree.IntrinsicExpression("Reflect.get"),
                      Tree.PrimitiveExpression(void 0),
                      [
                        Tree.ReadExpression("input"),
                        Tree.PrimitiveExpression("arguments")]),
                    Tree.PrimitiveExpression(0)]))))),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.MemberSuperEnclaveExpression(
        visit_expression_from_expression(context, expression, null)))),
  CallSuperEnclaveExpression: (context, node, expression) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "enclave_super_call",
        null,
        null,
        context.serialize(node)) ?
      context.trap(
        "enclave_super_call",
        visit_expression_from_expression(context, expression, null),
        Tree.ClosureExpression(
          "arrow",
          false,
          false,
          Tree.Block(
            [],
            Tree.ReturnStatement(
              Tree.CallSuperEnclaveExpression(
                Tree.ApplyExpression(
                  Tree.IntrinsicExpression("Reflect.get"),
                  Tree.PrimitiveExpression(void 0),
                  [
                    Tree.ApplyExpression(
                      Tree.IntrinsicExpression("Reflect.get"),
                      Tree.PrimitiveExpression(void 0),
                      [
                        Tree.ReadExpression("input"),
                        Tree.PrimitiveExpression("arguments")]),
                    Tree.PrimitiveExpression(0)]))))),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.CallSuperEnclaveExpression(
        visit_expression_from_expression(context, expression, null)))),
  ObjectExpression: (context, node, expression, properties) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "object",
        null,
        ArrayLite.map(properties, make_null_pair),
        context.serialize(node)) ?
      context.trap(
        "object",
        visit_expression_from_expression(expression, context, null),
        ArrayLite.map(
          properties,
          ({0:expression1, 1:expression2}) => [
            visit_expression_from_expression(expression, context, null),
            visit_expression_from_expression(expression, context, null)]),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.ObjectExpression(
        visit_expression_from_expression(expression, context, null),
        ArrayLite.map(
          properties,
          ({0:expression1, 1:expression2}) => [
            visit_expression_from_expression(expression, context, null),
            visit_expression_from_expression(expression, context, null)])))),
  UnaryExpression: (context, node, operator, expression) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "unary",
        operator,
        null,
        context.serialize(node)) ?
      context.trap(
        "unary",
        Tree.PrimitiveExpression(operator),
        visit_expression_from_expression(expression, context, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.UnaryExpression(
        operator,
        visit_expression_from_expression(expression, context, null)))),
  BinaryExpression: (context, node, operator, expression1, expression2) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "binary",
        operator,
        null,
        null,
        context.serialize(node)) ?
      context.trap(
        "binary",
        Tree.PrimitiveExpression(operator),
        visit_expression_from_expression(expression1, context, null),
        visit_expression_from_expression(expression2, context, null),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.BinaryExpression(
        operator,
        visit_expression_from_expression(expression1, context, null),
        visit_expression_from_expression(expression2, context, null)))),
  ConstructExpression: (context, node, expression, expressions) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "construct",
        null,
        ArrayLite.map(expressions, make_null),
        context.serialize(node)) ?
      context.trap(
        "construct",
        visit_expression_from_expression(expression, context, null),
        ArrayLite.map(
          expressions,
          (expression) => visit_expression_from_expression(expression, context, null)),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.ConstructExpression(
        visit_expression_from_expression(expression, context, null),
        ArrayLite.map(
          expressions,
          (expression) => visit_expression_from_expression(expression, context, null))))),
  ApplyExpression: (context, node, expression1, expression2, expressions) => check_dropped_1(
    context,
    node,
    (
      context.cut(
        "apply",
        null,
        null,
        ArrayLite.map(expressions, make_null),
        context.serialize(node)) ?
      context.trap(
        "apply",
        visit_expression_from_expression(expression1, context, null),
        visit_expression_from_expression(expression2, context, null),
        ArrayLite.map(
          expressions,
          (expression) => visit_expression_from_expression(expression, context, null)),
        Tree.PrimitiveExpression(
          context.serialize(node))) :
      Tree.ApplyExpression(
        visit_expression_from_expression(expression1, context, null),
        visit_expression_from_expression(expression2, context, null),
        ArrayLite.map(
          expressions,
          (expression) => visit_expression_from_expression(expression, context, null)))))};

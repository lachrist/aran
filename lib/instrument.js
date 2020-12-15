"use strict";

const global_Object_assign = global.Object.assign;

const ArrayLite = require("array-lite");
const Throw = require("./throw.js");
const Tree = require("./tree");

const global_Reflect_apply = global.Reflect.apply;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Boolean = global.Boolean;
const global_Reflect_getPrototypeOf = global.Reflect.getPrototypeOf;

// type BlockContext = (Weave, Show, Fresh, Callee, Tag, Labels)
// type StatementContext = (Weave, Show, Fresh, Identifers)
// type ExpressionContext = (Weave, Show, Fresh, Identifiers, Dropped)
//
// type Weave = (...)
// type Callee = Maybe Identifier
// type Dropped = Maybe aran.Node
// type Tag = Program | Eval | Function | Method | Constructor | Arrow | Lone | Do | Then | Else | Try | Catch | Finally
// type Identifiers = [Identifier]
// type Labels = [Label]

const parameter_array_object = {
  __proto__: null,
  "script": [],
  "module": [],
  "local-eval": [],
  "global-eval": [],
  "function": ["callee", "arguments", "this", "new.target"],
  "method": ["callee", "arguments", "this"],
  "constructor": ["callee", "arguments", "new.target"],
  "arrow": ["callee", "arguments"],
  "lone": [],
  "do": [],
  "then": [],
  "else": [],
  "try": [],
  "catch": ["error"],
  "finally": []};

const make_cut = (show, serials, pointcut, _converters, _convert) => (
  _converters = {
    __proto__: null,
    "frame": (frame) => ({
      labels: _convert(["label"], frame.labels),
      module: _convert(["trade"], frame.module),
      identifiers: _convert(["identifiers"], frame.identifiers)}),
    "trade": (trade) => (
      trade.type === "import" ?
      {
        __proto__: null,
        type: "import",
        import: _convert("specifier", trade.import),
        source: _convert("source", trade.source)} :
      (
        trade.type === "export" ?
        {
          __proto__: null,
          type: "export",
          export: _convert("specifier", trade.export)} :
        // console.assert(trade.type === "aggregate")
        {
          __proto__: null,
          type: "aggregate",
          import: _convert("specifier", trade.import),
          source: _convert("source", trade.source),
          export: _convert("specifier", trade.export)})),
    "input": (input) => ArrayLite.reduce(
      parameter_array_object[input],
      (object, key) => (
        object[key] = null,
        object),
      {__proto__:null}),
    "node": (node) => global_Reflect_apply(global_Map_prototype_get, serials, [node]),
    "expression": (expression) => null,
    "specifier": (specifier) => specifier,
    "source": (source) => source,
    "primitive": (primitive) => primitive,
    "builtin": (builtin) => builtin,
    "tag": (tag) => tag,
    "label": show.label,
    "identifier": show.identifier,
    "operator": (operator) => operator},
  _convert = (type, value) => (
    typeof type === "string" ?
    _converters[type](value) :
    ArrayLite.map(
      value,
      (
        type.length === 1 ?
        (value) => _convert(type[0], value) :
        (value, index) => _convert(type[index], value)))),
  (name, args, types) => (
    typeof pointcut[name] === "function" ?
    global_Reflect_apply(
      pointcut[name],
      pointcut,
      ArrayLite.map(
        args,
        (arg, index) => _convert(types[index], args))) :
    global_Boolean(pointcut[name])));

const make_trap = (show, serials, _converters, _convert) => (
  _converters = {
    __proto__: null,
    "trade": (trade) => Tree.object(
      Tree.primitive(null),
      ArrayLite.concat(
        [
          [
            Tree.primitive("type"),
            Tree.primitive(trade.type)]],
        (
          trade.type === "export" ?
          [] :
          [
            [
              Tree.primitive("import"),
              _convert("specifier", trade.import)],
            [
              Tree.primitive("source"),
              _convert("source", trade.source)]]),
        (
          trade.type === "import" ?
          [] :
          [
            Tree.primitive("export"),
            _convert("specifier", trade.export)]))),
    "frame": (frame) => Tree.object(
      Tree.primitive(null),
      [
        [
          Tree.primitive("labels"),
          _convert(["label"], frame.labels)],
        [
          Tree.primitive("module"),
          _convert(["trade"], frame.module)],
        [
          Tree.primitive("identifiers"),
          _convert(["identifiers"], frame.identifiers)]]),
    "input": (input) => Tree.read("input"),
    "node": (node) => Tree.primitive(
      global_Reflect_apply(global_Map_prototype_get, serials, [node])),
    "expression": (expression) => expression,
    "source": (source) => Tree.primitive(source),
    "specifier": (specifier) => Tree.primitive(specifier),
    "primitive": (primitive) => Tree.primitive(primitive),
    "builtin": (builtin) => Tree.primitive(builtin),
    "tag": (tag) => Tree.primitive(tag),
    "label": (label) => Tree.primitive(
      show.label(label)),
    "identifier": (identifier) => Tree.primitive(
      show.identifier(identifier)),
    "operator": (operator) => Tree.primitive(operator)},
  _convert = (type, value) => (
    typeof type === "string" ?
    _converters[type](value) :
    // console.assert(global_Array_isArray(type))
    Tree.apply(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(
        value,
        (
          type.length === 1 ?
          (value) => _convert(type[0], value) :
          (value, index) => _convert(type[index], value))))),
  (name, args, types) => Tree.apply(
    Tree.apply(
      Tree.builtin("Reflect.get"),
      Tree.primitive(void 0),
      [
        Tree.builtin("aran.advice"),
        Tree.primitive(name)]),
    Tree.read(advice_identifier),
    ArrayLite.map(
      args,
      (arg, index) => _convert(types[index], arg))));

let has_been_cut = false;
const optimize = {
  __proto__: null,
  inform: (expression) => (
    has_been_cut ?
    Tree.Lift(expression) :
    Tree.Bundle([])),
  leave: (expression) => ({
    has_been_cut,
    statement: Tree.Lift(expression)}),
  failure: (expression) => ({
    has_been_cut,
    statement: Tree.Lift(
      Tree.throw(expression))}),
  enter: (expression) => (
    has_been_cut ?
    Tree.Lift(
      Tree.write("input", expression)) :
    Tree.Bundle([]))};

const pass = () => Tree.primitive(void 0);
const forward_first = (expression) => expression;
const forward_second = (_, expression) => expression;
const forward_third = (_, _, expression) => expression;

const make_weave = (cut, trap) => ArrayLite.reduce(
  [
    // Informers //
    ["completion", ["tag", "node"], pass],
    ["leave", ["tag", "node"], pass],
    ["continue", ["label", "node"], pass],
    ["break", ["label", "node"], pass],
    ["debugger", ["node"], pass],
    // Producers //
    [
      "enter",
      [
        "tag",
        {
          "labels": ["label"],
          "module": ["trade"],
          "identifiers": ["identifier"]},
        "input",
        "node"],
      (tag, frame, input, node) => Tree.read("input")],
    [
      "primitive",
      ["primitive", "node"],
      (primitive, node) => Tree.primitive(primitive)],
    ["closure", ["tag", "expression", "node"], forward_second],
    ["builtin", ["builtin", "expression", "node"], forward_second],
    ["read", ["identifier", "expression", "node"], forward_second],
    ["import", ["specifier", "source", "expression", "node"], forward_second],
    ["require", ["expression", "node"], forward_first],
    ["eval", ["expression", "node"], forward_first],
    // Consumers //
    ["drop", ["expression", "node"], forward_first],
    ["test", ["expression", "node"], forward_first],
    ["write", ["identifier", "expression", "node"], forward_second],
    ["return", ["expression", "node"], forward_first],
    ["throw", ["expression", "node"], forward_first],
    ["failure", ["tag", "expression", "node"], forward_second],
    ["export", ["specifier", "expression", "node"], forward_second],
    ["source", ["expression", "node"], forward_first],
    ["code", ["expression", "node"], forward_first],
    // Combiners //
    [
      "object",
      ["expression", [["expression", "expression"]], "node"],
      (expression, properties, node) => Tree.object(expression, properties)],
    [
      "unary",
      ["operator", "expression", "node"],
      (operator, expression, node) => Tree.unary(operator, expression)],
    [
      "binary",
      ["operator", "expression", "expression", "node"],
      (operator, expression1, expression2, node) => Tree.binary(operator, expression1, expression2)],
    [
      "construct",
      ["expression", ["expression"], "node"],
      (expression, expressions) => Tree.construct(expression, expressions)],
    [
      "apply",
      ["expression", "expression", ["expression"], "node"],
      (expression1, expression2, expressions) => Tree.apply(expression1, expression2, expressions)]],
  (weave, {0:name, 1:types, 2:closure}) => (
    weave[name] = (...args) => (
      (has_been_cut = cut(name, args, types)) ?
      trap(name, args, types) :
      global_Reflect_apply(closure, void 0, args)),
    weave),
  {__proto__:null});

const fetch = (context, type) => (
  context.type === type ?
  context :
  fetch(
    global_Reflect_getPrototypeOf(context),
    type));

const visit_program = (program, context) => Tree._dispatch_program(
  program_callback_object,
  {
    __proto__: null,
    type: "program",
    source: context.source,
    weave: make_weave(
      make_cut(context.show, context.serials, context.pointcut),
      make_trap(context.show, context.serials)),
    fresh: context.fresh,
    show: context.show},
  program);

const visit_prelude = (prelude, context) => Tree._dispatch_prelude(
  prelude_callback_object,
  {
    __proto__: fetch(context, "program"),
    type: "prelude"},
  prelude);

const visit_block = (block, context, options) => Tree._dispatch_block(
  block_callback_object,
  global_Object_assign(
    {
      __proto__: fetch(context, "program"),
      type: "block",
      tag: void 0,
      labels: [],
      preludes: [],
      callee: null},
    options),
  block);

const visit_statement = (statement, context, options) => Tree._dispatch_statement(
  statement_callback_object,
  global_Object_assign(
    {
      __proto__: fetch(context, "block"),
      type: "statement",
      identifiers: void 0},
    options),
  statement);

const visit_expression = (expression, context, options) => Tree._dispatch_expression(
  expression_callback_object,
  global_Object_assign(
    {
      __proto__: fetch(context, "statement"),
      type: "expression",
      dropped: null},
    options),
  expression);

const program_callback_object = {
  __proto__: null,
  _program: (context, node, preludes, block) => Tree._program(
    preludes,
    visit_block(
      block,
      context,
      {
        tag: context.source,
        module: ArrayLite.map(
          preludes,
          (prelude) => visit_prelude(prelude, context))}))};

const prelude_callback_object = {
  __proto__: null,
  _import: (context, node, specifier, source) => ({
    __proto__: null,
    type: "import",
    import: specifier,
    source: source}),
  _export: (context, node, specifier) => ({
    __proto__: null,
    type: "export",
    export: specifier}),
  _aggregate: (context, node, specifier1, source, specifier2) => ({
    __proto__: null,
    type: "aggregate",
    import: specifier1,
    source: source,
    export: specifier2})};

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, identifiers, statements, _identifiers, _statements, _result1, _result2) => (
    _identifiers = ArrayLite.concat(identifiers),
    _statements = [
      (
        context.callee === null ?
        Tree.Bundle([]) :
        Tree.Lift(
          Tree.apply(
            Tree.Builtin("Reflect.set"),
            Tree.primitive(void 0),
            [
              Tree.read("input"),
              Tree.primitive("callee"),
              Tree.read(context.callee)]))),
      optimize.enter(
        context.weave.enter(
          context.tag,
          {
            __proto__: null,
            labels: context.labels,
            module: context.trades,
            identifiers: identifiers},
          context.tag,
          node)),
      optimize.inform(
        context.weave.completion(context.tag, node))],
    _result1 = optimize.failure(
      context.weave.failure(
        context.tag,
        Tree.read("error"),
        node)),
    _result1 = optimize.leave(
      context.weave.leave(context.tag, node)),
    (
      (
        _result1.has_been_cut ||
        _result2.has_been_cut) ?
      Tree.BLOCK(
        [],
        [
          Tree.Try(
            [],
            Tree.BLOCK(_identifiers, _statements),
            Tree.BLOCK(
              [],
              [result1.statement]),
            Tree.BLOCK(
              [],
              [result2.statement]))]) :
      Tree.BLOCK(_identifiers, _statements)))};

const statement_callback_object = {
  __proto__: null,
  Lift: (context, node, expression) => Tree.Lift(
    visit_expression(expression, context, {dropped:node})),
  Break: (context, node, label) => Tree.Bundle(
    [
      optimize.inform(
        context.weave.break(label, node)),
      Tree.Break(label)]),
  Continue: (context, node, label) => Tree.Bundle(
    [
      optimize.inform(
        context.weave.continue(label, node)),
      Tree.Continue(label)]),
  Return: (context, node, expression) => Tree.Return(
    context.weave.return(
      visit_expression(expression, context, null),
      node)),
  Debugger: (context, node) => Tree.Bundle(
    [
      optimize.inform(
        context.weave.debugger(node)),
      Tree.Debugger()]),
  Lone: (context, node, labels, block) => Tree.Lone(
    labels,
    visit_block(
      block,
      context,
      {
        tag: "lone",
        labels: labels})),
  While: (context, node, labels, expression, block) => Tree.While(
    labels,
    context.weave.test(
      visit_expression(expression, context, null),
      node),
    visit_block(
      block,
      context,
      {
        tag: "do",
        labels: labels})),
  If: (context, node, labels, expression, block1, block2) => Tree.If(
    labels,
    context.weave.test(
      visit_expression(expression, context, null),
      node),
    visit_block(
      block1,
      context,
      {
        tag: "then",
        labels: labels}),
    visit_block(
      block2,
      context,
      {
        tag: "else",
        labels: labels},
      block2)),
  Try: (context, node, labels, block1, block2, block3) => Tree.Try(
    labels,
    visit_block(
      block1,
      context,
      {
        tag: "try",
        labels: labels}),
    visit_block(
      block2,
      context,
      {
        tag: "catch",
        labels: labels}),
    visit_block(
      block3,
      context,
      {
        tag: "finally",
        labels: labels}))};

const check_dropped_1 = (weave, dropped, expression) => (
  dropped === null ?
  expression :
  weave.drop(expression, dropped));

const check_dropped_2 = (weave, dropped, expression) => (
  dropped === null ?
  Tree.sequence(
    expression,
    weave.primitive(void 0, node)) :
  expression);

const make_closure_callback = (tag) => (context, node, block, _identifier) => check_dropped_1(
  context.weave,
  context.dropped,
  (
    _identifier = context.namespace.fresh(),
    context.identifiers[context.identifiers.length] = _identifier,
    Tree.sequence(
      Tree.write(
        _identifier,
        context.weave.closure(
          tag,
          Tree[tag](
            visit_block(
              block,
              context,
              {
                tag: tag,
                labels: [],
                callee: _identifier})),
          node)),
      Tree.read(_identifier))));

const expression_callback_object = {
  __proto__: null,
  // Producer //
  primitive: (context, node, primitive) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.primitive(primitive, node)),
  function: make_closure_callback("function"),
  method: make_closure_callback("method"),
  constructor: make_closure_callback("constructor"),
  arrow: make_closure_callback("arrow"),
  import: (context, node, specifier, source) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.import(
      specifier,
      source,
      Tree.import(specifier, source),
      node)),
  read: (context, node, identifier) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.read(
      identifier,
      Tree.read(identifier),
      node)),
  builtin: (context, node, builtin) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.builtin(
      builtin,
      Tree.builtin(builtin),
      node)),
  // Consumer //
  throw: (context, node, expression) => Tree.throw(
    context.weave.throw(
      visit_expression(expression, context, null),
      node)),
  export: (context, node, specifier, expression) => check_dropped_2(
    context.weave,
    context.dropped,
    Tree.export(
      specifier,
      context.weave.export(
        specifier,
        visit_expression(expression, context, null),
        node))),
  write: (context, node, identifier, expression) => check_dropped_2(
    context.weave,
    context.dropped,
    Tree.write(
      identifier,
      context.weave.write(
        identifier,
        visit_expression(expression, context, null),
        node))),
  sequence: (context, node, expression1, expression2) => Tree.sequence(
    visit_expression(expression1, context, {dropped:node}),
    visit_expression(expression2, context, {dropped:context.dropped})),
  conditional: (context, node, expression1, expression2, expression3) => Tree.conditional(
    context.weave.test(
      visit_expression(expression1, context, null),
      node),
    visit_expression(expression2, context, {dropped:context.dropped}),
    visit_expression(expression3, context, {dropped:context.dropped})),
  // Consumer - Producer //
  eval: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.eval(
      Tree.eval(
        context.weave.code(
          visit_expression(expression, context, null),
          node)),
      node)),
  require: (context, node, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.require(
      Tree.require(
        context.weave.source(
          visit_expression(expression, context, null),
          node)),
      node)),
  // Combiner //
  object: (context, node, expression, properties) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.object(
      visit_expression(expression, context, null),
      ArrayLite.map(
        properties,
        (property) => [
          visit_expression(property[0], context, null),
          visit_expression(property[1], context, null)]),
      node)),
  unary: (context, node, operator, expression) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.unary(
      operator,
      visit_expression(expression, context, null),
      node)),
  binary: (context, node, operator, expression1, expression2) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.binary(
      operator,
      visit_expression(expression1, context, null),
      visit_expression(expression2, context, null),
      node)),
  construct: (context, node, expression, expressions) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.construct(
      visit_expression(expression, context, null),
      ArrayLite.map(
        expressions,
        (expression) => visit_expression(expression, context, null)),
      node)),
  apply: (context, node, expression1, expression2, expressions) => check_dropped_1(
    context.weave,
    context.dropped,
    context.weave.apply(
      visit_expression(expression1, context, null),
      visit_expression(expression2, context, null),
      ArrayLite.map(
        expressions,
        (expression) => visit_expression(expression, context, null)),
      node))};

// interface Context = {Source, Show, Serials, Pointcut, Namespace, Callee}
// type Serials = Map aran.Node Serial
// type Serial = Natural
// type Pointcut = ...
// type Show = Either aran.Label aran.Identifier => String
// type Namespace = (CalleeIdentifier, AdviceIdentifier, ParametersIdentifier)
// type CalleeIdentifier = () => aran.Identifier
// type AdviceIdentifier = aran.Identifier
// type ParametersIdentifier = aran.Identifier
module.exports = visit_program;

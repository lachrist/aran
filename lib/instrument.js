"use strict";

const ArrayLite = require("array-lite");
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

let is_primitive = null;
let is_read_error = null;
{
  const false_const = () => false;
  const is_primitive_callback_expression_object = {__proto__:null};
  const is_read_error_callback_expression_object = {__proto__:null};
  ArrayLite.forEach(
    [
      "require",
      "import",
      "primitive",
      "builtin",
      "arrow",
      "function",
      "constructor",
      "method",
      "read",
      "write",
      "sequence",
      "conditional",
      "throw",
      "eval",
      "apply",
      "construct",
      "unary",
      "binary",
      "object"],
    (tag) => {
      is_primitive_callback_expression_object[tag] = false_const;
      is_read_error_callback_expression_object[tag] = false_const;});
  is_primitive_callback_expression_object.primitive = () => true;
  is_read_error_callback_expression_object.read = (context, node, identifier) => identifier === "error";
  is_primitive = (expression) => Tree._dispatch_expression(is_primitive_callback_expression_object, null, expression);
  is_read_error = (expression) => Tree._dispatch_expression(is_read_error_callback_expression_object, null, expression);}

const inform = (expression) => (
  is_primitive(expression) ?
  Tree.Bundle([]) :
  Tree.Lift(expression));

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

const make_cut = (show, serials, pointcut, _converters) => (
  _converters = {
    __proto__: null,
    "node": (node) => global_Reflect_apply(global_Map_prototype_get, serials, [node]),
    "expression": (expression) => null,
    "key": (source) => key,
    "source": (source) => source,
    "primitive": (primitive) => primitive,
    "builtin": (builtin) => builtin,
    "parameters": (parameters) => ArrayLite.reduce(
      parameters,
      (object, parameter) => (
        object[show.identifier(parameter)] = null,
        object),
      {__proto__: null}),
    "tag": (tag) => tag,
    "label": show.label,
    "identifier": show.identifier,
    "operator": (operator) => operator,
    "property": (property) => [
      _converters.expression(property[0]),
      _converters.expression(property[1])],
    "expressions": (expressions) => ArrayLite.map(expressions, _converters.expression),
    "properties": (properties) => ArrayLite.map(properties, _converters.property),
    "identifiers": (identifiers) => ArrayLite.map(identifiers, _converters.identifier),
    "labels": (labels) => ArrayLite.map(labels, _converters.label)},
  (name, args, types) => (
    typeof pointcut[name] === "function" ?
    global_Reflect_apply(
      pointcut[name],
      pointcut,
      ArrayLite.map(
        types,
        (type, index) => _converters[type](args[index]))) :
    global_Boolean(pointcut[name])));

const make_trap = (show, serials, parameters_identifier, advice_identifier, _converters) => (
  _converters = {
    __proto__: null,
    "node": (node) => Tree.primitive(
      global_Reflect_apply(global_Map_prototype_get, serials, [node])),
    "expression": (expression) => expression,
    "source": (source) => Tree.primitive(source),
    "key": (key) => Tree.primitive(key),
    "primitive": (primitive) => Tree.primitive(primitive),
    "builtin": (builtin) => Tree.primitive(builtin),
    "tag": (tag) => Tree.primitive(tag),
    "parameters": (parameters) => (
      parameters.length === 0 ?
      Tree.object(
        Tree.primitive(null),
        []) :
      Tree.read(parameters_identifier)),
    "label": (label) => Tree.primitive(
      show.label(label)),
    "identifier": (identifier) => Tree.primitive(
      show.identifier(identifier)),
    "operator": (operator) => Tree.primitive(operator),
    "property": ({0:key_expression, 1:value_expression}) => Tree.apply(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      [
        _converters.expression(key_expression),
        _converters.expression(value_expression)]),
    "expressions": (expressions) => Tree.apply(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(expressions, _converters.expression)),
    "properties": (properties) => Tree.apply(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(properties, _converters.property)),
    "identifiers": (identifiers) => Tree.apply(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(identifiers, _converters.identifier)),
    "labels": (labels) => Tree.apply(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(labels, _converters.label))},
  (name, args, types, _expression, _parameters) => (
    _expression = Tree.apply(
      Tree.apply(
        Tree.builtin("Reflect.get"),
        Tree.primitive(void 0),
        [
          Tree.read(advice_identifier),
          Tree.primitive(name)]),
      Tree.read(advice_identifier),
      ArrayLite.map(
        types,
        (type, index) => _converters[type](args[index]))),
    (
      (
        name == "enter" &&
        args[2].length > 0) ?
      Tree.sequence(
        Tree.write(
          parameters_identifier,
          Tree.object(
            Tree.primitive(null),
            ArrayLite.map(
              args[2],
              (parameter) => [
                Tree.primitive(
                  show.identifier(parameter)),
                Tree.read(parameter)]))),
        ArrayLite.reduce(
          args[2],
          (expression, parameter) => Tree.sequence(
            expression,
            Tree.write(
              parameter,
              Tree.apply(
                Tree.builtin("Reflect.get"),
                Tree.primitive(void 0),
                [
                  Tree.read(parameters_identifier),
                  Tree.primitive(
                    show.identifier(parameter))]))),
              _expression)) :
      _expression)));

const pass = () => Tree.primitive(void 0);
const forward_first = (expression) => expression;
const forward_second = (_, expression) => expression;
const forward_first_primitive = (primitive) => Tree.primitive(primitive);
const combine_object = (prototype_expression, properties, node) => Tree.object(prototype_expression, properties);
const combine_apply = (callee_expression, this_expression, argument_expression_array) => Tree.apply(callee_expression, this_expression, argument_expression_array);
const combine_construct = (callee_expression, argument_expression_array) => Tree.construct(callee_expression, argument_expression_array);
const combine_binary = (operator, left_expression, right_expression, node) => Tree.binary(operator, left_expression, right_expression);
const combine_unary = (operator, argument_expression, node) => Tree.unary(operator, argument_expression);
const combine_require = (argument_expression, node) => Tree.require(argument_expression);

const make_weave = (cut, trap) => ArrayLite.reduce(
  [
    // Informers //
    ["enter", ["tag", "labels", "parameters", "identifiers", "node"], pass],
    ["completion", ["tag", "node"], pass],
    ["leave", ["tag", "node"], pass],
    ["continue", ["label", "node"], pass],
    ["break", ["label", "node"], pass],
    ["debugger", ["node"], pass],
    ["aggregate", ["source", "node"], pass],
    // Producers //
    ["primitive", ["primitive", "node"], forward_first_primitive],
    ["closure", ["tag", "expression", "node"], forward_second],
    ["builtin", ["builtin", "expression", "node"], forward_second],
    ["read", ["identifier", "expression", "node"], forward_second],
    ["import", ["source", "expression", "node"], forward_second],
    ["require", ["expression", "node"], forward_first],
    ["eval", ["expression", "node"], forward_first],
    // Consumers //
    ["drop", ["expression", "node"], forward_first],
    ["test", ["expression", "node"], forward_first],
    ["eval", ["expression", "node"], forward_first],
    ["write", ["identifier", "expression", "node"], forward_second],
    ["return", ["expression", "node"], forward_first],
    ["throw", ["expression", "node"], forward_first],
    ["failure", ["tag", "expression", "node"], forward_second],
    ["export", ["key", "expression", "node"], forward_second],
    ["source", ["expression", "node"], forward_first],
    ["code", ["expression", "node"], forward_first],
    // Combiners //
    ["object", ["expression", "properties", "node"], combine_object],
    ["unary", ["operator", "expression", "node"], combine_unary],
    ["binary", ["operator", "expression", "expression", "node"], combine_binary],
    ["construct", ["expression", "expressions", "node"], combine_construct],
    ["apply", ["expression", "expression", "expressions", "node"], combine_apply]],
  (weave, {0:name, 1:types, 2:closure}) => (
    weave[name] = (...args) => (
      cut(name, args, types) ?
      trap(name, args, types) :
      global_Reflect_apply(closure, void 0, args)),
    weave),
  {__proto__:null});

// type Block = aran.Block
// interface Context = {Source, Show, Serials, Pointcut, Namespace, Callee}
// type Serials = Map aran.Node Serial
// type Serial = Natural
// type Pointcut = ...
// type Show = Either aran.Label aran.Identifier => String
// type Namespace = (CalleeIdentifier, AdviceIdentifier, ParametersIdentifier)
// type CalleeIdentifier = () => aran.Identifier
// type AdviceIdentifier = aran.Identifier
// type ParametersIdentifier = aran.Identifier
module.exports = (block, context) => visit_block(
  {
    __proto__: {
      __proto__: null,
      weave: make_weave(
        make_cut(context.show, context.serials, context.pointcut),
        make_trap(context.show, context.serials, context.namespace.parameters, context.namespace.advice)),
      make_callee_identifier: context.namespace.callee,
      show: context.show},
    tag: context.source},
  block);

const visit_block = (block, context) => Tree._dispatch_block(
  block_callback_object,
  context,
  block);

const visit_expression = (expression, context) => Tree._dispatch_expression(
  expression_callback_object,
  context,
  expression);

const visit_statement = (statement, context) => Tree._dispatch_statement(
  statement_callback_object,
  context,
  expression);

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, identifiers, statements, _identifiers, _statements, _cut1, _cut2, _expression1, _expression2) => (
    _identifiers = ArrayLite.concat(identifiers),
    _statements = [
      (
        (
          context.tag === "script" ||
          context.tag === "module" ||
          context.tag === "global-eval") ?
        (
          _identifiers[_identifiers.length] = context.namespace.advice,
          _identifiers[_identifiers.length] = context.namespace.parameters,
          Tree.Lift(
            Tree.write(
              context.namespace.advice,
              Tree.Builtin("aran.advice")))) :
        Tree.Bundle([])),
      (
        context.callee === null ?
        Tree.Bundle([]) :
        Tree.Lift(
          Tree.write(
            "callee",
            Tree.read(context.callee)))),
      inform(
        context.weave.enter(
          context.tag,
          context.labels,
          parameter_array_object[context.tag],
          identifiers,
          node)),
      Tree.Bundle(
        ArrayLite.map(
          statements,
          (statement) => visit_statement(
            {
              __proto__: context,
              identifiers: _identifiers},
            statement))),
      inform(
        context.weave.completion(context.tag, node))],
    _expression1 = context.weave.failure(
      context.tag,
      Tree.read("error"),
      node),
    _expression2 = context.weave.leave(context.tag, node),
    (
      (
        is_read_error(_expression1) &&
        is_primitive(_expression2)) ?
      Tree.BLOCK(_identifiers, _statements) :
      Tree.BLOCK(
        [],
        [
          Tree.Try(
            [],
            Tree.BLOCK(_identifiers, _statements),
            Tree.BLOCK(
              [],
              [
                Tree.Lift(
                  Tree.throw(
                    _expression1))]),
            Tree.BLOCK(
              [],
              [
                inform(
                  _expression2)]))])))};

const statement_callback_object = {
  __proto__: null,
  Lift: (context, node, expression) => Tree.Lift(
    visit_expression(
      {
        __proto__: context,
        dropped: node},
      expression)),
  Export: (context, node, key, expression) => Tree.Export(
    key,
    context.weave.export(key, expression, node)),
  Aggregate: (context, source) => Tree.Bundle(
    [
      inform(
        context.weave.aggregate(source, node)),
      Tree.Aggregate(source)]),
  Break: (context, node, label) => Tree.Bundle(
    [
      inform(
        context.weave.break(label, node)),
      Tree.Break(label)]),
  Continue: (context, node, label) => Tree.Bundle(
    [
      inform(
        context.weave.continue(label, node)),
      Tree.Continue(label)]),
  Return: (context, node, argument_expression) => Tree.Return(
    context.weave.return(
      visit_expression(
        {
          __proto__: context,
          dropped: null},
        argument_expression),
      node)),
  Debugger: (context, node) => Tree.Bundle(
    [
      inform(
        context.weave.debugger(node)),
      Tree.Debugger()]),
  Lone: (context, node, labels, lone_block) => Tree.Lone(
    labels,
    visit_block(
      {
        __proto__: global_Reflect_getPrototypeOf(
          global_Reflect_getPrototypeOf(context)),
        tag: "lone",
        labels: labels,
        callee: null},
      lone_block)),
  While: (context, node, labels, test_expression, do_block) => Tree.While(
    labels,
    context.weave.test(
      visit_expression(
        {
          __proto__: context,
          dropped: null},
        test_expression),
      node),
    visit_block(
      {
        __proto__: global_Reflect_getPrototypeOf(
          global_Reflect_getPrototypeOf(context)),
        tag: "do",
        labels: labels,
        callee: null},
      do_block)),
  If: (context, node, labels, test_expression, then_block, else_block) => Tree.If(
    labels,
    context.weave.test(
      visit_expression(
        {
          __proto__: context,
          dropped: null},
        test_expression),
      node),
    visit_block(
      {
        __proto__: global_Reflect_getPrototypeOf(
          global_Reflect_getPrototypeOf(context)),
        tag: "then",
        labels: labels,
        callee: null},
      then_block),
    visit_block(
      {
        __proto__: global_Reflect_getPrototypeOf(
          global_Reflect_getPrototypeOf(context)),
        tag: "else",
        labels: labels,
        callee: null},
      else_block)),
  Try: (context, node, labels, try_block, catch_block, finally_block) => Tree.Try(
    labels,
    visit_block(
      {
        __proto__: global_Reflect_getPrototypeOf(
          global_Reflect_getPrototypeOf(context)),
        tag: "try",
        labels: labels,
        callee: null},
      try_block),
    visit_block(
      {
        __proto__: global_Reflect_getPrototypeOf(
          global_Reflect_getPrototypeOf(context)),
        tag: "catch",
        labels: labels,
        callee: null},
      catch_block),
    visit_block(
      {
        __proto__: global_Reflect_getPrototypeOf(
          global_Reflect_getPrototypeOf(context)),
        tag: "finally",
        labels: labels,
        callee: null},
      finally_block))};

const check_dropped = (weave, dropped, expression) => (
  dropped === null ?
  expression :
  weave.drop(expression, dropped));

const make_closure_callback = (tag) => (context, node, block, _identifier) => check_dropped(
  context.weave,
  context.dropped,
  (
    _identifier = context.make_callee_identifier(),
    context.identifiers[context.identifiers.length] = _identifier,
    Tree.sequence(
      Tree.write(
        _identifier,
        context.weave.closure(
          tag,
          Tree[tag](
            visit_block(
              {
                __proto__: global_Reflect_getPrototypeOf(
                  global_Reflect_getPrototypeOf(
                    global_Reflect_getPrototypeOf(context))),
                tag: tag,
                labels: [],
                callee: _identifier},
              block)),
          node)),
      Tree.read(_identifier))));

const expression_callback_object = {
  __proto__: null,
  // Producer //
  primitive: (context, node, primitive) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.primitive(primitive, node)),
  function: make_closure_callback("function"),
  method: make_closure_callback("method"),
  constructor: make_closure_callback("constructor"),
  arrow: make_closure_callback("arrow"),
  import: (context, node, source) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.import(
      source,
      Tree.import(source),
      node)),
  read: (context, node, identifier) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.read(
      identifier,
      Tree.read(identifier),
      node)),
  builtin: (context, node, builtin) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.builtin(
      builtin,
      Tree.builtin(builtin),
      node)),
  // Consumer //
  throw: (context, node, argument_expression) => Tree.throw(
    context.weave.throw(
      visit_expression(
        {
          __proto__:global_Reflect_getPrototypeOf(context),
          dropped: null},
        argument_expression),
      node)),
  write: (context, node, identifier, right_expression) => (
    context.dropped === null ?
    Tree.sequence(
      Tree.write(
        identifier,
        context.weave.write(
          identifier,
          visit_expression(
            {
              __proto__: global_Reflect_getPrototypeOf(context),
              dropped: null},
            right_expression),
          node)),
      context.weave.primitive(
        void 0,
        node)) :
    Tree.write(
      identifier,
      context.weave.write(
        identifier,
        visit_expression(
          {
            __proto__: global_Reflect_getPrototypeOf(context),
            dropped: null},
          right_expression),
        node))),
  sequence: (context, node, first_expression, second_expression) => Tree.sequence(
    visit_expression(
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        dropped: node},
      first_expression),
    visit_expression(
      context,
      second_expression)),
  conditional: (context, node, test_expression, consequent_expression, alternate_expression) => Tree.conditional(
    context.weave.test(
      visit_expression(
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: null},
        test_expression),
      node),
    visit_expression(
      context,
      consequent_expression),
    visit_expression(
      context,
      alternate_expression)),
  // Consumer - Producer //
  eval: (context, node, expression) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.eval(
      Tree.eval(
        context.weave.code(
          visit_expression(
            {
              __proto__: global_Reflect_getPrototypeOf(context),
              dropped: null},
            expression),
          node)),
      node)),
  require: (context, node, expression) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.require(
      Tree.require(
        context.weave.source(
          visit_expression(
            {
              __proto__: global_Reflect_getPrototypeOf(context),
              dropped: null},
            expression),
          node)),
      node)),
  // Combiner //
  object: (context, node, expression, properties) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.object(
      visit_expression(
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: null},
        expression),
      ArrayLite.map(
        properties,
        (property) => [
          visit_expression(
            {
              __proto__: global_Reflect_getPrototypeOf(context),
              dropped: null},
            property[0]),
          visit_expression(
            {
              __proto__: global_Reflect_getPrototypeOf(context),
              dropped: null},
            property[1])]),
      node)),
  unary: (context, node, operator, argument_expression) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.unary(
      operator,
      visit_expression(
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: null},
        argument_expression),
      node)),
  binary: (context, node, operator, left_expression, right_expression) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.binary(
      operator,
      visit_expression(
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: null},
        left_expression),
      visit_expression(
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: null},
        right_expression),
      node)),
  construct: (context, node, callee_expression, argument_expression_array) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.construct(
      visit_expression(
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: null},
        callee_expression),
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => visit_expression(
          {
            __proto__: global_Reflect_getPrototypeOf(context),
            dropped: null},
          argument_expression)),
      node)),
  apply: (context, node, callee_expression, this_expression, argument_expression_array) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.apply(
      visit_expression(
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: null},
        callee_expression),
      visit_expression(
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: null},
        this_expression),
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => visit_expression(
          {
            __proto__: global_Reflect_getPrototypeOf(context),
            dropped: null},
          argument_expression)),
      node))};

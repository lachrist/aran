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

const make_fresh = (namespace) => function () {
  let counter = 0;
  while (ArrayLite.includes(this.identifiers, namespace + "_" + this.depth + "_" + counter)) {
    counter++;
  }
  this.identifiers[this.identifiers.length] = namespace + "_" + this.depth + "_" + counter;
  return namespace + "_" + this.depth + "_" + counter;
};

const parameter_array_object = {
  __proto__: null,
  "program": ["this"],
  "eval": [],
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
    "primitive": (primitive) => primitive,
    "builtin": (builtin) => builtin,
    "parameters": (parameters) => ArrayLite.reduce(
      parameters,
      (object, parameter) => (
        object[show(parameter)] = null,
        object),
      {__proto__: null}),
    "tag": (tag) => tag,
    "label": show,
    "identifier": show,
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

const make_trap = (show, serials, parameters_namespace, advice_namespace, _converters) => (
  _converters = {
    __proto__: null,
    "node": (node) => Tree.primitive(
      global_Reflect_apply(global_Map_prototype_get, serials, [node])),
    "expression": (expression) => expression,
    "primitive": (primitive) => Tree.primitive(primitive),
    "builtin": (builtin) => Tree.primitive(builtin),
    "tag": (tag) => Tree.primitive(tag),
    "parameters": (parameters) => (
      parameters.length === 0 ?
      Tree.object(
        Tree.primitive(null),
        []) :
      Tree.read(parameters_namespace)),
    "label": (label) => Tree.primitive(
      show(label)),
    "identifier": (identifier) => Tree.primitive(
      show(identifier)),
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
          Tree.read(advice_namespace),
          Tree.primitive(name)]),
      Tree.read(advice_namespace),
      ArrayLite.map(
        types,
        (type, index) => _converters[type](args[index]))),
    (
      (
        name == "enter" &&
        args[2].length > 0) ?
      Tree.sequence(
        Tree.write(
          parameters_namespace,
          Tree.object(
            Tree.primitive(null),
            ArrayLite.map(
              args[2],
              (parameter) => [
                Tree.primitive(
                  show(parameter)),
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
                  Tree.read(parameters_namespace),
                  Tree.primitive(
                    show(parameter))]))),
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

const make_weave = (cut, trap) => ArrayLite.reduce(
  [
    // Informers //
    ["enter", ["tag", "labels", "parameters", "identifiers", "node"], pass],
    ["completion", ["tag", "node"], pass],
    ["leave", ["tag", "node"], pass],
    ["continue", ["label", "node"], pass],
    ["break", ["label", "node"], pass],
    ["debugger", ["node"], pass],
    // Producers //
    ["primitive", ["primitive", "node"], forward_first_primitive],
    ["closure", ["tag", "expression", "node"], forward_second],
    ["builtin", ["builtin", "expression", "node"], forward_second],
    ["read", ["identifier", "expression", "node"], forward_second],
    // Consumers //
    ["drop", ["expression", "node"], forward_first],
    ["test", ["expression", "node"], forward_first],
    ["eval", ["expression", "node"], forward_first],
    ["write", ["identifier", "expression", "node"], forward_second],
    ["return", ["expression", "node"], forward_first],
    ["throw", ["expression", "node"], forward_first],
    ["failure", ["tag", "expression", "node"], forward_second],
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

module.exports = (block, {local, serials, pointcut, show, namespaces}) => Tree.BLOCK(
  [],
  [
    Tree.Return(
      Tree.arrow(
        Tree.BLOCK(
          [namespaces.advice, namespaces.parameters],
          [
            Tree.Lift(
              Tree.write(
                namespaces.advice,
                Tree.apply(
                  Tree.builtin("Reflect.get"),
                  Tree.primitive(void 0),
                  [
                    Tree.read("arguments"),
                    Tree.primitive(0)]))),
            Tree.Lone(
              [],
              Tree._dispatch_block(
                block_callback_object,
                {
                  __proto__: {
                    __proto__: null,
                    weave: make_weave(
                      make_cut(show, serials, pointcut),
                      make_trap(show, serials, namespaces.parameters, namespaces.advice)),
                    fresh: make_fresh(namespaces.callee),
                    show: show },
                  depth: 0,
                  tag: local ? "eval" : "program",
                  labels: [],
                  callee: null},
                block))])))]);

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, identifiers, statements, _identifiers, _statements, _cut1, _cut2, _expression1, _expression2) => (
    _identifiers = ArrayLite.concat(identifiers),
    _statements = [
      (
        context.callee === null ?
        Tree.Bundle([]) :
        Tree.Lift(
          Tree.write(
            "callee",
            Tree.read(context.callee)))),
      Tree.Lift(
        context.weave.enter(
          context.tag,
          context.labels,
          parameter_array_object[context.tag],
          identifiers,
          node)),
      Tree.Bundle(
        ArrayLite.map(
          statements,
          (statement) => Tree._dispatch_statement(
            statement_callback_object,
            {
              __proto__: global_Reflect_getPrototypeOf(context),
              depth: context.depth + 1,
              identifiers: _identifiers},
            statement))),
      Tree.Lift(
        context.weave.completion(context.tag, node))],
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
                  context.weave.failure(
                    context.tag,
                    Tree.read("error"),
                    node)))]),
          Tree.BLOCK(
            [],
            [
              Tree.Lift(
                context.weave.leave(context.tag, node))]))]))};

const statement_callback_object = {
  __proto__: null,
  Lift: (context, node, expression) => Tree.Lift(
    Tree._dispatch_expression(
      expression_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        depth: context.depth,
        dropped: node,
        identifiers: context.identifiers},
      expression)),
  Break: (context, node, label) => Tree.Bundle(
    [
      Tree.Lift(
        context.weave.break(label, node)),
      Tree.Break(label)]),
  Continue: (context, node, label) => Tree.Bundle(
    [
      Tree.Lift(
        context.weave.continue(label, node)),
      Tree.Continue(label)]),
  Return: (context, node, argument_expression) => Tree.Return(
    context.weave.return(
      Tree._dispatch_expression(
        expression_callback_object,
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          depth: context.depth,
          dropped: null,
          identifiers: context.identifiers},
        argument_expression),
      node)),
  Debugger: (context, node) => Tree.Bundle(
    [
      Tree.Lift(
        context.weave.debugger(node)),
      Tree.Debugger()]),
  Lone: (context, node, labels, lone_block) => Tree.Lone(
    labels,
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        depth: context.depth,
        tag: "lone",
        labels: labels,
        callee: null},
      lone_block)),
  While: (context, node, labels, test_expression, do_block) => Tree.While(
    labels,
    context.weave.test(
      Tree._dispatch_expression(
        expression_callback_object,
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          depth: context.depth,
          dropped: null,
          identifiers: context.identifiers},
        test_expression),
      node),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        depth: context.depth,
        tag: "do",
        labels: labels,
        callee: null},
      do_block)),
  If: (context, node, labels, test_expression, then_block, else_block) => Tree.If(
    labels,
    context.weave.test(
      Tree._dispatch_expression(
        expression_callback_object,
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          depth: context.depth,
          dropped: null,
          identifiers: context.identifiers},
        test_expression),
      node),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        depth: context.depth,
        tag: "then",
        labels: labels,
        callee: null},
      then_block),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        depth: context.depth,
        tag: "else",
        labels: labels,
        callee: null},
      else_block)),
  Try: (context, node, labels, try_block, catch_block, finally_block) => Tree.Try(
    labels,
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        depth: context.depth,
        tag: "try",
        labels: labels,
        callee: null},
      try_block),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        depth: context.depth,
        tag: "catch",
        labels: labels,
        callee: null},
      catch_block),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        depth: context.depth,
        tag: "finally",
        labels: labels,
        callee: null},
      finally_block))};

const check_dropped = (weave, dropped, expression) => (
  dropped === null ?
  expression :
  weave.drop(expression, dropped));

const set_dropped = (context, dropped) => (
  (
    context.dropped === null &&
    dropped === null) ?
  context :
  {
    __proto__: global_Reflect_getPrototypeOf(context),
    depth: context.depth,
    dropped: dropped,
    identifiers: context.identifiers});

const make_closure_callback = (tag) => (context, node, block, _identifier) => check_dropped(
  context.weave,
  context.dropped,
  (
    _identifier = context.fresh(),
    Tree.sequence(
      Tree.write(
        _identifier,
        context.weave.closure(
          tag,
          Tree[tag](
            Tree._dispatch_block(
              block_callback_object,
              {
                __proto__: global_Reflect_getPrototypeOf(context),
                depth: context.depth,
                tag: tag,
                labels: [],
                callee: _identifier},
              block)),
          node)),
      Tree.read(_identifier))));

const expression_callback_object = {
  __proto__: null,
  // Producers //
  primitive: (context, node, primitive) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.primitive(primitive, node)),
  function: make_closure_callback("function"),
  method: make_closure_callback("method"),
  constructor: make_closure_callback("constructor"),
  arrow: make_closure_callback("arrow"),
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
  // Consumers //
  throw: (context, node, argument_expression) => Tree.throw(
    context.weave.throw(
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        argument_expression),
      node)),
  write: (context, node, identifier, right_expression) => (
    context.dropped === null ?
    Tree.sequence(
      Tree.write(
        identifier,
        context.weave.write(
          identifier,
          Tree._dispatch_expression(
            expression_callback_object,
            set_dropped(context, null),
            right_expression),
          node)),
      context.weave.primitive(
        void 0,
        node)) :
    Tree.write(
      identifier,
      context.weave.write(
        identifier,
        Tree._dispatch_expression(
          expression_callback_object,
          set_dropped(context, null),
          right_expression),
        node))),
  sequence: (context, node, first_expression, second_expression) => Tree.sequence(
    Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, node),
      first_expression),
    Tree._dispatch_expression(
      expression_callback_object,
      context,
      second_expression)),
  conditional: (context, node, test_expression, consequent_expression, alternate_expression) => Tree.conditional(
    context.weave.test(
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        test_expression),
      node),
    Tree._dispatch_expression(
      expression_callback_object,
      context,
      consequent_expression),
    Tree._dispatch_expression(
      expression_callback_object,
      context,
      alternate_expression)),
  eval: (context, node, expression) => check_dropped(
    context.weave,
    context.dropped,
    Tree.eval(
      context.weave.eval(
        Tree._dispatch_expression(
          expression_callback_object,
          set_dropped(context, null),
          expression),
        node))),
  // Combiners //
  object: (context, node, expression, properties) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.object(
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        expression),
      ArrayLite.map(
        properties,
        (property) => [
          Tree._dispatch_expression(
            expression_callback_object,
            set_dropped(context, null),
            property[0]),
          Tree._dispatch_expression(
            expression_callback_object,
            set_dropped(context, null),
            property[1])]),
      node)),
  unary: (context, node, operator, argument_expression) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.unary(
      operator,
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        argument_expression),
      node)),
  binary: (context, node, operator, left_expression, right_expression) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.binary(
      operator,
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        left_expression),
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        right_expression),
      node)),
  construct: (context, node, callee_expression, argument_expression_array) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.construct(
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        callee_expression),
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => Tree._dispatch_expression(
          expression_callback_object,
          set_dropped(context, null),
          argument_expression)),
      node)),
  apply: (context, node, callee_expression, this_expression, argument_expression_array) => check_dropped(
    context.weave,
    context.dropped,
    context.weave.apply(
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        callee_expression),
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        this_expression),
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => Tree._dispatch_expression(
          expression_callback_object,
          set_dropped(context, null),
          argument_expression)),
      node))};

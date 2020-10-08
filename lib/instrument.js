"use strict";

const ArrayLite = require("array-lite");
const Tree = require("./tree");

const global_Error = global.Error;
const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_toUpperCase = global.String.prototype.toUpperCase;
const global_String_prototype_substring = global.String.prototype.substring;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Boolean = global.Boolean;
const global_Object_assign = global.Object.assign;

// type BlockContext = (Weave, Calee, Tag, Labels)
// type StatementContext = (Weave, Identifers)
// type ExpressionContext = (Weave, Identifiers, Dropped)
//
// type Weave = (...)
// type Callee = Maybe Identifier
// type Dropped = Maybe aran.Node
// type Tag = Program | Eval | Function | Method | Constructor | Arrow | Lone | Do | Then | Else | Try | Catch | Finally
// type Identifiers = [Identifier]
// type Labels = [Label]

const fresh = (identifiers, base) => {
  let counter = 0;
  while (ArrayLite.includes(identifiers, base + counter)) {
    counter++;
  }
  identifiers[identifiers.length] = base + counter;
  return base + counter;
};

const parameter_array_object = {
  __proto__: null,
  "program": ["this"],
  "eval": [],
  "function": ["callee", "arguments", "new.target", "this"],
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
    "expression": (expression) => null,
    "primitive": (primitive) => primitive,
    "parameters": (identifier, parameters) => ArrayLite.reduce(
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
    "properties": (properties) => ArrayLite.map(properties, _converters.property),
    "identifiers": (identifier) => ArrayLite.map(identifier, _converters.identifier),
    "labels": (labels) => ArrayLite.map(labels, _converters.label)},
  (name, args, types) => (
    (typeof pointcut[name] === "function") ?
    global_Reflect_apply(
      pointcut[name],
      pointcut,
      ArrayLite.map(
        types,
        (type, index) => (
          type === "node" ?
          global_Reflect_apply(global_Map_prototype_get, serials, [args[index]]) :
          _converters[type](args[index])))) :
    global_Boolean(pointcut[name])));

const make_trap = (show, serials, identifier, _converters) => (
  _converters = {
    __proto__: null,
    "expression": (expression) => expression,
    "primitive": (primitive) => Tree.primitive(primitive),
    "tag": (tag) => Tree.primitive(tag),
    "parameters": (identifier, parameters) => Tree.read(identifier),
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
  (name, args, types) => Tree.apply(
    Tree.apply(
      Tree.builtin("Reflect.get"),
      Tree.primitive(void 0),
      [
        Tree.read(identifier),
        Tree.primitive(name)]),
    Tree.read(identifier),
    ArrayLite.map(
      types,
      (type, index) => (
        type === "node" ?
        Tree.primitive(
          global_Reflect_apply(global_Map_prototype_get, serials, [args[index]])) :
        _converters[type](args[index])))));

const forward_first = (expression) => expression;
const forward_second = (_, expression) => expression;
const forward_first_primitive = (primitive) => Tree.primitive(primitive);
const forward_first_read = (identifier) => Tree.read(identifier);
const forward_first_builtin = (builtin) => Tree.builtin(builtin);
const pass = () => Tree.primitive(void 0);
const combine_object = (prototype_expression, properties, node) => Tree.object(prototype_expression, properties, node);
const combine_apply = (callee_expression, this_expression, argument_expression_array) => Tree.apply(callee_expression, this_expression, argument_expression_array);
const combine_construct = (calle_expression, argument_expression_array) => Tree.construct(callee_expression, argument_expression_array);
const combine_binary = (operator, left_expression, right_expression, node) => Tree.binary(operator, left_expression1, right_expression);
const combine_unary = (operator, argument_expression, node) => Tree.unary(operator, argument_expression, node);

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
    ["builtin", ["builtin", "node"], forward_first_builtin],
    ["read", ["identifier", "node"], forward_first_read],
    // Consumers //
    ["drop", ["expression", "node"], forward_first],
    ["test", ["expression", "node"], forward_first],
    ["eval", ["expression", "node"], forward_first],
    ["write", ["identifer", "expression", "node"], forward_second],
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
          [namespaces.advice],
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
                  __proto__: null,
                  weave: make_weave(
                    make_cut(show, serials, pointcut),
                    make_trap(show, serials, namespaces.advice)),
                  namespaces: {
                    __proto__: null,
                    callee: namespaces.callee,
                    parameters
                  }
                  tag: local ? "eval" : "program",
                  labels: []},
                block))])))]);

// ExpressionContext -> ExpressionContext
// StatementContext -> ExpressionContext
const set_dropped = (object, dropped) => (
  object.dropped === dropped ?
  object :
  global_Object_assign(
    {__proto__:null},
    object,
    {
      __proto__: null,
      dropped: dropped}));

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, identifiers, statements, _identifiers, _identifier, _statements) => Tree.BLOCK(
    [],
    [
      Tree.Try(
        [],
        (
          _identifiers = ArrayLite.slice(identifiers, 0, identifiers.length - 1),
          _identifier = fresh(_identifiers, context.namespaces.parameters),
          _statements = ArrayLite.concat(
            [
              Tree.Lift(
                Tree.write(
                  _identifier,
                  Tree.object(
                    Tree.primitive(null),
                    ArrayLite.map(
                      parameter_array_object[context.tag],
                      (parameter) => [
                        Tree.primitive(show(parameter)),
                        Tree.read(
                          (
                            parameter === "callee" ?
                            context.callee : // console.assert(context.callee !== null)
                            parameter))])))),
              Tree.Lift(
                context.weave.enter(
                  context.tag,
                  context.labels,
                  [
                    _identifier,
                    parameter_array_object[context.tag]],
                  identifiers,
                  node))],
            ArrayLite.map(
              statements,
              (statement) => Tree._dispatch_statement(
                statement_callback_object,
                {
                  __proto__: null,
                  weave: context.weave,
                  identifiers: _identifiers},
                statement)),
            [
              Tree.Lift(
                context.weave.completion(context.tag, node))]),
          Tree.BLOCK(_identifiers, _statements)),
        Tree.BLOCK(
          [],
          [
            Tree.Lift(
              Tree.throw(
                context.weave.failure(
                  context.tag,
                  Tree.read("ERROR"),
                 node)))]),
        Tree.BLOCK(
          [],
          [
            Tree.Lift(
              context.weave.leave(context.tag, node))]))])};

const statement_callback_object = {
  __proto__: null,
  Lift: (context, node, expression, _x) => Tree.Lift(
    Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, node),
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
        set_dropped(context, null),
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
        __proto__: null,
        weave: context.weave,
        callee: null,
        tag: "lone",
        labels: labels},
      lone_block)),
  While: (context, node, labels, test_expression, do_block) => Tree.While(
    labels,
    context.weave.test(
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        test_expression),
      node),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: null,
        weave: context.weave,
        callee: null,
        tag: "do",
        labels: labels},
      do_block)),
  If: (context, node, labels, test_expression, then_block, else_block) => Tree.If(
    labels,
    context.weave.test(
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        test_expression),
      node),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: null,
        weave: context.weave,
        callee: null,
        tag: "then",
        labels: labels},
      then_block),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: null,
        weave: context.weave,
        callee: null,
        tag: "else",
        labels: labels},
      else_block)),
  Try: (context, node, labels, try_block, catch_block, finally_block) => Tree.Try(
    labels,
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: null,
        weave: context.weave,
        callee: null,
        tag: "try",
        labels: labels},
      try_block),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: null,
        weave: context.weave,
        callee: null,
        tag: "catch",
        labels: labels},
      catch_block),
    Tree._dispatch_block(
      block_callback_object,
      {
        __proto__: null,
        weave: context.weave,
        callee: null,
        tag: "finally",
        labels: labels},
      finally_block))};

const check_drop = (weave, dropped, expression) => (
  dropped === null ?
  expression :
  weave.drop(expression, dropped));

const make_closure_callback = (tag) => (context, node, block, _identifier) => check_drop(
  context.weave,
  context.dropped,
  (
    _identifier = fresh(context.identifiers, context.namespaces.callee),
    Tree.sequence(
      Tree.write(
        _identifier,
        context.weave.closure(
          tag,
          Tree[tag](
            Tree._dispatch_block(
              block_callback_object,
              {
                __proto__: null,
                weave: context.weave,
                callee: _identifier,
                tag: tag,
                labels: []},
              block),
            node))),
      Tree.read(_identifier))));

const expression_callback_object = {
  __proto__: null,
  // Producers //
  primitive: (context, node, primitive) => check_drop(
    context.weave,
    context.dropped,
    context.weave.primitive(primitive, node)),
  function: make_closure_callback("function"),
  method: make_closure_callback("method"),
  constructor: make_closure_callback("constructor"),
  arrow: make_closure_callback("arrow"),
  read: (context, node, identifier) => check_drop(
    context.weave,
    context.dropped,
    context.weave.read(identifier, node)),
  builtin: (context, node, builtin) => check_drop(
    context.weave,
    context.dropped,
    context.weave.builtin(builtin, node)),
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
    context.weave.write(
      identifier,
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        right_expression),
      node) :
    context.weave.primitive(
      context.weave.write(
        identifier,
        Tree._dispatch_expression(
          expression_callback_object,
          set_dropped(context, null),
          right_expression),
        node),
      node)),
  sequence: (context, node, first_expression, second_expression) => Tree.sequence(
    Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, node),
      first_expression),
    Tree._dispatch_expression(
      expression_callback_object,
      context,
      argument_expression)),
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
  // Combiners //
  unary: (context, node, operator, argument_expression) => check_drop(
    context.weave,
    context.dropped,
    context.weave.unary(
      operator,
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        argument_expression),
      node)),
  binary: (context, node, operator, left_expression, right_expression) => check_drop(
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
  construct: (context, node, callee_expression, argument_expression_array) => check_drop(
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
  apply: (context, node, callee_expression, this_expression, argument_expression_array) => check_drop(
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

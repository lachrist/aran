"use strict";

const ArrayLite = require("array-lite");
const Tree = require("./tree");

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

// const escape = (identifier) => (
//   global_Reflect_apply(global_RegExp_prototype_test, /^($)*CALLEE/) ?
//   "$" + identifier :
//   (
//     global_Reflect_apply(global_RegExp_prototype_test, /^($)*PARAMETERS/) ?
//       "$" + identifier :
//       identifier));



// exports._parameter_array_object = {
//   Lift: [null],
//   Return: [null],
//   Break: [null],
//   Continue: [null],
//   Debugger: [],
//   Bundle: [null],
//   Lone: [null, "lone"],
//   If: [null, "then", "else"],
//   While: [null, "do"],
//   Try: ["try", "catch", "finally"],
// };

// Lift: ["expression"],
// Return: ["expression"],
// Break: ["label"],
// Continue: ["label"],
// Debugger: [],
// Bundle: [["statement"]],
// // BlockFull //
// Lone: [["label"], "block"],
// If: [["label"], "expression", "block", "block"],
// While: [["label"], "expression", "block"],
// Try: [["label"], "block", "block", "block"]

// exports._parameter_array_object = {
//   __proto__: null,
//   "program": ["this"],
//   "eval": [],
//   "function": ["callee", "arguments", "new.target", "this"],
//   "method": ["callee", "arguments", "this"],
//   "constructor": ["callee", "arguments", "new.target"],
//   "arrow": ["callee", "arguments"],
//   "lone": [],
//   "do": [],
//   "then": [],
//   "else": [],
//   "try": [],
//   "catch": ["error"],
//   "finally": []
// };

const fresh = (identifiers, base) => {
  let counter = 0;
  while (ArrayLite.includes(identifiers, base + counter)) {
    counter++;
  }
  identifiers[identifiers.length] = base + counter;
  return base + counter;
};

const PARAMETERS_IDENTIIFIER = PARAMETERS_IDENTIFIER;
const ADVICE_IDENTIFIER = "ADVICE";

const PARAMETERS_OBJECT = {
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

const show_parameter = (parameter) => SHOW_PARAMETER[parameter];

const show_label = (label) => (
  Stratum._is_base(label) ?
  Stratum._get_body(label) :
  (
    (
      () => { throw new global_Error("Label is not base") })
    ()));

const show_identifier = (identifier) => (
  identifier in SHOW_PARAMETER ?
  SHOW_PARAMETER[identifier] :
  (
    Stratum._is_meta(identifier) ?
    "#" + Stratum._get_body(identifier) :
    (
      Stratum._is_base(identifier) ?
      Stratum._get_body(identifier) :
      (
        (
          () => { throw new global_Error("Identifier is neither a parameter nor base nor a meta") })
        ()))));

const cut_converter_object = {
  "expression": (expression) => null,
  "primitive": (primitive) => primitive,
  "parameters": (parameters) => ArrayLite.reduce(
    parameters,
    (object, parameter) => (
      object[parameter] = null,
      object),
    {__proto__: null}),
  "tag": (tag) => tag,
  "label": show_label,
  "identifier": show_identifier,
  "operator": (operator) => operator,
  "property": (property) => [
    cut_converter_object.expression(property[0]),
    cut_converter_object.expression(property[1])],
  "properties": (properties) => ArrayLite.map(properties, cut_converter_object.property),
  "identifiers": (identifier) => ArrayLite.map(identifier, cut_converter_object.identifier),
  "labels": (labels) => ArrayLite.map(identifier, cut_converter_object.identifier)};

const trap_converter_object = {
  __proto__: null,
  "expression": (expression) => expression,
  "primitive": (primitive) => Tree.primitive(primitive),
  "tag": (tag) => Tree.primitive(tag),
  "parameters": (parameters) => Tree.read(PARAMETERS_IDENTIFIER),
  "label": (label) => Tree.primitive(
    show_label(label)),
  "identifier": (identifier) => Tree.primitive(
    show_identifier(identifier)),
  "operator": (operator) => Tree.primitive(operator),
  "property": ({0:key_expression, 1:value_expression}) => Tree.apply(
    Tree.builtin("Array.of"),
    Tree.primitive(void 0),
    [
      trap_converter_object.expression(key_expression),
      trap_converter_object.expression(value_expression)]),
  "properties": (properties) => Tree.apply(
    Tree.builtin("Array.of"),
    Tree.primitive(void 0),
    ArrayLite.map(properties, trap_converter_object.property)),
  "identifiers": (identifiers) => Tree.apply(
    Tree.builtin("Array.of"),
    Tree.primitive(void 0),
    ArrayLite.map(identifiers, trap_converter_object.identifier)),
  "labels": (labels) => Tree.apply(
    Tree.builtin("Array.of"),
    Tree.primitive(void 0),
    ArrayLite.map(labels, trap_converter_object.label))};

const make_cut = (serials, pointcut) => (name, args, types) => (
  (typeof pointcut[name] === "function") ?
  global_Reflect_apply(
    pointcut[name],
    pointcut,
    ArrayLite.map(
      types,
      (type, index) => (
        type === "node" ?
        global_Reflect_apply(global_Map_prototype_get, serials, [args[index]]) :
        cut_converter_object[type](args[index])))) :
  global_Boolean(pointcut[name]));

const make_trap = (serials, namespace) => (name, args, types) => Tree.apply(
  Tree.apply(
    Tree.builtin("Reflect.get"),
    Tree.primitive(void 0),
    [
      Tree.builtin(namespace),
      Tree.primitive(name)]),
  Tree.builtin(namespace),
  ArrayLite.map(
    types,
    (type, index) => (
      type === "node" ?
      Tree.primitive(
        global_Reflect_apply(global_Map_prototype_get, serials, [args[index]])) :
      trap_converter_object[type](args[index]))));

const make_weave = (cut, trap) => ArrayLite.reduce(
  // Informers //
  [
    ["enter", ["tag", "labels", "parameters", "identifiers", "node"]],
    ["success", ["tag", "node"]],
    ["leave", ["tag", "node"]],
    ["continue", ["label", "node"]],
    ["break", ["label", "node"]],
    ["debugger", ["node"]]],
  (weave, {0:name, 1:types}) => (
    weave[name] = (...args) => (
      cut(name, args, types) ?
      trap(name, args, types) :
      Tree.primitive(void 0)),
    weave),
  ArrayLite.reduce(
    // Intercepters //
    [
      // Producers //
      ["primitive", ["primitive", "node"]],
      ["closure", ["tag", "expression", "node"]],
      ["builtin", ["builtin", "node"]],
      ["read", ["identifier", "node"]],
      // Consumers //
      ["drop", ["expression", "node"]],
      ["test", ["expression", "node"]],
      ["eval", ["expression", "node"]],
      ["write", ["identifer", "expression", "node"]],
      ["return", ["expression", "node"]],
      ["throw", ["expression", "node"]],
      ["failure", ["tag", "expression", "node"]]],
    (weave, {0:name, 1:types}) => (
      weave[name] = (...args) => (
        cut(name, args, types) ?
        trap(name, args, types) :
        (
          (name === "write" || name === "closure") ?
          convert[types[1]](args[1]) :
          convert[types[0]](args[0]))),
      weave),
    ArrayLite.reduce(
      // Combiners //
      [
        [
          "object",
          ["expression", "properties", "node"],
          (prototype_expression, properties, node) => Tree.object(prototype_expression, properties, node)],
        [
          "unary",
          ["operator", "expression", "node"],
          (operator, argument_expression, node) => Tree.unary(operator, argument_expression, node)],
        [
          "binary",
          ["operator", "expression", "expression", "node"],
          (operator, left_expression, right_expression, node) => Tree.binary(operator, left_expression1, right_expression)],
        [
          "construct",
          ["expression", "expressions", "node"],
          (calle_expression, argument_expression_array) => Tree.construct(callee_expression, argument_expression_array)],
        [
          "apply",
          ["expression", "expression", "expressions", "node"],
          (callee_expression, this_expression, argument_expression_array) => Tree.apply(callee_expression, this_expression, argument_expression_array)]],
      (weave, {0:name, 1:types, 1:closure}) => (
        weave[name] = (...args) => (
          cut(name, args, types) ?
          trap(name, args, types) :
          global_Relect_apply(closure, void 0, args)),
        weave),
      {__proto__:null})));

module.exports = (block, {tag, serials, pointcut, namespace}) => Tree.BLOCK(
  [],
  [
    Tree.Return(
      Tree.arrow(
        Tree.BLOCK(
          [ADVICE_IDENTIFIER],
          [
            Tree.Lift(
              Tree.write(
                ADVICE_IDENTIFIER,
                Tree.apply(
                  Tree.builtin("Reflect.get"),
                  Tree.primitive(void 0),
                  [
                    Tree.read(Tree._parameters["arguments"]),
                    Tree.primitive(0)]))),
            Tree.Lone(
              [],
              Tree._dispatch_block(
                block_callback_object,
                {
                  __proto__: null,
                  weave: make_weave(
                    make_cut(serials, pointcut),
                    make_trap(serials, namespace)),
                  tag: tag,
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
  BLOCK: (context, node, identifiers, statements, _identifiers, _statements) => Tree.BLOCK(
    [],
    [
      Tree.Try(
        [],
        (
          _identifiers = ArrayLite.concat([PARAMETERS_IDENTIFIER], identifiers),
          _statements = ArrayLite.concat(
            [
              Tree.Lift(
                Tree.write(
                  PARAMETERS_IDENTIFIER,
                  Tree.object(
                    Tree.primitive(null),
                    ArrayLite.map(
                      PARAMETERS_OBJECT[context.tag],
                      (parameter) => [
                        Tree.primitive(parameter),
                        Tree.read(
                          (
                            parameter === "callee" ?
                            context.callee : // console.assert(context.callee !== null)
                            Tree._parameters[parameter]))])))),
              Tree.Lift(
                context.weave.enter(
                  context.tag,
                  context.labels,
                  PARAMETERS_OBJECT[context.tag],
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
                context.weave.success(context.tag, node))]),
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
        context.weave.break(
          show_label(label),
          node)),
      Tree.Break(label)]),
  Continue: (context, node, label) => Tree.Bundle(
    [
      Tree.Lift(
        context.weave.continue(
          show_label(label),
          node)),
      Tree.continue(label)]),
  Return: (context, node, argument_expression) => Tree.Lift(
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
  If: (context, node, labels, test_expression, then_block, else_block2) => Tree.If(
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
  Try: (context, node, labels, try_block, catch_block, finally_block) => Tree.If(
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
    _identifier = fresh(context.identifiers, "CALLEE"),
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
    context.weave.read(
      show_identifier(identifier),
      node)),
  builtin: (context, node, builtin) => check_drop(
    context.weave,
    context.dropped,
    context.weave.builtin(builtin, node)),
  // Consumers //
  throw: (context, node, argument_expression) => context.weave.throw(
    Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, null),
      argument_expression),
    node),
  write: (context, node, identifier, right_expression) => (
    context.dropped === null ?
    context.weave.write(
      show_identifier(identifier),
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, null),
        right_expression),
      node) :
    context.weave.primitive(
      context.weave.write(
        show_identifier(identifier),
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

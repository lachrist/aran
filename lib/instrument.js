"use strict";

const ArrayLite = require("array-lite");
const Tree = require("./tree");

const global_Reflect_apply = global.Reflect.apply;
const global_String_prototype_toUpperCase = global.String.prototype.toUpperCase;
const global_String_prototype_substring = global.String.prototype.substring;
const global_Map_prototype_get = global.Map.prototype.get;
const global_Boolean = global.Boolean;

module.exports = (block, {tag, serials, pointcut, namespace}) => {
  const convert = {
    __proto__: null,
    "expression": (expression) => expression,
    "primitive": (primitive) => primitive,
    "node": (node) => Tree.primitive(
      global_Reflect_apply(
        global_Map_prototype_get,
        serials,
        [node])),
    "tag": (tag) => Tree.primitive(tag),
    "label": (label) => Tree.primitive(label),
    "identifier": (identifier) => Tree.primitive(identifier),
    "operator": (operator) => Tree.primitive(operator),
    "property": ({0:key_expression, 1:value_expression}) => Tree.apply(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      [
        convert.expression(key_expression),
        convert.expression(value_expression)]),
    "properties": (properties) => Tree.apply(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(
        properties,
        (property) => convert.property(property))),
    "identifiers": (identifiers) => Tree.appy(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(
        identifiers,
        (identifier) => convert.identifier(identifier))),
    "labels": (labels) => Tree.appy(
      Tree.builtin("Array.of"),
      Tree.primitive(void 0),
      ArrayLite.map(
        labels,
        (label) => convert.label(label)))};
  const cut = (name, args) => (
    (typeof pointcut[name] === "function") ?
    global_Reflect_apply(pointcut[name], pointcut, args) :
    global_Boolean(pointcut[name]));
  const trap = (name, args, types) => Tree.apply(
    Tree.apply(
      Tree.builtin("Reflect.get"),
      Tree.primitive(void 0),
      [
        Tree.read(namespace),
        Tree.primitive(name)]),
    Tree.read(namespace),
    ArrayLite.map(
      types,
      (type, index) => convert[type](args[index])));
  const weave = {__proto__: null};
  // Informers //
  weave.enter = (tag, labels, parameters, identifiers, node) => (
    cut("enter", [tag, labels, parameters, identifiers, node]) ?
    (
      parameters.length === 0 ?
      trap(
        "enter",
        [tag, labels, Tree.object(Tree.primitive(null), []), identifiers, node],
        ["tag", "labels", "expression", "identifiers", "node"]) :
      Tree.sequence(
        Tree.write(
          "PARAMETERS",
          Tree.object(
            Tree.primitive(null),
            ArrayLite.map(
              parameters[context.tag],
              (parameter) => [
                Tree.primitive(
                  show(parameter)),
                Tree.read(parameter)]))),
        ArrayLite.reduce(
          parameters[context.tag],
          (expression, parameter) => Tree.sequence(
            expression,
            Tree.write(
              parameter,
              Tree.apply(
                Tree.builtin("Reflect.get"),
                Tree.primitive(void 0),
                [
                  Tree.read("PARAMETERS"),
                  Tree.primitive(
                    show(parameter))]))),
          trap(
            "enter",
            [tag, labels, Tree.read("PARAMETERS"), identifiers, node],
            ["tag", "labels", "expression", "identifiers", "node"])))) :
    Tree.primitive(void 0));
  ArrayLite.forEach(
    [
      ["success", ["tag", "node"]],
      ["leave", ["tag", "node"]],
      ["continue", ["label", "node"]],
      ["break", ["label", "node"]],
      ["debugger", ["node"]]],
    ({0:name, 1:types}) => {
      weave[name] = (...args) => (
        cut(name, args) ?
        trap(name, args, types) :
        Tree.primitive(void 0));});
  // Intercepters //
  ArrayLite.forEach(
    [
      // Producers //
      ["primitive", ["primitive", "node"]],
      ["function", ["expression", "node"]],
      ["method", ["expression", "node"]],
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
    ({0:name, 1:types}) => {
      weave[name] = (...args) => (
        (console.log(name), cut(name, args)) ?
        trap(name, args, types) :
        (
          name === "write" ?
          convert[types[1]](args[1]) :
          convert[types[0]](args[0])));});
  // Combiners //
  ArrayLite.forEach(
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
    ({0:name, 1:types, 1:closure}) => {
      weave[name] = (...args) => (
        cut(name, args) ?
        trap(name, args, types) :
        global_Relect_apply(closure, void 0, args));});
  return visit_block(weave, tag, [], block);};

const visit_expression = (weave, dropped, expression) => Tree._dispatch_expression(
  expression_callback_object,
  {
    __proto__: null,
    weave,
    dropped},
  expression);

const visit_statement = (weave, statement) => Tree._dispatch_statement(
  statement_callback_object,
  {
    __proto__: null,
    weave},
  statement);

const visit_block = (weave, tag, labels, block) => Tree._dispatch_block(
  block_callback_object,
  {
    __proto__: null,
    weave,
    tag,
    labels},
  block);

const parameters = {
  __proto__: null,
  "program": ["THIS"],
  "eval": [],
  "function": ["NEW_TARGET", "THIS", "ARGUMENTS"],
  "method": ["THIS", "ARGUMENTS"],
  "lone": [],
  "then": [],
  "else": [],
  "while": [],
  "try": [],
  "catch": ["ERROR"],
  "finally": []};

const show_label = (label) => (
  Stratum._is_base(label) ?
  Stratum._body(label) :
  (
    (
      () => { throw new global_Error("Label is not a base label") })
    ()));

const show_identifier = (identifier) => (
  identifier === "NEW_TARGET" ?
  "@new.target" :
  (
    identifier === "THIS" ?
    "@this" :
    (
      identifier === "ERROR" ?
      "@error" :
      (
        identifier === "ARGUMENTS" ?
        "@arguments" :
        (
          Stratum._is_meta(identifier) ?
          "#" + Stratum._get_body(identifier) :
          (
            Stratum._is_base(identifier) ?
            Stratum._get_body(identifier) :
            (
              (
                () => { throw new global_Error("Identifier is not a parameter nor a meta identifier nor a base identifier") })
              ())))))));

const block_callback_object = {
  __proto__: null,
  BLOCK: (context, block, identifiers, statements) => Tree.BLOCK(
    [],
    [
      Tree.Try(
        Tree.BLOCK(
          (
            parameters[context.tag].length === 0 ?
            identifiers :
            ArrayLite.concat(["PARAMETERS"], identifiers)),
          ArrayLite.concat(
            [
              Tree.Lift(
                context.weave.enter(
                  context.tag,
                  context.label,
                  ArrayLite.map(parameters[context.tag], show_identifier),
                  ArrayLite.map(identifiers, show_identifier)))],
            ArrayLite.map(
              statements,
              (statement) => visit_statement(context.weave, statement)),
            [
              Tree.Lift(
                weave.success(context.tag, node))])),
        Tree.BLOCK(
          [],
          Tree.Lift(
            Tree.throw(
              weave.failure(
                context.tag,
                Tree.read("ERROR"),
                node)))),
        Tree.BLOCK(
          [],
          [
            Tree.Lift(
              weave.leave(context.tag, node))]))])};

const statement_callback_object = {
  __proto__: null,
  Lift: (context, statement, expression) => Tree.Lift(
    visit_expression(context.weave, statement, expression)),
  Break: (context, statement, label) => Tree.Bundle(
    [
      Tree.Lift(
        context.weave.break(
          show_label(label),
          statement)),
      statement]),
  Continue: (context, statement, label) => Tree.Bundle(
    [
      Tree.Lift(
        context.weave.continue(
          show_label(label),
          statement)),
      statement]),
  Return: (context, statement, argument_expression) => Tree.Bundle(
    [
      Tree.Lift(
        context.weave.return(
          visit_expression(context.weave, null, argument_expression),
          statement)),
      statement]),
  Debugger: (context, statement) => Tree.Bundle(
    [
      Tree.Lift(
        context.weave.debugger(statement)),
      statement]),
  Lone: (context, statement, labels, lone_block) => Tree.Lone(
    labels,
    visit_block(context.weave, "lone", labels, lone_block)),
  While: (context, statement, labels, test_expression, do_block) => Tree.While(
    labels,
    context.weave.test(
      visit_expression(context.weave, null, test_expression)),
    visit_block(context.weave, "do", labels, do_block)),
  If: (context, statement, labels, test_expression, then_block, else_block2) => Tree.If(
    labels,
    context.weave.test(
      visit_expression(context.weave, null, test_expression),
      statement),
    visit_block(context.weave, "then", labels, then_block),
    visit_block(context.weave, "else", labels, else_block)),
  Try: (context, statement, labels, try_block, catch_block, finally_block) => Tree.If(
    labels,
    visit_block(context.weave, "try", labels, try_block),
    visit_block(context.weave, "catch", labels, catch_block),
    visit_block(context.weave, "finally", labels, finally_block))}

const check_drop = (weave, dropped, expression) => (
  dropped === null ?
  expression :
  weave.drop(expression, dropped));

const expression_callback_object = {
  __proto__: null,
  // Producers //
  primitive: (context, expression, primitive) => check_drop(
    context.weave,
    context.dropped,
    context.weave.primitive(primitive, expression)),
  function: (context, expression, block) => check_drop(
    context.weave,
    context.dropped,
    context.weave.function(
      visit_block(context.weave, "function", [], block),
      expression)),
  method: (context, expression, block) => check_drop(
    context.weave,
    context.dropped,
    context.weave.method(
      visit_block(context.weave, "method", [], block),
      expression)),
  read: (context, expression, identifier) => check_drop(
    context.weave,
    context.dropped,
    context.weave.read(
      show_identifier(identifier),
      expression)),
  builtin: (context, expression, builtin) => check_drop(
    context.weave,
    context.dropped,
    context.weave.builtin(builtin, expression)),
  // Consumers //
  throw: (context, expression, argument_expression) => context.weave.throw(
    visit_expression(context.weave, null, argument_expression),
    expression),
  write: (context, expression, identifier, right_expression) => (
    context.dropped === null ?
    context.weave.write(
      show_identifier(identifier),
      visit_expression(context.weave, null, right_expression),
      expression) :
    context.weave.primitive(
      context.weave.write(
        show_identifier(identifier),
        visit_expression(context.weave, right_expression, null),
        expression),
      expression)),
  sequence: (context, expression, first_expression, second_expression) => Tree.sequence(
    visit_expression(context.weave, expression, first_expression),
    visit_expression(context.weave, context.dropped, second_expression)),
  conditional: (context, expression, test_expression, consequent_expression, alternate_expression) => Tree.conditional(
    context.weave.test(
      visit_expression(context.weave, test_expression, null),
      expression),
    visit_expression(context.weave, context.dropped, consequent_expression),
    visit_expression(context.weave, context.dropped, alternate_expression)),
  // Combiners //
  unary: (context, expression, operator, argument_expression) => check_drop(
    context.weave,
    context.dropped,
    context.weave.unary(
      operator,
      visit_expression(context.weave, null, argument_expression))),
  binary: (context, expression, operator, left_expression, right_expression) => check_drop(
    context.weave,
    context.dropped,
    context.weave.binary(
      operator,
      visit_expression(context.weave, null, left_expression),
      visit_expression(context.weave, null, right_expression))),
  construct: (context, expression, callee_expression, argument_expression_array) => check_drop(
    context.weave,
    context.dropped,
    context.weave.construct(
      visit_expression(context.weave, null, callee_expression),
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => visit_expression(context.weave, null, argument_expression)))),
  apply: (context, callee_expression, this_expression, argument_expression_array) => check_drop(
    context.weave,
    context.dropped,
    context.weave.apply(
      visit_expression(context.weave, null, callee_expression),
      visit_expression(context.weave, null, this_expression),
      ArrayLite.map(
        argument_expression_array,
        (argument_expression) => visit_expression(context.weave, null, argument_expression))))};

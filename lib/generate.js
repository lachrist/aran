"use strict";

const extract_block_callback_object = {
  __proto__: null,
  BLOCK: (context, node, identifiers, statements) => (
    identifiers.length === 0 ?
};
const extract_block = (block) => Tree._dispatch_block()

const extract_return_argument = (statement) => {};

module.exports = (block, builtin) => ({
  type: "Program",
  body: [
    {
      type: "FunctionExpression",
      async: false,
      generator: false,
      expression: false,
      params: [
        {
          type: "Identifier",
          name: builtin}],
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
                name: "eval"},
              right: {
                type: "MemberExpression",
                optional: false,
                computed: false,
                object: {
                  type: "Identifier",
                  name: builtin},
                property: {
                  type: "Identifier",
                  name: "eval"}}}},


            }
          }
        ]}
  }]

});

const extract_throw_argument_expression_callback_object = {
  __proto__: null_callback_prototype,
  throw: (node, context, expression) => expression};

const extract_identifiers_block_callback_object = {
  __proto__: null,
  BLOCK: (node, context, identifiers, statements) => identifiers};

const statement_callback_object = {
  __proto__: null,
  Lift: (context, node, expression, _nullable_expression) => (
    _nullable_expression = Tree._dispatch_expression(
      extract_throw_argument_expression_callback_object,
      null,
      expression),
    (
      _nullable_expression === null ?
      {
        type: "ExpressionStatement",
        expression: Tree._dispatch_expression(
          expression_callback_object,
          {
            __proto__: global_Reflect_getPrototypeOf(context),
            dropped: true},
          expression)} :
      {
        type: "ThrowStatement",
        argument: Tree._dispatch_expression(
          expression_callback_object,
          {
            __proto__: global_Reflect_getPrototypeOf(context),
            dropped: false},
          expression)})),
  Return: (context, node, expression) => ({
    type: "ReturnStatement",
    argument: expression: Tree._dispatch_expression(
      expression_callback_object,
      {
        __proto__: global_Reflect_getPrototypeOf(context),
        dropped: false},
      expression)}),
  Break: (context, node, label) => ({
    type: "BreakStatement",
    label: {
      type: "Identifier",
      name: context.show.label(label)}}),
  Continue: (context, node, label) => ({
    type: "ContinueStatement",
    label: {
      type: "Identifier",
      name: context.show.label(label)}}),
  Debugger: (context, node) => ({
    type: "DebuggerStatement"}),
  // BlockFull //
  Lone: (context, node, labels, block) => (
    (
      labels.length === 0 &&
      Tree._dispatch_block(extract_identifiers_block_callback_object, null, block).length === 0) ?
    (
      Tree._dispatch_block(extract_statements_block_callback_object, null, block).length === 0 ?
      {
        type: "EmptyStatement"} :
      (
        Tree._dispatch_block(extract_statements_block_callback_object, null, block).length === 1 ?



    labelize(
    labels,
    Tree._dispatch_block(block_callback_object, context, block)),
  If: (context, node, labels, expression, block1, block2) => labelize(
    labels,
    {
      type: "IfStatement",
      test: Tree._dispatch_expression(
        expression_callback_object,
        callback_object,
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: false},
        expression),
      consequent: Tree._dispatch_block(block_callback_object, context, block1),
      alternate: (
        Tree._dispatch_block(extract_statements_block_callback_object, null, block2).length === 0 ?
        null :
        Tree._dispatch_block(block_callback_object, context, block2))}),
  While: (context, node, labels, expression, block) => labelize(
    labels,
    {
      type: "WhileStatement",
      test: Tree._dispatch_expression(
        expression_callback_object,
        callback_object,
        {
          __proto__: global_Reflect_getPrototypeOf(context),
          dropped: false},
        expression),
      body: Tree._dispatch_block(block_callback_object, context, block1)}),
  Try: (context, node, labels, block1, block2, block3, _statements) => labelize(
    labels,
    (
      _boolean1 = (
        _statements = Tree._dispatch_block(extract_statements_block_callback_object, null, block2),
        (
          statements.length === 1 &&
          (
            _nullable_expression = Tree._dispatch_statement(extract_lift_argument_statement_callback_object, null, _statements[0]),
            (
              _nullable_expression !== null &&
              (
                _nullable_expression = Tree._dispatch_expression(extract_throw_argument_expression_callback_object, null, _nullable_expression),
                (
                  _nullable_expression !== null &&
                  Tree._dispatch_expression(extract_read_identifier_expression_callback_object, null, _nullable_expression) === "error")))))),
      _boolean2 = Tree._dispatch_block(extract_statements_block_callback_object, null, block3).length === 0,
      (
        _boolean1 && _boolean2 ?
        Tree._dispatch_block(block_callback_object, context, block1) :
        {
          type: "TryStatement",
          block: Tree._dispatch_block(block_callback_object, context, block1),
          handler: (
            _boolean1 ?
            null :
            {
              type: "CatchClause",
              param: {
                type: "Identifier",
                name: show("error")},
              body: Tree._dispatch_block(block_callback_object, context, block2)}),
          finally: (
            __boolean2 ?
            null :
            Tree._dispatch_block(block_callback_object, context, block3))})))};

const expression_callback_object = {
  __proto__: null,
  // Producer //
  primitive: (context, node, primitive) => (
    primitive === void 0 ?
    {
      type: "UnaryExpression",
      operator: "void",
      argument: {
        type: "Literal",
        value: 0}} :
    {
      type: "Literal",
      value: primitive}),
  builtin: (context, node, builtin) => ({
    type: "MemberExpression",
    computed: true,
    optional: false,
    object: {
      type: "Identifier",
      name: context.builtin},
    property: {
      type: "Literal",
      value: builtin}}),
  read: (context, node, identifier) => ({
    type: "Identifier",
    name: context.show(identifier)}),
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
        set_dropped(context, false),
        expression)]}),
  write: (context, node, identifier, expression, _estree) => (
    _estree = {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "Identifier",
        name: show(identifier)},
      right: Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, false),
        expression)},
    (
      context.dropped ?
      _expression :
      {
        type: "SequenceExpression",
        expressions: [
          _estree,
          {
            type: "UnaryExpression",
            operator: "void",
            argument: {
              type: "Literal",
              value: 0}}]})),
  conditional: (context, node, identifier, expression1, expression2, expression3) => ({
    type: "ConditionalExpression",
    test: Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, false),
      expression1),
    consequent: Tree._dispatch_expression(
      expression_callback_object,
      context,
      expression2),
    alternate: Tree._dispatch_expression(
      expression_callback_object,
      context,
      expression)}),
  sequence: (context, node, expression1, expression2) => ({
    type: "SequenceExpression",
    expressions: [
      Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, true),
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
              context,
              expression2)}]}},
    arguments: []}),
  // Combiner //
  unary: (context, node, operator, expression) => ({
    type: "UnaryExpression",
    operator: operator,
    argument: Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, false),
      expression)}),
  binary: (context, node, operator, expression) => ({
    type: "UnaryExpression",
    operator: operator,
    left: Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, false),
      expression1),
    right: Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, false),
      expression2)}),
  object: (context, node, expression, properties) => ({
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
          value: Tree._dispatch_expression(
            expression_callback_object,
            set_dropped(context, false),
            expression)}],
      ArrayLite.map(
        properties,
        (property) => {
          type: "Property",
          kind: "init",
          shorthand: false,
          computed: true,
          method: false,
          key: Tree._dispatch_expression(
            expression_callback_object,
            set_dropped(context, false),
            property[0]),
          value: Tree._dispatch_expression(
            expression_callback_object,
            set_dropped(context, false),
            property[1])}))}),
  construct: (context, node, expression, expressions) => ({
    type: "NewExpression",
    callee: Tree._dispatch_expression(
      expression_callback_object,
      set_dropped(context, false),
      expression),
    arguments: ArrayLite.map(
      expressions,
      (expression) => Tree._dispatch_expression(
        expression_callback_object,
        set_dropped(context, false),
        expression))}),
  apply: (context, node, expression1, expression2, expressions) => ()};



  const builtin = (expression) => (
    (
      expression.type === "MemberExpression" &&
      expression.computed &&
      expression.object.type === "Identifier" &&
      expression.object.name === "builtins" &&
      expression.property.type === "Literal" &&
      typeof expression.property.value === "string") ?
    expression.property.value :
    null);

  const builtin = (node) => {
    if (node.type === "MemberExpression" && )
  };

  function expression (node) {
    switch (node) {
      case: "CallExpression":
        const bname = builtin(node);
        if (bname === "Reflect.apply") {
          if ()
        }
      case: "MemberExpression":
        if (node.object.)
        break;
    }
  };




const builtin = (expression) => (
  (
    expression.type === "MemberExpression" &&
    expression.computed &&
    expression.object.type === "Identifier" &&
    expression.object.name === "builtins" &&
    expression.property.type === "LiteralExpression" &&
    typeof expression.property.value === "string") ?
  expression.property.value :
  null);

const isundefined = (expression) => (
  expression.type === "UnaryExpression" &&
  expression.operator = "void" &&
  expression.argument.type === "LiteralExpression")

const elements = (expression) => (
  expression.type === "CallExpression" &&
  builtin(expression.callee) === "Reflect.apply" &&
  expression.arguments.length === 3 &&
  builtin(expression.arguments[0]) === "Array.of" &&
  pure(expression.arguments[1]) &&

exports.apply = (expression, expressions) => (
  (
    builtin(expression) === "Reflect.apply" &&
    expressions.length === 3 &&
    isundefined(expressions[1]) &&





      if (expression2[0] === "primitive" && expression2[1] === void 0) {
        if (expression1[0] === "builtin" && expression1[1] === "Array.of") {
          return {
            type: "ArrayExpression",
            elements: ArrayLite.map(expressions, (expression) => {
              return Visit.expression(expression, namespace);
            })
          };
        }
        if (expression1[0] === "builtin" && expression1[1] === "Object.fromEntries" && expressions.length === 1) {
          const node = Visit.expression(expressions[0], namespace);
          if (node.type === "ArrayExpression" && ArrayLite.every(node.elements, (node) => node.type === "ArrayExpression" && node.elements.length === 2)) {
            return {
              type: "ObjectExpression",
              properties: ArrayLite.map(node.elements, (node) => ({
                type: "Property",
                kind: "init",
                computed: true,
                key: node.elements[0],
                value: node.elements[1]
              }))
            };
          }
        }
        if (expression1[0] === "builtin" && expression1[1] === "Reflect.get" && expressions.length === 2) {
          return {
            type: "MemberExpression",
            computed: true,
            object: Visit.expression(expressions[0], namespace),
            property: Visit.expression(expressions[1], namespace)
          };
        }
        let node = Visit.expression(expression1, namespace);
        if (node.type === "MemberExpression") {
          node = {
            type: "SequenceExpression",
            expressions: [{
              type: "Literal",
              value: null
            }, node]
          };
        }
        return {
          type: "CallExpression",
          callee: node,
          arguments: ArrayLite.map(expressions, (expression) => {
            return Visit.expression(expression, namespace)
          })
        };
      }
      const node = Visit.expression(expression1, namespace);
      if (expression2[0] === "read" && typeof expression2[1] === "number") {
        if (node.type === "MemberExpression" && node.object.type === "read" && node.object.name === Sanitize(expression2[1])) {
          return {
            type: "CallExpression",
            callee: node,
            arguments: ArrayLite.map(expressions, (expression) => {
              return Visit.expression(expression, namespace);
            })
          };
        }
      }
      return {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          computed: true,
          object: {
            type: "MemberExpression",
            computed: false,
            object: {
              type: "Identifier",
              name: namespace },
            property: {
              type: "Identifier",
              name: "builtins"}},
          property: {
            type: "Literal",
            value: "Reflect.apply"}},
        arguments: [node, Visit.expression(expression2), {
          type: "ArrayExpression",
          elements: ArrayLite.map(expressions, (expression) => {
            return Visit.expression(expression, namespace);
          })
        }]
      };
    };

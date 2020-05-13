
f(global ; 1, 2, 3)


exports.BLOCK = parse_block;
exports.expression = parse_expression;
exports.Statement = parse_statement;

const parse_expression = (node) => {
  if (node.type in expressions) {
    return expressions[node.type](node);
  }
  throw new global_Error();
};

const parse_statement = (labels) => (node) => {
  if (node.type in statements) {
    return statements[node.type](labels, nodes);
  }
  throw new global_Error();
};

const parse_block = (node) => {
  if (node.body.length === 0) {
    return Build.BLOCK([], []);
  }
  if (node.body[0].type === "VariableDeclaration") {
    if (node.body[0].kind !== "let") {
      throw new global_Error();
    }
    for (let index = 0; index < node.body[0].declarations.length; index++) {
      if (node.body[0].declarations[index].init !== null) {
        throw new global_Error();
      }
    }
    return Build.BLOCK(ArrayLite.map(node.body[0].declarations, (declaration) => declaration.id.name, ArrayLite.map(ArrayLite.filter(node.body, (node, index) => index > 0), make_parse_statement([]))));
  }
  return Build.BLOCK([], ArrayLite.map(node.body, parse_statement([])));
};

const statements = {
  ExpressionStatement: (labels, node) => {
    if (labels.length > 0) {
      throw new global_Error();
    }
    Build.Expression(parse_expression(node.expression));
  },
  ReturnStatement: (labels, node) => {
    if (labels.length > 0) {
      throw new global_Error();
    }
    if (node.argument === null) {
      throw new global_Error();
    }
    return Build.Return(parse_expression(node.argument));
  },
  BreakStatement: (labels, node) => {
    if (labels.length > 0) {
      throw new global_Error();
    }
    if (node.label === null) {
      throw new global_Error();
    }
    return Build.Break(node.label.name);
  },
  ContinueStatement: (labels, node) => {
    if (labels.length > 0) {
      throw new global_Error();
    }
    if (node.label === null) {
      throw new global_Error();
    }
    return Build.Break(node.label.name);
  },
  DebuggerStatement: (node) => {
    if (labels.length > 0) {
      throw new global_Error();
    }
    return Build.Debugger();
  },
  LabeledStatement: (labels, node) => {
    return make_parse_statement(ArrayLite.concat(labels, [node.label.name]))(node.body);
  },
  BlockStatement: (labels, node) => {
    return Build.Lone(labels, parse_block(node));
  },
  IfStatement: (node) => {
    if (node.consequent.type !== "BlockStatement") {
      throw new global_Error();
    }
    if (node.alternate === null) {
      throw new global_Error();
    }
    if (node.alternate.type !== "BlockStatement") {
      throw new global_Error();
    }
    return Build.If(labels, parse_expression(node.test), parse_block(node.consequent))
  },
  WhileStatement: (labels, node) => {
    if (node.body.type !== "BlockStatement") {
      throw new global_Error();
    }
    return Build.While(labels, parse_block(node.body));
  },
  TryStatement: (labels, node) => {
    if (node.handler === null) {
      throw new global_Error();
    }
    if (node.handler.param === null) {
      throw new global_Error();
    }
    if (node.handler.param.type !== "Identifier") {
      throw new global_Error();
    }
    if (node.handler.param.name !== "ERROR") {
      throw new global_Error();
    }
    if (node.finalize === null) {
      throw new global_Error();
    }
    return Build.Try(labels, parse_block(node.block), parse_block(node.handler.body), parse_block(node.finalizer));
  }
};

const expresssions = {
  __proto__: null,
  Literal: (node) => Build.primitive(node),
  MemberExpression: (node) => {
    if (!node.computed) {
      throw new global_Error("!node.computed");
    }
    if (node.object.type !== "Identifier") {
      throw new global_Error("node.object.type !== \"Identifier\"");
    }
    if (node.object.name !== "root") {
      throw new global_Error("node.object.name !== \"root\"");
    }
    if (node.property.type !== "Literal") {
      throw new global_Error("node.property.type !== \"Literal\"");
    }
    if (typeof node.property.value !== "string") {
      throw new global_Error("root >> property >> not string literal");
    }
    return Build.builtin(node.property.value);
  },
  ArrowFunctionExpression: (node) => {
    if (node.expression) {
      throw new global_Error("");
    }
    // console.assert(node.body.type === "BlockStatement");
    if (node.generator) {
      throw new global_Error("");
    }
    if (node.async) {
      throw new global_Error("");
    }
    if (node.params.length !== 1) {
      throw new global_Error("");
    }
    if (node.params[0].type !== "RestElement") {
      throw new global_Error("");
    }
    if (node.params[0].argument.type !== "Identifier") {
      throw new global_Error("");
    }
    if (node.params[0].argument.type !== "Identifier") {
      throw new global_Error("");
    }
    return Build.arrow(parse_block(node.body));
  },
  FunctionExpression: ({params:pattern_array, id:nullable_pattern, body:block_statement, generator:boolean1, async:boolean2}) => {
    // Top //
    if (node.id !== null) {
      throw new global_Error("");
    }
    if (node.generator) {
      throw new global_Error("");
    }
    if (node.async) {
      throw new global_Error("");
    }
    // ARGUMENTS //
    if (node.params.length !== 1) {
      throw new global_Error("");
    }
    if (node.params.type !== "RestElement") {
      throw new global_Error("");
    }
    if (node.params[0].argument.type !== "Identifier") {
      throw new global_Error("");
    }
    if (node.params[0].argument.name !== "ARGUMENTS") {
      throw new global_Error("");
    }
    // NEW_TARGET && THIS //
    if (node.body.body.length !== 2) {
      throw new global_Error("");
    }
    if (node.body.body[0].type !== "VariableDeclaration") {
      throw new global_Error("");
    }
    if (node.body.body[0].kind !== "let") {
      throw new global_Error("");
    }
    if (node.body.body[0].declarations.length !== 2) {
      throw new global_Error("");
    }
    // NEW_TARGET //
    if (node.body.body[0].declarations[0].id.type !== "Identifier") {
      throw new global_Error("");
    }
    if (node.body.body[0].declarations[0].id.name !== "NEW_TARGET") {
      throw new global_Error("");
    }
    if (node.body.body[0].declarations[0].id.init === null) {
      throw new global_Error("");
    }
    if (node.body.body[0].declarations[0].id.type !== "MetaProperty") {
      // console.assert(node.body.body[0].declarations[0].id.meta.name === "new");
      // console.assert(node.body.body[0].declarations[0].id.property.name === "target");
      throw new global_Error("");
    }
    // THIS //
    if (node.body.body[0].declarations[1].id.type !== "Identifier") {
      throw new global_Error("");
    }
    if (node.body.body[0].declarations[1].id.name !== "NEW_TARGET") {
      throw new global_Error("");
    }
    if (node.body.body[0].declarations[1].id.init === null) {
      throw new global_Error("");
    }
    if (node.body.body[0].declarations[1].id.type !== "ThisExpression") {
      throw new global_Error("");
    }
    // BODY //
    if (block_statement.body[1].type !== "BlockStatement") {
      throw new global_Error("");
    }
    // Return //
    return Build.function(parse_block(block_statement.body[1]));
  },
  Identifier: ({name:identifier}) => Build.read(identifier),
  SequenceExpression: (node) => {
    if (node.expressions.length !== 2) {
      throw new global_Error();
    }
    if (node.expressions[0].type === "AssignmentExpression") {
      if (node.expressions[0].operator !== "=") {
        throw new global_Error()
      }
      if (node.expressions[0].left.type !== "Identifier") {
        throw new global_Error();
      }
      if (node.expressions[1].type !== "UnaryExpression") {
        throw new global_Error();
      }
      if (node.expressions[1].operator !== "void") {
        throw new global_Error();
      }
      if (node.expressions[1].argument.type !== "Literal") {
        throw new global_Error();
      }
      if (node.expressions[1].argument.value !== 0) {
        throw new global_Error();
      }
      return Build.write(node.expressions[0].left.name, parse_expression(node.expressions[0].right));
    }
    return Build.sequence(parse_expression(node.expressions[0]), parse_expression(node.expressions[1]));
  },
  ConditionalExpression: (node) => {
    return Build.conditional(parse_expression(node.test), parse_expression(node.consequent), parse_expression(node.alternate));
  },
  UnaryExpression: (node) => {
    if (node.operator === "delete") {
      throw new global_Error();
    }
    return Build.unary(node.operator, parse_expression(node.argument))
  },
  BinaryExpression: (node) => {
    return Build.binary(node.operator, parse_expression(node.left), parse_expression(node.right));
  },
  ApplyExpression: (node) => {
    if (node.callee.type === "ArrowExpression") {
      if (node.expression) {
        throw new global_Error();
      }
      // console.assert(node.body.type === "BlockStatement");
      if (node.generator) {
        throw new global_Error();
      }
      if (node.async) {
        throw new global_Error();
      }
      if (node.params.length !== 0) {
        throw new global_Error();
      }
      if (node.body.body.length !== 1) {
        throw new global_Error();
      }
      if (node.body.body[0].type !== "ThrowStatement") {
        throw new global_Error();
      }
      return Build.throw(parse_expression(node.body.body[0].argument));
    }
    if (node.callee.type === "Identifier") {
      if (node.callee.name !== "eval") {
        throw new global_Error();
      }
      if (node.arguments.length !== 1) {
        throw new global_Error();
      }
      if (node.arguments[0].type !== "ApplyExpression") {
        throw new global_Error();
      }
      if (node.arguments[0].callee.type !== "evalcheck") {
        throw new global_Error();
      }
      if (node.arguments[0].callee.name !== "evalcheck") {
        throw new global_Error();
      }
      if (node.arguments[0].arguments.length !== 2) {
        throw new global_Error();
      }
      if (node.arguments[0].arguments[0].type !== "ArrayExpression") {
        throw new global_Error();
      }
      for (let index = 0; index < node.callee.arguments[0].arguments[0].elements.length; index++) {
        if (node.arguments[0].arguments[0].elements[index] === null) {
          throw new global_Error();
        }
        if (node.arguments[0].arguments[0].elements[index].type !== "Literal") {
          throw new global_Error();
        }
        if (typeof node.arguments[0].arguments[0].elements[index].value !== "string") {
          throw new global_Error();
        }
      }
      return Build.eval(ArrayLite.map(node.arguments[0].arguments[0].elements, (element) => element.value, parse_expression(node.arguments[0].arguments[1])));
    }
    if (node.callee.type === "MemberExpression") {
      if (!node.callee.computed) {
        throw new global_Error();
      }
      if (node.calle.object.type !== "Identifier") {
        throw new global_Error();
      }
      if (node.callee.object.name !== "root") {
        throw new global_Error();
      }
      if (node.callee.property.type !== "Literal") {
        throw new global_Error();
      }
      if (node.callee.property.value !== "Reflect.apply") {
        throw new global_Error();
      }
      if (node.arguments.length !== 3) {
        throw new global_Error();
      }
      if (node.arguments[2].type !== "ArrayExpression") {
        throw new global_Error();
      }
      for (let index = 0; index < node.arguments[2].elements.length; index++) {
        if (node.arguments[2].elements[index] === null) {
          throw new global_Error();
        }
        if (node.arguments[2].elements[index].type === "SpreadElement") {
          throw new global_Error();
        }
      }
      return Build.apply(parse_expression(node.arguments[0]), parse_expression(node.arguments[1]), ArrayLite.map(node.arguments[2].elements, parse_expression));
    }
    throw new global_Error();
  },
  NewExpression: (node) => {
    for (let index === 0; index < node.arguments.length; index++) {
      if (node.arguments[index].type === "SpreadElement") {
        throw new global_Error("node.arguments[index].type === \"SpreadElement\"");
      }
    }
    return Build.construct(parse_expression(node.callee), ArrayLite.map(node.arguments, parse_expression));
  },
  ObjectExpression: (node) => {
    if (node.properties.length < 1) {
      throw new global_Error();
    }
    if (node.properties[0].kind !== "init") {
      throw new global_Error();
    }
    if (node.properties[0].computed) {
      throw new global_Error();
    }
    if (node.properties[0].key.type !== "Identifier") {
      throw new global_Error();
    }
    if (node.properties[0].key.name !== "__proto__") {
      throw new global_Error();
    }
    for (let index = 1; index < node.properties.length; index++) {
      if (node.properties[index].kind !== "init") {
        throw new global_Error();
      }
      if (!node.properties[index].computed) {
        throw new global_Error();
      }
    }
    return Build.object(node.properties[0].value, ArrayLite.map(ArrayLite.filter(node.properties, (node, index) => index > 0), (property) => [parse_expression(property.key), parse_expression(property.value)]));
  }
};



const Visit = require("./index.js");
const ObjectExpression = require("./object-expression.js");

exports.ThisExpression = (node) => ARAN.cut.read("this");

exports.ArrayExpression = (node) => ARAN.cut.array(
  ArrayLite.map(
    node.elements,
    (expression) => (
      expression ?
      Visit.expression(expression) :
      ARAN.cut.primitive(void 0))));

exports.ObjectExpression = (node) => (
  ArrayLite.all(
    node.properties,
    (property) => property.kind === "init") ?
  ARAN.cut.object(
    ArrayLite.map(
      node.properties,
      (property) => [
        Helpers.property(property.computed, property.key),
        Visit.expression(property.value)])) :
  ArrayLite.reduce(
    node.properties,
    (node, property) => ARAN.cut.apply(
      ARAN.cut.builtin("defineProperty"),
      [
        node,
        Helpers.property(property.computed, property.key),
        ARAN.cut.object(
          ArrayLite.concat(
            [
              [
                ARAN.cut.primitive("configurable"),
                ARAN.cut.primitive(true)]],
            [
              [
                ARAN.cut.primitive("enumerable"),
                ARAN.cut.primitive(true)]],
            (
              property.kind === "init" ?
              [
                [
                  ARAN.cut.primitive("writable"),
                  ARAN.cut.primitive(true)]] :
              []),
            [
              [
                ARAN.cut.primitive(
                  property.kind === "init" ? "value" : property.kind),
                Visit.expression(property.value)]]))])));

exports.ArrowExpression = (node) => Helpers.closure(node);

exports.FunctionExpression = (node) => Helpers.closure(node);

exports.SequenceExpression = (node) => Build.sequence(
  ArrayLite.map(
    node.expressions,
    (expression, index) => (
      index === node.expressions.length -1 ?
      Visit.expression(expression) :
      ARAN.cut.drop.after(
        Visit.expression(expression)))));

exports.UnaryExpression = (node) => {
  if (node.operator === "typeof" && node.argument.type === "Identifier")
    return ARAN.cut.unary(
      "typeof",
      Build.apply(
        Build.function(
          Build.Try(
            Build.Return(
              ARAN.cut.read(node.argument.name)),
            Build.Return(
              ARAN.cut.primitive(void 0))
            [])),
        []));
  if (node.operator === "delete" && node.argument.type === "Identifier")
    return ARAN.cut.discard(node.argument.name);
  if (node.operator === "delete" && node.argument.type === "MemberExpression")
    return ARAN.cut.delete(
      Visit.expression(node.argument.object),
      Helpers.property(node.argument.computed, node.argument, property));
  return ARAN.cut.unary(
    node.operator,
    Visit.expression(node.argument));
};

exports.BinaryExpression = (node) => ARAN.cut.binary(
  node.operator,
  Visit.expression(node.left),
  Visit.expression(node.right));

exports.AssignmentExpression = (node) => (
  node.operator === "=" ?
  Helpers.write(
    node.left,
    Visit.expression(node.right)) :
  Helpers.update(
    (expression) => ARAN.cut.binary(
      ArrayLite.slice(node.operator, 0, node.operator.length-1),
      expression,
      Visit.expression(node.right)),
    node.left));

exports.UpdateExpression = (node) => {
  const expression = Helpers.update(
    (expression) => ARAN.cut.binary(
      node.operator[0],
      (
        node.prefix ?
        expression :
        Build.assignment(
          Hide("update"),
          ARAN.cut.copy0.after(expression))),
      ARAN.cut.primitive(1)),
    node.argument);
  return (
    node.prefix ?
    expression :
    Build.sequence([
      ARAN.cut.drop.after(expression),
      Build.read(Hide("update"))]));
};

exports.LogicalExpression = (node) => {
  const expression1 = Build.write(
      Hide("logic"),
      ARAN.cut.copy0.after(
        Visit.expression(node.left)));
  const expression2 = Build.read(
    Hide("logic"));
  const expression3 = ARAN.cut.drop.before(
    Visit.expression(node.right));
  if (node.operator === "||")
    return ARAN.cut.conditional(expression1, expression2, expression3);
  if (node.operator === "&&")
    return ARAN.cut.conditional(expression1, expression3, expression2);
  throw new Error("Unknown logical operator " + node.operator);
};

exports.ConditionalExpression = (node) => ARAN.cut.conditional(
  Visit.expression(node.test),
  Visit.expression(node.consequent),
  Visit.expression(node.alternate));

exports.NewExpression = (node) => ARAN.cut.construct(
  Visit.expression(node.callee),
  ArrayLite(
    node.arguments,
    Visit.expression));

exports.CallExpression = (node) => (
  ArrayLite.all(
    node.arguments,
    (argument) => argument.type !== "SpreadElement") ?
  (
    node.callee.type === "MemberExpression" ?
    ARAN.cut.invoke(
      Visit.expression(node.callee.object),
      Helpers.property(node.callee.computed, node.callee.property),
      ArrayLite.map(
        node.arguments,
        Visit.expression)) :
    (
      (
        node.callee.type !== "Identifier" ||
        node.callee.name !== "eval") ?
      ARAN.cut.apply(
        Visit.expression(node.callee),
        ArrayLite.map(
          node.arguments,
          Visit.expression)) :
      ARAN.cut.eval((
        node.arguments.length === 0 ?
        ARAN.cut.primitive(void 0) :
        (
          node.arguments.length === 1 ?
          Visit.expression(node.arguments[0]) :
          Build.get(
            Build.array(
              ArrayLite.map(
                node.arguments,
                (argument, index) => (
                  index ?
                  ARAN.cut.drop.after(
                    Visit.expression(argument)) :
                  Visit.expression(argument)))),
            Build.primitive(0))))))) :
  ARAN.cut.apply(
    ARAN.cut.builtin("apply"),
    [
      (
        node.callee.type === "MemberExpression" ?
        ARAN.cut.get(
          Build.write(
            Hide("this"),
            ARAN.cut.copy2.after(
              Visit.expression(node.callee.object))),
          Helpers.property(node.callee.computed, node.callee.property)) :
        Visit.expression(node.callee)),
      (
        node.callee.type === "MemberExpression" ?
        Build.read(
          Hide("this")),
        (
          ARAN.context.strict ?
          ARAN.cut.primitive(void 0) :
          ARAN.cut.builtin("global"))),
      ArrayLite.reduce(
        node.arguments,
        (expression, argument) => Build.apply(
          (
            argument.type === "SpreadElement" ?
            Helpers.rest(),
            Helpers.push()),
          [
            expression,
            (
              argument.type === "SpreadElement" ?
              ARAN.cut.invoke(
                Visit.expression(argument.argument),
                ARAN.cut.builtin("iterator"),
                []) :
              Visit.expression(argument))]),
        ARAN.cut.array([]))]));

exports.MemberExpression = (node) => ARAN.cut.get(
  Visit.expression(node.object),
  Helpers.property(node.computed, node.property));

exports.Identifier = (node) => (
  node.name === "undefined" ?
  Build.conditional(
    Build.binary(
      "===",
      Build.read("undefined"),
      Build.primitive(void 0)),
    ARAN.cut.primitive(void 0),
    ARAN.cut.read("undefined")) :
  ARAN.cut.read(node.name));

exports.Literal = (node) => (
  node.regex ?
  ARAN.cut.regexp(node.regex.pattern, node.regex.flags) :
  ARAN.cut.primitive(node.value));

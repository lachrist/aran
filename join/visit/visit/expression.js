
const Visit = require("./index.js");

exports.ThisExpression = (node) => ARAN.cut.read("this");

exports.ArrayExpression = (node) => ARAN.cut.array(
  node.elements.map(
    (expression) => expressions ?
      Visit.expression(expression) :
      ARAN.cut.primitive(void 0)));

exports.ObjectExpression = (node) => ARAN.cut.object(
  node.properties.map((property) => [
    property.kind,
    property.computed ?
      Visit.expression(property.key) :
      ARAN.cut.primitive(property.key.name),
    Visit.expression(property.value)]));

exports.ArrowExpression = (node) => Helpers.closure(node);

exports.FunctionExpression = (node) => Helper.closure(node);

exports.SequenceExpression = (node) => Build.sequence(
  node.expressions.map((expression, index) => index === node.expressions.length -1 ?
    ARAN.cut.drop.after(
      Visit.expression(expression)),
    Visit.expression(expression)));

exports.UnaryExpression = (node) => {
  if (node.operator === "typeof" && node.argument.type === "Identifier")
    return ARAN.cut.unary(
      "typeof",
      Build.call(
        Build.function(
          [
            Build.Try(
              [
                Build.Return(
                  ARAN.cut.read(node.argument.name))],
              [
                Build.Return(
                  ARAN.cut.primitive(void 0))]
              [])]),
        []));
  if (node.operator === "delete" && node.argument.type === "Identifier")
    return ARAN.cut.discard(node.argument.name);
  if (node.operator === "delete" && node.argument.type === "MemberExpression")
    return ARAN.cut.delete(
      Visit.expression(node.argument.object),
      Helpers.property(node.argument.property));
  return ARAN.cut.unary(
    node.operator,
    Visit.expression(node.argument));
};

exports.BinaryExpression = (node) => ARAN.cut.binary(
  node.operator,
  Visit.expression(node.left),
  Visit.expression(node.right));

exports.AssignmentExpression = (node) => node.operator === "=" ?
  Helpers.write(
    node.left,
    Visit.expression(node.right)) :
  Left(
    (str) => ARAN_CUT.binary(
      ast.operator.substring(0, ast.operator.length-1),
      str,
      Visit.expression(ast.right),
      ast.__min__),
    ast.left,
    ast.__min__);

exports.UpdateExpression = (ast) => {
  const ast1 = Left(
    (str) => ARAN_CUT.binary(
      ast.operator[0],
      ast.prefix ?
        str :
        Build.assignment(
          Hide(ast.__min__, "update"),
          ARAN_CUT.copyA(str, ast.__min__)),
      ARAN_CUT.primitive(1, ast.__min__),
      ast.__min__),
    ast.argument,
    ast.__min__);
  return ast.prefix ?
    ast1 :
    Build.sequence([
      ARAN_CUT.dropA(str),
      Build.read(Hide(ast.__min__, "update"))]);
};

exports.LogicalExpression = (ast) => {
  const str1 = ARAN_CUT.test(
    Build.assignment(
      Hide(ast.__min__, "logic"),
      ARAN_CUT.copyA(
        Visit.expression(ast.left),
        ast.__min__)), 
    ast.__min__);
  const str2 = Build.read(Hide(ast.__min__, "logic"));
  const str3 = ARAN_CUT.dropB(
    Visit.expression(ast.right),
    ast.__min__);
  if (ast.operator === "||")
    return Build.conditional(str1, str2, str3);
  if (ast.operator === "&&")
    return Build.conditional(str1, str3, str2);
  throw new Error("Unknown logical operator " + ast.operator);
};

exports.ConditionalExpression = (ast) => Build.conditional(
  ARAN_CUT.test(
    Visit.expression(ast.test),
    ast.__min__),
  Visit.expression(ast.consequent),
  Visit.expression(ast.alternate));

exports.NewExpression = (ast) => ARAN_CUT.construct(
  Visit.expression(ast.callee),
  ast.arguments.map(Visit.expression),
  ast.__min__);

exports.CallExpression = (ast) => {
  const asts = ast.arguments.map(Visit.expression);
  if (ast.callee.type === "MemberExpression")
    return ARAN_CUT.apply(
      ARAN_CUT.get(
        Build.assignment(
          Hide(ast.__min__, "this"),
          ARAN_CUT.copyA(
            Visit.expression(ast.callee.object),
            ast.__min__)),
        Property(ast.callee.property, ast.__min__),
        ast.__min__),
      Build.read(Hide(ast.__min__, "this")),
      asts,
      ast.__min__);
  const ast1 = ARAN_STRICT ?
    ARAN_CUT.primitive(void 0, ast.__min__) :
    ARAN_CUT.gobal(ast.__min__);
  if (ast.callee.type !== "Identifier" || ast.callee.name !== "eval")
    return ARAN_CUT.apply(
      Visit.expression(ast.callee),
      ast1,
      asts,
      ast.__min__);
  const fct = (ast2, asts) => Build.conditional(
    Build.binary("===",
      Build.read("eval", ast.__min__),
      Protect.load("eval")),
    ARAN_CUT.eval(ast2, ast.__min__),
    ARAN_CUT.apply(
      Build.read("eval"),
      ast1,
      asts,
      ast.__min__));
  return asts.length === 0 ?
    fct(
      ARAN_CUT.primitive(void 0, ast.__min__),
      []) :
    asts.length === 1 ?
      Build.sequence([
        ARAN_CUT.read("eval", ast.__min__),
        Build.write(
          Hide("eval", ast.__min__),
          asts[0]),
        fct(
          Build.read(Hide("eval", ast.__min__)),
          [Hide("eval", ast.__min__)])]) :
      Build.sequence([
        ARAN_CUT.read("eval", ast.__min__),
        Build.write(
          Hide("eval", ast.__min__),
          Build.array(asts)),
        fct(
          asts.reduce(
            (ast, _, idx) => idx ?
              ARAN_CUT.dropB(ast, ast.__min__) :
              ast,
            Build.get(
              Build.read(Hide("eval", ast.__min__)),
              Build.primitive(0)),
          asts.map((_, idx) => Build.get(
            Build.read(Hide("eval", ast.__min__)),
            Build.primitive(idx)))))]);
};

exports.MemberExpression = (ast) => ARAN_CUT.get(
  Visit.expression(ast.object),
  Property(ast.property, ast.__min__),
  ast.__min__);

exports.Identifier = (ast) => ast.name === "undefined" ?
  Build.conditional(
    Build.binary(
      "===",
      Build.read("undefined"),
      Build.primitive(void 0)),
    ARAN_CUT.primitive(
      void 0,
      ast.__min__),
    ARAN_CUT.read("undefined", ast.__min__)) :
  ARAN_CUT.read(ast.name, ast.__min__);

exports.Literal = (ast) => ast.regex ?
  ARAN_CUT.regexp(ast.regex.pattern, ast.regex.flags, ast.__min__) :
  ARAN_CUT.primitive(ast.value, ast.__min__);

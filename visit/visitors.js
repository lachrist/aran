
const Helpers = require("./helpers.js");
const Visit = require("./visit.js");
const Protect = require("../protect.js");
const Context = require("./context.js");
const stringify = JSON.stringify;

// The visitors of this file either:
//   1) visit an expression node and return an expression string
//   2) visit a statement node and return a concatenated list of statement strings.
// Replacing a statement by a list of statement is safe if control structures
// (if|while|do-while|for|for-in|label) have a statement block as body.
// If it is not already the case, we put a block around the body of these structures.
// However, since ECMAScript6, statement blocks are no longer transparent due to block scoping.
// Yet, this transformation is safe because the body of the above structure cannot be a
// a declaration (see http://www.ecma-international.org/ecma-262/6.0/#sec-statements).

////////////////
// Statements //
////////////////

exports.Program = (ast) => {
  const tmp = global.ARAN_CONTEXT;
  global.ARAN_CONTEXT = Context(ast.body[0]);
  const arr = ast.body.map(Visit);
  const res =
    (ARAN_CONTEXT.strict ? "'use-strict';" : "") +
    Protect.save() +
    ARAN_CUT.Program(ARAN_CONTEXT.strict, ast.__min__) +
    ARAN_CONTEXT.hoisted +
    arr.join("");
  global.ARAN_CONTEXT = tmp;
  return res;
};

exports.EmptyStatement = (ast) =>
  "";

exports.BlockStatement = (ast) =>
  ("{" + ARAN_CUT.Enter("block", ast.__min__)) +
  ast.body.map(Visit).join("") +
  (ARAN_CUT.Leave("block", ast.__min__) + "}");

exports.ExpressionStatement = (ast) =>
  ARAN_CUT.drop(Visit(ast.expression), ast.__min__) + ";";

exports.IfStatement = (ast) =>
  "if(" + ARAN_CUT.test(Visit(ast.test), ast.__min__) + ")" +
  Helpers.body(ast.consequent) +
  (ast.alternate ? "else" + Helpers.body(ast.alternate) : "");

exports.LabeledStatement = (ast) =>
  ARAN_CUT.Label(ast.label.name, ast.__min__) +
  ast.label.name + ":" + Helpers.body(ast.body, ast.__min__);

exports.BreakStatement = (ast) =>
  ARAN_CUT.Break(ast.label ? ast.label.name : null, ast.__min__) +
  "break " + (ast.label ? ast.label.name : "") + ";";

exports.ContinueStatement = (ast) => Build.Continue(
  ARAN_CUT.Continue(ast.label ? ast.label.name : null, ast.__min__) +
  "continue " + (ast.label ? ast.label.name : "") + ";";

exports.WithStatement = (ast) => Build.With(
  ARAN_CUT.with(
    Visit(ast.object),
    ast.__min__),
  Body(ast.body));

// TODO
exports.SwitchStatement = (ast) => {
  ARAN_CUT.Enter("switch", ast.__min__) +
  "var" + Hide(ast.__min__, "switch") + "=" + Visit(ast.discriminant) + ";"
  "switch (true) {" +
  ast.cases.map((cse) =>
    (cst.test
      ? "case " +
        ARAN_CUT.test(
          ARAN_CUT.binary("===",
            ARAN_CUT.peek(Hide(ast.__min__, "switch"), ast.__min__),
            Visit(cse.test),
            ast.__min__),
          ast.__min__) +
        ":"
      : "default:") +
    cse.consequent.map(Visit).join("")).join("") +
  "}" +
  ARAN_CUT.drop(ast.__min__) +
  ARAN_CUT.Leave("switch", ast.__min__);

exports.ReturnStatement = (ast) => [
  Build.Return(
    ARAN_CUT.return(
      ast.argument ?
        Visit(ast.argument) :
        ARAN_CUT.primitive(void 0, ast.__min__),
      ast.__min__))];

exports.ThrowStatement = (ast) => [
  Build.throw(
    ARAN_CUT.throw(
      Visit(ast.argument),
      ast.__min__))];

// TODO
exports.TryStatement = (ast) => Build.Try(
  ARAN_CUT.Enter("try", ast.__min__) +
  ast.block.body.map(Visit).join("") +
  ctx.cut.Leave("try", ast.__min__) +
  ("}catch(" + Hide(ast.__min__, "catch") + "){") +
  ctx.cut.Enter("catch", ast.__min__) +
  Helpers.assign("let", ast.handler.param, Hide(ast.__min__, "catch"), ast.__min__) +
  ast.handler.body.body.map(Visit).join("") +
  ctx.cut.Leave("catch", ast.__min__) +
  "}finally{" +
  ctx.cut.Enter("finally", ast.__min__) +
  (ast.finalizer ? ast.finalizer.body.map(Visit).join("") : "") +
  ctx.cut.Leave("finally", ast.__min__) +
  "}";

exports.WhileStatement = (ast) => [
  Build.While(
    ARAN_CUT.test(
      Visit(ast.test),
      ast.__min__),
    Body(ast.body))];

exports.DoWhileStatement = (ast) => [
  Build.DoWhile(
    Body(ast.body),
    ARAN_CUT.test(
      Visit(ast.test),
      ast.__min__))];

// TODO
exports.ForStatement = function (ctx, ast) {
  const lab = ctx.looplabel ? ctx.looplabel + ":" : "";
  const tmp = ctx.switchlabel;
  ctx.looplabel = "";
  ctx.switchlabel = "";
  let str1 = "";
  let str2 = "";
  if (ast.init && ast.init.type === "VariableDeclaration") {
    str1 = ctx.cut.Declare(ast.init.kind, ast.init.declarations.map((d) => d.id.name), ast.__min__);
    if (ast.init.kind === "var") {
      ctx.hoisted.closure += str1
      str1 = "";
    }
    str2 = JoinHelpers.declare(ctx, ast, ast.init);
  } else if (ast.init) {
    str2 = ctx.cut.expression(ctx.visit(ast, ast.init), ast.__min__) + ";"; 
  }
  const str3 = ctx.cut.test(ast.test ? ctx.visit(ast, ast.test) : "true", ast.__min__);
  const str4 = ast.body.type === "BlockStatement"
    ? ast.body.body.map(ctx.visit.bind(ctx, ast)).join("")
    : ctx.visit(ast, ast.body);
  const str5 = ast.update
    ? ctx.cut.expression(ctx.visit(ast, ast.update), ast.__min__) + ";";
    : "";
  const res =
    ctx.cut.expression(ctx.cut.primitive("void 0", ast.__min__), ast.__min__) + ";" +
    "{" + ctx.cut.Enter(ast.__min__) +
    str1 +
    str2 +
    lab + "while(" + str3 + ")" +
    "{" + str4 + str5 + "}" +
    ctx.cut.Leave(ast.__min__) + "}";
  ctx.switchlabel = tmp;
  return res;
};

// TODO
exports.ForInStatement = (ctx, ast) => {
  const lab = ctx.looplabel ? ctx.looplabel+":" : "";
  ctx.looplabel = "";
  var tmp = ctx.switchlabel;
  ctx.switchlabel = "";
  var obj = {enumerate: ctx.hide(), counter: ctx.hide()};
  var arr = [
    obj.enumerate + "=" + ctx.cut.enumerate(ctx.visit(ast, ast.right), ast.__min__) + ";",
    obj.counter + "=0;"
  ];
  if (ast.left.type !== "MemberExpression") {
    if (ast.left.type === "VariableDeclaration") {
      (function (str) {
        (ast.left.kind === "var") ? (ctx.hoisted.closure += str) : arr.push(str);
      } (ctx.cut.Declare(ast.left.kind, ast.left.declarations.map((d) => d.id.name), ast.__min__)));
      arr.push(JoinHelpers.declare(ctx, ast, ast.left));
    }
    var str = ctx.cut.write(
      ast.left.type === "Identifier" ? ast.left.name : ast.left.declarations[0].id.name,
      obj.enumerate + "[" + obj.counter + "]",
      ast.__min__);
  } else {
    obj.object = ctx.hide();
    arr.push(obj.object + "=" + ctx.visit(ast, ast.left.object) + ";");
    if (ast.left.computed) {
      obj.property = ctx.hide();
      arr.push(obj.property + "=" + ctx.visit(ast, ast.left.property) + ";")
    }
    var str = ctx.cut.set(
      obj.object,
      ast.left.computed
        ? obj.property
        : ctx.cut.primitive(JSON.stringify(ast.left.property.name), ast.__min__),
      obj.enumerate + "[" + obj.counter + "]",
      ast.__min__);
  }
  var res = ctx.cut.expression(ctx.cut.primitive("void 0", ast.__min__), ast.__min__) + ";"
    + "{" + ctx.cut.Enter(ast.__min__) + arr.join("")
    + lab + "while(" + obj.counter + "<" + obj.enumerate + ".length){"
    + (ast.body.type === "BlockStatement"
      ? ast.body.body.map(ctx.visit.bind(ctx, ast)).join("")
      : ctx.visit(ast, ast.body))
    + ctx.cut.expression(str, ast.__min__) + ";" + obj.counter +"++;}"
    + ctx.cut.Leave(ast.__min__) + "}";
  ctx.switchlabel = tmp;
  return res;
};

exports.DebuggerStatement = (ast) => [
  Build.debugger()];

exports.FunctionDeclaration = (ast) => ARAN_CUT.Declare(
  "var",
  ast.id.name,
  Closure(ast, ast.__min__),
  ast.__min__);

exports.VariableDeclaration = (ast) => Declare(ast, ast.__min__);

/////////////////
// Expressions //
/////////////////

exports.ThisExpression = (ast) => ARAN_CUT.read("this", ast.__min__);

exports.ArrayExpression = (ast) => ARAN_CUT.array(
  ast.elements.map(
    (elm) => elm ?
      Visit(elm) :
      ARAN_CUT.primitive(void 0, ast.__min__)),
  ast.__min__);

exports.ObjectExpression = (ast) => ARAN_CUT.object(
  ast.properties.map(
    (prp) => ({
      kind: prp.kind,
      key: prp.computed ?
        Visit(prp.key) :
        ARAN_CUT.primitive(prp.key[prp.key.type === "Identifier" ? "name" : "raw"], ast.__min__),
      value: Visit(prp.value)
    })),
  ast.__min__);

exports.ArrowExpression = (ast) => Closure(ast, ast.__min__);

exports.FunctionExpression = (ast) => Closure(ast, ast.__min__);

exports.SequenceExpression = (ast) => {
  var arr = [];
  for (var i=0, l=ast.expressions.length-1; i<l; i++)
    arr.push(
      Visit(ast.expressions[i]),
      ARAN_CUT.dropA(, ast.__min__));
  arr.push(ast.expressions[l]);
  return Build.sequence(arr);
};

exports.UnaryExpression = (ast) => {
  if (ast.operator === "typeof" && ast.argument.type === "Identifier")
    return ARAN_CUT.unary(
      "typeof",
      Build.conditional(
        Build.binary(
          "===",
          Build.unary(
            "typeof",
            ARAN_CUT(ast.argument.name, ast.__min__)),
          Build.primitive("undefined")),
        Build.primitive(void 0)),
      ast.__min__);
  if (ast.operator === "delete" && ast.argument.type === "Identifier")
    return ARAN_CUT.discard(ast.argument.name, ast.__min__);
  if (ast.operator === "delete" && ast.argument.type === "MemberExpression")
    return ARAN_CUT.delete(
      Visit(argument.object),
      Helpers.property(ast.argument.property, ast.__min__),
      ast.__min__);
  return ARAN_CUT.unary(
    ast.operator,
    Visit(ast.argument),
    ast.__min__);
};

exports.BinaryExpression = (ast) => ARAN_CUT.binary(
  ast.operator,
  Visit(ast.left),
  Visit(ast.right),
  ast.__min__);

exports.AssignmentExpression = (ast) => ast.operator === "=" ?
  Helpers.assign(
    null,
    ast.left,
    Visit(ast.right),
    ast.__min__) :
  Left(
    (str) => ARAN_CUT.binary(
      ast.operator.substring(0, ast.operator.length-1),
      str,
      Visit(ast.right),
      ast.__min__),
    ast.left,
    ast.__min__);

exports.UpdateExpression = (ast) => {
  const str = Left(
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
  if (ast.prefix)
    return str;
  ARAN_HOISTED.push(
    Build.Declaration(
      "var",
      Hide(ast.__min__, "update")));
  return Build.sequence([
    ARAN_CUT.dropA(str),
    Build.identifier(
      Hide(ast.__min__, "update"))]);
};

exports.LogicalExpression = (ast) => {
  ARAN_HOISTED.push(
    Build.Declaration(
      "var",
      Hide(ast.__min__, "logic")));
  const str1 = ARAN_CUT.test(
    Build.assignment(
      Hide(ast.__min__, "logic"),
      ARAN_CUT.copyA(
        Visit(ast.left),
        ast.__min__)), 
    ast.__min__);
  const str2 = Build.identifier(
    Hide(ast.__min__, "logic"));
  const str3 = ARAN_CUT.dropB(
    Visit(ast.right),
    ast.__min__);
  if (ast.operator === "||")
    return Build.conditional(str1, str2, str3);
  if (ast.operator === "&&")
    return Build.conditional(str1, str3, str2);
  throw new Error("Unknown logical operator " + ast.operator);
};

exports.ConditionalExpression = (ast) => Build.conditional(
  ARAN_CUT.test(
    Visit(ast.test),
    ast.__min__),
  Visit(ast.consequent),
  Visit(ast.alternate));

exports.NewExpression = (ast) => ARAN_CUT.construct(
  Visit(ast.callee),
  ast.arguments.map(Visit),
  ast.__min__);

exports.CallExpression = (ast) => {
  const arr = ast.arguments.map(Visit);
  if (ast.callee.type === "MemberExpression") {
    ARAN_HOISTED.push(
      Build.Declaration(
        "var",
        Hide(ast.__min__, "this")));
    return ARAN_CUT.apply(
      ARAN_CUT.get(
        Build.assignment(
          Hide(ast.__min__, "this"),
          ARAN_CUT.copyA(
            Visit(ast.callee.object),
            ast.__min__)),
        Helpers.property(ast.callee.property, ast.__min__),
        ast.__min__),
      Build.identifier(
        Hide(ast.__min__, "this")),
      arr,
      ast.__min__);
  }
  const obj1 = ARAN_STRICT ?
    ARAN_CUT.primitive(
      Build.primitive(void 0),
      ast.__min__) :
    ARAN_CUT.gobal(ast.__min__);
  if (ast.callee.type === "Identifier" && ast.callee.name === "eval") {
    if (arr.length === 0) {
      var obj2 = ARAN_CUT.primitive(
        Build.primitive(void 0),
        ast.__min__); 
    } else if (arr.length === 1) {
      var obj2 = arr[0];
    } else {
      let arr2 = [arr[0]];
      for (let i=1, l=arr.length; i<l; i++)
        arr2.push(ARAN_CUT.dropA(arr[i], ast.__min__))
      var obj2 = Build.member(
        Build.array(arr2),
        Build.primitive(0));
    }
    return Build.conditional(
      Build.binary("===",
        ARAN_CUT.read("eval", ast.__min__),
        Protect.load("eval")),
      ARAN_CUT.eval(obj2, ast.__min__),
      ARAN_CUT.apply("eval", obj1, arr, ast.__min__));
  }
  return ARAN_CUT.apply(
    Visit(ast.callee),
    str1,
    arr,
    ast.__min__);
};

exports.MemberExpression = (ast) => ARAN_CUT.get(
  Visit(ast.object),
  Helpers.property(ast.property, ast.__min__),
  ast.__min__);

exports.Identifier = (ast) => (ast.name === "undefined") ?
  Build.conditional(
    Build.binary(
      "===",
      Build.identifier("undefined"),
      Build.primitive(void 0)),
    ARAN_CUT.primitive(
      Build.primitive(void 0),
      ast.__min__),
    ARAN_CUT.read("undefined", ast.__min__)) :
  ARAN_CUT.read(ast.name, ast.__min__);

exports.Literal = (ast) => ARAN_CUT["regex" in ast ? "regexp" : "primitive"](ast.raw, ast.__min__);

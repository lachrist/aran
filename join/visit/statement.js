
// The visitors of this file returns a list of statement.
// This is safe provided that control structures (if|while|do-while|for|for-in|label) have a statement block as body.
// Therefore, if it is not already the case, we put a block around the body of these structures.
// However, since ECMAScript6, statement blocks are no longer transparent due to block scoping.
// Yet, this transformation is safe because the body of the above structure cannot be a declaration (see http://www.ecma-international.org/ecma-262/6.0/#sec-statements).

const concat = Array.prototype.concat;

exports.EmptyStatement = (node) => [];

exports.BlockStatement = (node) => ARAN.cut.Block(
  concat.apply(
    [],
    node.body.map(Visit.Statement)));

exports.ExpressionStatement = (node) => concat.call(
  [
    Build.Statement(
      Visit.expression(node.expression))],
  ARAN.cut.Drop());

exports.IfStatement = (node) => ARAN.cut.If(
  ARAN.cut.test(
    Visit.expression(node.test)),
  Helpers.Body(node.consequent),
  node.alternate ?
    Helpers.Body(node.alternate) :
    []);

exports.LabeledStatement = (node) => ARAN.cut.Label(
  node.label.name,
  Helpers.Body(node.body));

exports.BreakStatement = (node) => ARAN.cut.Break(
  node.label ? node.label.name : null);

exports.ContinueStatement = (node) => ARAN.cut.Continue(
  node.label ? node.label.name : null);

exports.WithStatement = (node) => ARAN.cut.With(
  Visit.expression(node.object),
  Helpers.Body(node.body));

// TODO
exports.SwitchStatement = (node) => ARAN.cut.Switch(
  Visit.expression(ast.discriminant),
  node.cases.map((clause) => [
    clause.test ?
      Visit.expression(test) :
      null,
    ]);
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

exports.ReturnStatement = (node) => ARAN.cut.Return(
  node.argument ?
    Visit(node.argument),
    ARAN.cut.primitive(void 0));

exports.ThrowStatement = (ast) => ARAN.cut.Throw(
  Visit(node.argument));

exports.TryStatement = (ast) => ARAN.cut.Try(

  );


  Build.Try(
  flaten([
    ARAN_CUT.Enter("try", ast.__min__),
    flaten(ast.block.body.map(Visit)),
    ARAN_CUT.Leave("try", ast.__min__)]),
  ast.handler ?
    Hide(ast.__min__, "catch") :
    null,
  ast.handler ?
    flaten([
      ARAN_CUT.Enter("catch", ast.__min__),
      Assign(
        "let",
        ast.handler.param,
        Build.identifier(Hide(ast.__min__, "catch"))),
      flaten(ast.)
      ARAN_CUT.Leave("catch", ast.__min__)]) :
    null,
  ast.finalizer ?
    flaten([
      ARAN_CUT.Enter("finally", ast.__min__),
      flaten(ast.finalizer.body.map(Visit)),
      ARAN_CUT.Leave("finally", ast.__min__)]) :
    null);

exports.WhileStatement = (node) => ARAN.cut.While(
  Visit(node.test),
  Helpers.Body(node.body));

exports.DoWhileStatement = (node) => concat.call(
  [
    Build.Statement(
      Build.write(
        Hide("dowhile"),
        Build.primitive(true)))],
  ARAN.cut.While(
    Build.conditional(
      Build.read(
        Hide("dowhile")),
      Build.sequence(
        Build.write(
          Hide("dowhile"),
          Build.primitive(false)),
        ARAN.cut.primitive(true)),    
      Visit.expression(node.test)),
    Helpers.Body(node.body)));

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

  enumerate: Build.function(
    "enumerate",
    ["o"],
    [ 
      Build.Declare(
        "var",
        "ks",
        Build.array([]));
      Build.while(
        Build.identifier("o"),
        [
          Build.write(
            "ks",
            Build.apply(
              Build.get(
                Build.identifier("ks"),
                "concat"),
              [Build.apply(
                Build.identifier(load("ownKeys")),
                [Build.identifier("o")])])),
          Build.write(
            "o",
            Build.apply(
              load("getPrototypeOf"),
              [Build.identifier("o")]))])]);
  global: Build.conditional(
    Build.binary(
      "===",
      Build.identifier("window"),
      Build.primitive("undefined")),
    Build.identifier("global"),
    Build.identifier("window"))

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

exports.DebuggerStatement = (ast) => [Build.debugger()];

exports.FunctionDeclaration = (ast) => {
  ARAN_HOISTED.push(ARAN_CUT.Declare(
    "var",
    ast.id.name,
    Closure(ast, ast.__min__),
    ast.__min__));
  return [];
};

exports.VariableDeclaration = (ast) => Declare(ast, ast.__min__);

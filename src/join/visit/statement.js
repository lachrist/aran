
// The visitors of this file returns a list of statement.
// This is safe provided that control structures (if|while|do-while|for|for-in|label) have a statement block as body.
// Therefore, if it is not already the case, we put a block around the body of these structures.
// However, since ECMAScript6, statement blocks are no longer transparent due to block scoping.
// Yet, this transformation is safe because the body of the above structure cannot be a declaration (see http://www.ecma-international.org/ecma-262/6.0/#sec-statements).

const ArrayLite = require("array-lite");
const Build = require("../../build");
const Interim = require("../interim.js");
const Util = require("../util");
const Visit = require("./index.js");

exports.EmptyStatement = (node) => [];

exports.BlockStatement = (node) => ARAN.cut.Block(
  ArrayLite.flaten(
    ArrayLite.map(
      node.body,
      Visit.Statement)));

exports.ExpressionStatement = (node) => ArrayLite.concat(
  Build.Statement(
      Visit.expression(node.expression)),
  ARAN.cut.$Drop0());

exports.IfStatement = (node) => ARAN.cut.If(
  Visit.expression(node.test),
  Util.Body(node.consequent),
  (
    node.alternate ?
    Util.Body(node.alternate) :
    []));

exports.LabeledStatement = (node) => ARAN.cut.Label(
  node.label.name,
  Util.Body(node.body));

exports.BreakStatement = (node) => ARAN.cut.Break(
  node.label ? node.label.name : null);

exports.ContinueStatement = (node) => ARAN.cut.Continue(
  node.label ? node.label.name : null);

exports.WithStatement = (node) => ARAN.cut.With(
  Visit.expression(node.object),
  Util.Body(node.body));

exports.SwitchStatement = (node) => ArrayLite.concat(
  Interim.Declare(
    "switch",
    Visit(ast.discriminant)),
  ARAN.cut.Switch(
    ArrayLite.map(
      node.cases,
      (clause) => [
        (
          clause.test ?
          ARAN.cut.binary(
            "===",
            ARAN.cut.$copy0.before(
              Interim.read("switch")),
            Visit.expression(clause.test)) :
          ARAN.cut.primitive(true)),
        ArrayLite.concat(
          ArrayLite.map(
            clause.consequent,
            Visit.Statement))])),
  ARAN.cut.$Drop0());

exports.ReturnStatement = (node) => ARAN.cut.Return(
  (
    node.argument ?
    Visit.expression(node.argument) :
    ARAN.cut.primitive(void 0)));

exports.ThrowStatement = (node) => ARAN.cut.Throw(
  Visit.expression(node.argument));

exports.TryStatement = (node) => ARAN.cut.Try(
  ArrayLite.concat(
    node.block.body.map(Visit.Statement)),
  (
    node.handler ?
    ArrayLite.flaten(
      Util.assignment(
        node.handler.param,
        Build.read("error")),
      ArrayLite.concat(
        ArrayLite.map(
          node.handler.body,
          Visit.Statement))) :
    []),
  (
    node.finalizer ?
    ArrayLite.concat(
      ArrayLite.map(
        node.finalizer.body,
        Visit.Statement)) :
    []));

exports.WhileStatement = (node) => ARAN.cut.While(
  Visit.expression(node.test),
  Util.Body(node.body));

exports.DoWhileStatement = (node) => ArrayLite.concat(
  Interim.Declare(
    "dowhile",
    Build.primitive(true)),
  ARAN.cut.While(
    Build.conditional(
      Interim.read("dowhile"),
      Build.sequence(
        Interim.write(
          "dowhile",
          Build.primitive(false)),
        ARAN.cut.primitive(true)),
      Visit.expression(node.test)),
    Util.Body(node.body)));

// // TODO
// exports.ForStatement = function (ctx, ast) {
//   const lab = ctx.looplabel ? ctx.looplabel + ":" : "";
//   const tmp = ctx.switchlabel;
//   ctx.looplabel = "";
//   ctx.switchlabel = "";
//   let str1 = "";
//   let str2 = "";
//   if (ast.init && ast.init.type === "VariableDeclaration") {
//     str1 = ctx.cut.Declare(ast.init.kind, ast.init.declarations.map((d) => d.id.name), ast.__min__);
//     if (ast.init.kind === "var") {
//       ctx.hoisted.closure += str1
//       str1 = "";
//     }
//     str2 = JoinHelpers.declare(ctx, ast, ast.init);
//   } else if (ast.init) {
//     str2 = ctx.cut.expression(ctx.visit(ast, ast.init), ast.__min__) + ";"; 
//   }
//   const str3 = ctx.cut.test(ast.test ? ctx.visit(ast, ast.test) : "true", ast.__min__);
//   const str4 = ast.body.type === "BlockStatement"
//     ? ast.body.body.map(ctx.visit.bind(ctx, ast)).join("")
//     : ctx.visit(ast, ast.body);
//   const str5 = ast.update
//     ? ctx.cut.expression(ctx.visit(ast, ast.update), ast.__min__) + ";";
//     : "";
//   const res =
//     ctx.cut.expression(ctx.cut.primitive("void 0", ast.__min__), ast.__min__) + ";" +
//     "{" + ctx.cut.Enter(ast.__min__) +
//     str1 +
//     str2 +
//     lab + "while(" + str3 + ")" +
//     "{" + str4 + str5 + "}" +
//     ctx.cut.Leave(ast.__min__) + "}";
//   ctx.switchlabel = tmp;
//   return res;
// };

//   enumerate: Build.function(
//     "enumerate",
//     ["o"],
//     [ 
//       Build.Declare(
//         "var",
//         "ks",
//         Build.array([]));
//       Build.while(
//         Build.identifier("o"),
//         [
//           Build.write(
//             "ks",
//             Build.apply(
//               Build.get(
//                 Build.identifier("ks"),
//                 "concat"),
//               [Build.apply(
//                 Build.identifier(load("ownKeys")),
//                 [Build.identifier("o")])])),
//           Build.write(
//             "o",
//             Build.apply(
//               load("getPrototypeOf"),
//               [Build.identifier("o")]))])]);
//   global: Build.conditional(
//     Build.binary(
//       "===",
//       Build.identifier("window"),
//       Build.primitive("undefined")),
//     Build.identifier("global"),
//     Build.identifier("window"))

// // TODO
// exports.ForInStatement = (ctx, ast) => {
//   const lab = ctx.looplabel ? ctx.looplabel+":" : "";
//   ctx.looplabel = "";
//   var tmp = ctx.switchlabel;
//   ctx.switchlabel = "";
//   var obj = {enumerate: ctx.hide(), counter: ctx.hide()};
//   var arr = [
//     obj.enumerate + "=" + ctx.cut.enumerate(ctx.visit(ast, ast.right), ast.__min__) + ";",
//     obj.counter + "=0;"
//   ];
//   if (ast.left.type !== "MemberExpression") {
//     if (ast.left.type === "VariableDeclaration") {
//       (function (str) {
//         (ast.left.kind === "var") ? (ctx.hoisted.closure += str) : arr.push(str);
//       } (ctx.cut.Declare(ast.left.kind, ast.left.declarations.map((d) => d.id.name), ast.__min__)));
//       arr.push(JoinHelpers.declare(ctx, ast, ast.left));
//     }
//     var str = ctx.cut.write(
//       ast.left.type === "Identifier" ? ast.left.name : ast.left.declarations[0].id.name,
//       obj.enumerate + "[" + obj.counter + "]",
//       ast.__min__);
//   } else {
//     obj.object = ctx.hide();
//     arr.push(obj.object + "=" + ctx.visit(ast, ast.left.object) + ";");
//     if (ast.left.computed) {
//       obj.property = ctx.hide();
//       arr.push(obj.property + "=" + ctx.visit(ast, ast.left.property) + ";")
//     }
//     var str = ctx.cut.set(
//       obj.object,
//       ast.left.computed
//         ? obj.property
//         : ctx.cut.primitive(JSON.stringify(ast.left.property.name), ast.__min__),
//       obj.enumerate + "[" + obj.counter + "]",
//       ast.__min__);
//   }
//   var res = ctx.cut.expression(ctx.cut.primitive("void 0", ast.__min__), ast.__min__) + ";"
//     + "{" + ctx.cut.Enter(ast.__min__) + arr.join("")
//     + lab + "while(" + obj.counter + "<" + obj.enumerate + ".length){"
//     + (ast.body.type === "BlockStatement"
//       ? ast.body.body.map(ctx.visit.bind(ctx, ast)).join("")
//       : ctx.visit(ast, ast.body))
//     + ctx.cut.expression(str, ast.__min__) + ";" + obj.counter +"++;}"
//     + ctx.cut.Leave(ast.__min__) + "}";
//   ctx.switchlabel = tmp;
//   return res;
// };


// for (k in o) { ... }
//
// var _o = o;
// while (o) {
//   var _ks = Object.keys(_o);
//   _o = Object.getPrototypeOf(o);
//   var _i = 0;
//   while (_i < _ks.length) {
//     k = _ks[i];
//     i = i + 1;
//     ...
//   }
// }

// for (x of xs) { ... }
//
// var _iterator = xs[Symbol.iterator]();
// while (!(_step = _iterator()).done) {
//   x = _step.value;
//   ...
// }

exports.DebuggerStatement = (node) => Build.Debugger();

exports.FunctionDeclaration = (node) => {
  ARAN.context.hoisted.push(
    ARAN.cut.Declare(
      "var",
      node.id.name,
      Util.closure(node)));
  return [];
};

exports.VariableDeclaration = (node) => Util.Declaration(node);

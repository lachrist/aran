
const ArrayLite = require("array-lite");

const Build = require("../build.js");
const Scope = require("../scope.js");
const Visit = require("./index.js");
const Query = require("../query");
const Short = require("../short");

exports.EmptyStatement = (node, scope) => [];

exports.LabeledStatement = (node, scope) => (
  (
    node.body.type === "WhileStatement" ||
    node.body.type === "DoWhileStatement" ||
    node.body.type === "ForStatement" ||
    node.body.type === "ForOfStatement" ||
    node.body.type === "ForInStatement" ||
    node.body.type === "SwitchStatement") ?
  Visit.Statement(node.body, scope) :
  Build.Block(
    node.label.name,
    Short.BLOCK(
      node.AranStrict,
      (
        node.body.type === "BlockStatement" ?
        node.body.body :
        [node.body]),
      scope)));

exports.BlockStatement = (node, scope) => Build.Block(
  null,
  Short.BLOCK(node.AranStrict, node.body, scope));

exports.ExpressionStatement = (node, scope) => (
  Query.LastValued(node) ?
  Build.Write(
    0,
    Visit.expression(node.expression, scope)) :
  Build.Expression( 
    Visit.expression(node.expression, scope)));

exports.IfStatement = (node, scope) => Build.If(
  Visit.expression(node.test, scope),
  Short.BLOCK(
    node.AranStrict,
    (
      node.consequent.type === "BlockStatement" ?
      node.consequent.body :
      [node.consequent]),
    scope),
  Short.BLOCK(
    node.AranStrict,
    (
      node.alternate ?
      (
        node.alternate.type === "BlockStatement" ?
        node.alternate.body :
        [node.alternate]) :
      [])));

exports.BreakStatement = (node, scope) => Build.Break(
  node.label ? node.label.name : null);

exports.ContinueStatement = (node, scope) => Build.Continue(
  node.label ? node.label.name : null);

exports.WithStatement = (node, scope, token) => (
  token = Scope.token(scope),
  ArrayLite.concat(
    Build.Write(
      token,
      Visit.expression(node.object, scope)),
    Build.Block(
      null,
      Short.BLOCK(
        node.AranStrict,
        (
          node.body.type === "BlockStatement" ?
          node.body.body :
          [node.body]),
        Scope.With(token, scope)))));

exports.ReturnStatement = (node, scope) => Build.Return(
  (
    node.argument ?
    Visit.expression(node.argument, scope) :
    Build.primitive(void 0)));

exports.ThrowStatement = (node, scope) => Build.Throw(
  Visit.expression(node.argument, scope));

exports.TryStatement = (node, scope1, $token) => Build.Try(
  Short.BLOCK(node.AranStrict, node.block.body, scope1),
  (
    node.handler ?
    (
      scope2 = Scope.Block(
        Query.HoistPattern(statement.handler.param),
        [],
        scope1),
      statements = ArrayLite.concat(
        Build.Statement(
          Short.assign(
            null,
            node.handler.param,
            Tokens.error,
            scope2)),
        Build.Block(
          Short.BLOCK(node.AranStrict, node.handler.body.body, scope2))),
      Build.BLOCK(
        Scope.qualifiers(scope2),
        ArrayLite.flatMap(
          Scope.stickers(scope2),
          (token) => Build.Write(
            token,
            Build.primitive(false))),
        statements)) :
    Build.BLOCK([], [])),
  Short.BLOCK(node.AranStrict, node.finalizer.body, scope1));

exports.DebuggerStatement = (node, scope) => Build.Debugger();

exports.VariableDeclaration = (node, scope) => ArrayLite.flatMap(
  node.declarations,
  (declaration, method) => Short.assign(
    node.kind === "var" ? node.AranStrict : null,
    declaration.id,
    (
      declaration.init ?
      Visit.expression(declaration.init, scope) :
      Build.primitive(void 0)),
    scope));

exports.WhileStatement = (node, scope) => Build.While(
  node.AranParent.type === "LabeledStatement" ? node.AranParent.label.name : null,
  Visit.expression(node, scope),
  Short.BLOCK(
    node.AranStrict,
    (
      node.body.type === "BlockStatement" ?
      node.body.body :
      [nod.body]),
    scope));

exports.DoWhileStatement = (node, scope) => (
  token = Scope.token(scope),
  ArrayLite.concat(
    Build.Write(
      token,
      Build.primitive(true)),
    Build.While(
      node.AranParent.type === "LabeledStatement" ? node.AranParent.label.name : null,
      Build.conditional(
        Build.read(token),
        Build.write(
          token,
          Build.primitive(false),
          Build.primitive(true)),
        Visit.expression(node.test, scope)),
      Short.BLOCK(
        node.AranStrict,
        (
          node.body.type === "BlockStatement" ?
          node.body.body :
          [node.body]),
        scope))));

// // for (let x; y; z) { ... }
// //
// // { 
// //   let x;
// //   while (y) { ... z; }
// // }

// // TODO
// exports.ForStatement = (node, scope) => (
//   (
//     node.AranCompletion ?
//     Build.Write(
//       0,
//       Build.primitive(void 0, node.AranSerial),
//       node.AranSerial) :
//     []),
//   (
//     node.init && node.init === "VariableDeclaration" ?
//     (
//       scope2 = Scope.statement(node.init),


//   Build.Block(
//     Build.BLOCK(

//   Util.Loop(
//     (
//       node.init ?
//       (
//         node.init.type === "VariableDeclaration" ?
//         Util.Declaration(node.init) :
//         ARAN.build.Statement(
//           Build.$drop(
//             Visit.expression(node.init)))) :
//       []),
//     (
//       node.test ?
//       Visit.expression(node.test) :
//       Build.primitive(true)),
//     [],
//     node.body,
//     (
//       node.update ?
//       ARAN.build.Statement(
//         Build.$drop(
//           Visit.expression(node.update))) :
//       [])));

// // for (k in o) { ... }
// //
// // let _ks1 = [];
// // let _o = o;
// // while (o) {
// //   let _ks2 = keys(o);
// //   let _i2 = 0;
// //   while (_i2 < _ks2.length) {
// //     _ks1[_ks1.length] = _ks2[_i2];
// //     _i2 = i2 +1;
// //   }
// //   o = getPrototypeOf(o);
// // }
// // let _i1 = 0;
// // while (_i1 < _ks1.length) {
// //   k1 = _ks1[_i1];
// //   ...
// //   i1 = i1 + 1;
// // }

// exports.ForInStatement = (node, scope, token) => ArrayLite.concat(
//   (
//     node.AranCompletion ?
//     Build.Write(
//       0,
//       Build.primitive(void 0, node.AranSerial),
//       node.AranSerial) :
//     []),
//   (
//     (pattern) => Build.While(
//       Build.conditional(
//         Helper.binary(
//           "index"

//   (
//     node.left.type === "VariableDeclaration" && node.left.kind !== "var" ?
//     )

// // TODO
// exports.ForInStatement = (node) => Util.Completion(
//   ArrayLite.concat(
//     ARAN.build.Statement(
//       Interim.hoist(
//         "keys1",
//         Build.array([]))),
//     ARAN.build.Statement(
//       Interim.hoist(
//         "object",
//         Visit.expression(node.right))),
//     Build.While(
//       Build.$copy(
//         1,
//         Interim.read("object")),
//       ArrayLite.concat(
//         ARAN.build.Statement(
//           Interim.hoist(
//             "keys2",
//             Build.apply(
//               Build.$builtin("Object.keys"),
//               [
//                 Build.$copy(
//                   2,
//                   Interim.read("object"))]))),
//         ARAN.build.Statement(
//           Interim.hoist(
//             "index2",
//             Build.primitive(0))),
//         Build.While(
//           Build.binary(
//             "<",
//             Build.$copy(
//               1,
//               Interim.read("index2")),
//             Util.get(
//               Build.$copy(
//                 3,
//                 Interim.read("keys2")),
//               Build.primitive("length"))),
//           ArrayLite.concat(
//             ARAN.build.Statement(
//               Util.set(
//                 false,
//                 Build.$copy(
//                   4,
//                   Interim.read("keys1")),
//                 Util.get(
//                   Build.$copy(
//                     1,
//                     Interim.read("keys1")),
//                   Build.primitive("length")),
//                 Util.get(
//                   Build.$copy(
//                     4,
//                     Interim.read("keys2")),
//                   Build.$copy(
//                     4,
//                     Interim.read("index2"))))),
//             ARAN.build.Statement(
//               Interim.write(
//                 "index2",
//                 Build.binary(
//                   "+",
//                   Interim.read("index2"),
//                   Build.primitive(1)))))),
//         ARAN.build.Statement(
//           Build.$drop(
//             Interim.read("index2"))),
//         ARAN.build.Statement(
//           Build.$drop(
//             Interim.read("keys2"))),
//         ARAN.build.Statement(
//           Interim.write(
//             "object",
//             Build.apply(
//               Build.$swap(
//                 1,
//                 2,
//                 Build.$builtin("Object.getPrototypeOf")),
//               [
//                 Interim.read("object")]))))),
//     ARAN.build.Statement(
//       Build.$drop(
//         Interim.read("object"))),
//     ARAN.build.Statement(
//       Interim.hoist(
//         "index1",
//         Build.primitive(0))),
//     ARAN.build.Try(
//       Util.Loop(
//         (
//           node.left.type === "VariableDeclaration" ?
//           Util.Declaration(node.left) :
//           []),
//         Build.binary(
//           "<",
//           Build.$copy(
//             1,
//             Interim.read("index1")),
//           Util.get(
//             Build.$copy(
//               3,
//               Interim.read("keys1")),
//             Build.primitive("length"))),
//         ARAN.build.Statement(
//           (
//             node.left.type === "MemberExpression" ?
//             Util.set(
//               ARAN.node.AranStrict,
//               Visit.expression(node.left.object),
//               Util.property(node.left),
//               Util.get(
//                 Build.$copy(
//                   4,
//                   Interim.read("keys1")),
//                 Build.$copy(
//                   4,
//                   Interim.read("index1")))) :
//             Util.assign(
//               (
//                 node.left.type === "VariableDeclaration" ?
//                 node.left.declarations[0].id :
//                 node.left),
//               Util.get(
//                 Build.$copy(
//                   2,
//                   Interim.read("keys1")),
//                 Build.$copy(
//                   2,
//                   Interim.read("index1")))))),
//         node.body,
//         ARAN.build.Statement(
//           Interim.write(
//             "index1",
//             Build.binary(
//               "+",
//               Interim.read("index1"),
//               Build.primitive(1))))),
//       ARAN.build.Throw(
//         ARAN.build.read("error")),
//       ArrayLite.concat(
//         ARAN.build.Statement(
//           Build.$drop(
//             Interim.read("index1"))),
//         ARAN.build.Statement(
//           Build.$drop(
//             Interim.read("keys1")))))));

// // TODO
// exports.ForOfStatement = (node) => Util.Completion(
//   ARAN.build.Try(
//     Util.Loop(
//       ArrayLite.concat(
//         (
//           node.left.type === "VariableDeclaration" ?
//           Util.Declaration(node.left) :
//           []),
//         ARAN.build.Statement(
//           Interim.hoist(
//             "iterator",
//             Build.invoke(
//               Visit.expression(node.right),
//               Build.$builtin("Symbol.iterator"),
//               [])))),
//       Build.unary(
//         "!",
//         Util.get(
//           Build.$copy(
//             1,
//             Interim.hoist(
//               "step",
//               Build.invoke(
//                 Build.$copy(
//                   1,
//                   Interim.read("iterator")),
//                 Build.primitive("next"),
//                 []))),
//           Build.primitive("done"))),
//       ARAN.build.Statement(
//         (
//           node.left.type === "MemberExpression" ?
//           Util.set(
//             ARAN.node.AranStrict,
//             Visit.expression(node.left.object),
//             Util.property(node.left),
//             Util.get(
//               Build.$copy(
//                 3,
//                 Interim.read("step")),
//               Build.primitive("value"))) :
//           Util.assign(
//             (
//               node.left.type === "VariableDeclaration" ?
//               node.left.declarations[0].id :
//               node.left),
//             Util.get(
//               Build.$copy(
//                 1,
//                 Interim.read("step")),
//               Build.primitive("value"))))),
//       node.body,
//       ARAN.build.Statement(
//         Build.$drop(
//           Interim.read("step")))),
//     ARAN.build.Throw(
//       ARAN.build.read("error")),
//     ArrayLite.concat(
//       ARAN.build.Statement(
//         Build.$drop(
//           Interim.read("step"))),
//       ARAN.build.Statement(
//         Build.$drop(
//           Interim.read("iterator"))))));

// // TODO
// exports.SwitchStatement = (node, temporary, statement) => Util.Completion(
//   (
//     temporary = ARAN.label,
//     ARAN.break = "B" + node.AranSerial,
//     statement = Build.Label(
//       ARAN.break,
//       ArrayLite.concat(
//         ARAN.build.Declare(
//           "let",
//           Unique("switch"),
//           Visit.expression(node.discriminant)),
//         Build.Switch(
//           ArrayLite.map(
//             node.cases,
//             (clause) => [
//               (
//                 clause.test ?
//                 Util.binary(
//                   Build.primitive("==="),
//                   Build.$copy(
//                     2,
//                     ARAN.build.read(
//                       Unique("switch"))),
//                   Visit.expression(clause.test)) :
//                 Build.primitive(true)),
//               ArrayLite.flatenMap(clause.consequent, Visit.Statement)])))),
//       ARAN.break = temporary,
//       ARAN.build.Try(
//         statement,
//         ARAN.build.Throw(
//           ARAN.build.read("error")),
//         ARAN.build.Statement(
//           Build.$drop(
//             Interim.read("switch"))))));


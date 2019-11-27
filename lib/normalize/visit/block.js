
const ArrayLite = require("array-lite");
const Build = require("../build.js");
const Scope = require("../scope");
const Query = require("../query.js");
const Visit = require("./index.js");

const common = (scope, nodes) => ArrayLite.concat(
  ArrayLite.flatMap(
    Query.GetFunctionDeclarations(nodes),
    (node) => Visit.Node(node, scope, [])),
  ArrayLite.flatMap(
    Query.GetNonFunctionDeclarations(nodes),
    (node) => Visit.Node(node, scope, [])));

exports.ProgramBody = (nodes, scope) => (
  (
    (scope, local) => Scope.BLOCK(
      scope,
      ArrayLite.concat(
        (
          local || Scope.GetStrict(scope) ?
          Query.VarNames(nodes) :
          []),
        Query.LetNames(nodes),
        ["@completion"]),
      ArrayLite.concat(
        local ? [] : ["this"],
        Query.ConstNames(nodes)),
      (scope) => ArrayLite.concat(
        (
          local ?
          [] :
          Scope.Initialize(
            scope,
            "this",
            Build.builtin("global"))),
        (
          Scope.Initialize(
            scope,
            "@completion",
            Build.primitive(void 0))),
        (
          local || Scope.GetStrict(scope) ?
          ArrayLite.flatMap(
            Query.BodyNames(node, "var"),
            (name) => Scope.Initialize(
              scope,
              name,
              Build.primitive(void 0))) :
          ArrayLite.flatMap(
            Query.BodyNames(node, "var"),
            (name) => Scope.Token(
              scope,
              Build.apply(
                Build.builtin("Object.create"),
                Build.primitive(void 0),
                [
                  Build.primitive(null)]),
              (token) => ArrayLite.concat(
                Build.Expression(
                  Build.apply(
                    Build.builtin("Reflect.set"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope, token),
                      Build.primitive("value"),
                      Build.apply(
                        Build.builtin("Reflect.get"),
                        Build.primitive(void 0),
                        [
                          Build.builtin("global"),
                          Build.primitive(name)])])),
                Build.Expression(
                  Build.apply(
                    Build.builtin("Reflect.set"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope2, token),
                      Build.primitive("writable"),
                      Build.primitive(true)])),
                Build.Expression(
                  Build.apply(
                    Build.builtin("Reflect.set"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope2, token),
                      Build.primitive("enumerable"),
                      Build.primitive(true)])),
                Build.Expression(
                  Build.apply(
                    Build.builtin("Reflect.set"),
                    Build.primitive(void 0),
                    [
                      Scope.read(scope2, token),
                      Build.primitive("configurable"),
                      Build.primitive(false)])),
                Build.Expression(
                  Build.apply(
                    Build.builtin("Reflect.defineProperty"),
                    Build.primitive(void 0),
                    [
                      Build.builtin("global"),
                      Build.primitive(name),
                      Scope.read(scope, token)])))))),
        common(scope, nodes)),
      (scope) => Scope.read(scope, "@completion")))
  (
    (
      (
        !Scope.GetStrict(scope) &&
        nodes.length > 0 &&
        Query.IsUseStrict(nodes[0])) ?
      Scope.ExtendStrict(scope) :
      scope),
    Boolean(scope)));

exports.ClosureBody = (nodes, scope, labels) => Scope.BLOCK(
  labels,
  (
    (
      !Scope.GetStrict(scope) &&
      nodes.length > 0 &&
      Query.IsUseStrict(nodes[0])) ?
    Scope.ExtendStrict(scope) :
    scope),
  ArrayLite.concat(
    Query.VarNames(nodes),
    Query.LetNames(nodes)),
  Query.ConstNames(nodes),
  (scope) => ArrayLite.concat(
    ArrayLite.flatMap(
      Query.VarNames(nodes),
      (name) => Scope.Initialize(
        scope,
        name,
        Build.primitive(void 0))),
    common(scope, nodes)));

exports.BlockBody = (nodes, scope, labels) => Scope.BLOCK(
  scope,
  labels,
  Query.LetNames(nodes),
  Query.ConstNames(nodes),
  (scope) => common(scope, nodes));

exports.SwitchBody = (nodes, scope, labels, closure) => Scope.BLOCK(
  scope,
  ArrayLite.concat(labels),
  Query.LetNames(ArrayLite.flatMap(nodes, (node) => node.consequent)),
  Query.ConstNames(ArrayLite.flat(nodes, (node) => node.consequent)),
  (scope) => ArrayLite.concat(
    ArrayLite.flatMap(
      ArrayLite.flatMap((nodes), (node) => Query.FunctionDeclarations(node.consequent)),
      (node) => Visit.Node(node, scope, [])),
    ArrayLite.flatMap(
      nodes,
      (node) => closure(
        scope,
        node.test
        Scope.BLOCK(
          scope,
          [],
          [],
          [],
          (scope) => ArrayLite.map(
            Query.NonFunctionDeclarations(node.consequent),
            (node) => Visit.Node(node, scope, [])))))));

// const helpers = Object_create(null);
// 
// // function AranThrowTypeError () {
// //   const message = arguments[0];
// //   throw new TypeError(message);
// // }
// helpers["HelperThrowTypeError"] = (scope) => Build.closure(
//   Scope.BLOCK(
//     scope,
//     [],
//     ["message"],
//     (scope) => ArrayLite.concat(
//       Build.Expression(
//         Build.conditional(
//           Build.argument("new.target"),
//           Build.primitive(null),
//           Build.argument("this"))),
//       Build.Expression(
//         Build.argument("length")),
//       Scope.Initialize(
//         scope,
//         "message",
//         Build.argument("next")),
//       Build.Throw(
//         Build.construct(
//           Build.builtin("TypeError"),
//           [
//             Scope.read(scope, "message")])))));
// 
// // function AranThrowReferenceError () {
// //   const message = arguments[0];
// //   throw new ReferenceError(message);
// // }
// helpers["HelperThrowReferenceError"] = (scope) => Build.closure(
//   Scope.BLOCK(
//     scope,
//     [],
//     ["message"],
//     (scope) => ArrayLite.concat(
//       Build.Expression(
//         Build.conditional(
//           Build.argument("new.target"),
//           Build.primitive(null),
//           Build.argument("this"))),
//       Build.Expression(
//         Build.argument("length")),
//       Scope.Initialize(
//         scope,
//         "message",
//         Build.argument("next")),
//       Build.Throw(
//         Build.construct(
//           Build.builtin("ReferenceError"),
//           [
//             Scope.read(scope, "message")])))));
// 
// 
// // function AranIsGlobal () {
// //   let object = global;
// //   const key = arguments[0];
// //   while (object) {
// //     if (Reflect.getOwnPropertyDescriptor(object, key)) {
// //       return true;
// //     } else {
// //       object = Reflect.getPrototypeOf(object);
// //     }
// //   }
// //   return false;
// // };
// helpers["HelperIsGlobal"] = (scope) => Build.closure(
//   Scope.BLOCK(
//     scope,
//     ["object"],
//     ["key"],
//     (scope) => ArrayLite.concat(
//       Build.Expression(
//         Build.conditional(
//           Build.argument("new.target"),
//           Build.primitive(null),
//           Build.argument("this"))),
//       Build.Expression(
//         Build.argument("length")),
//       Scope.Initialize(
//         scope,
//         "key",
//         Build.argument("next")),
//       Scope.Initialize(
//         scope,
//         "object",
//         Build.builtin("global")),
//       Build.While(
//         [],
//         Scope.read(scope, "object"),
//         Scope.BLOCK(
//           scope,
//           [],
//           [],
//           (scope) => Build.If(
//             [],
//             Build.apply(
//               Build.builtin("Reflect.getOwnPropertyDescriptor"),
//               Build.primitive(void 0),
//               [
//                 Scope.read(scope, "object"),
//                 Scope.read(scope, "key")]),
//             Scope.BLOCK(
//               scope,
//               [],
//               [],
//               (scope) => Build.Return(
//                 Build.primitive(true))),
//             Scope.BLOCK(
//               scope,
//               [],
//               [],
//               (scope) => Scope.Write(
//                 scope,
//                 "object",
//                 Build.apply(
//                   Build.builtin("Reflect.getPrototypeOf"),
//                   Build.primitive(void 0),
//                   [
//                     Scope.read(scope, "object")])))))),
//       Build.Return(
//         Build.primitive(false)))));
// 
// // function AranIteratorRest () {
// //   const iterator = arguments[0];
// //   const array = Array.of();
// //   let step;
// //   while ((step = Reflect.get(iterator, "next").call(iterator), !Reflect.get(step, "done"))) {
// //     Array.prototype.push.call(array, Reflect.get(step, "value"));
// //   }
// //   return array;
// // }
// helpers["HelperIteratorRest"] = (scope) => Build.closure(
//   Scope.BLOCK(
//     scope,
//     ["step"],
//     ["iterator", "array"],
//     (scope) => ArrayLite.concat(
//       Build.Expression(
//         Build.conditional(
//           Build.argument("new.target"),
//           Build.primitive(null),
//           Build.argument("this"))),
//       Build.Expression(
//         Build.argument("length")),
//       Scope.Initialize(
//         scope,
//         "iterator",
//         Build.argument("next")),
//       Scope.Initialize(
//         scope,
//         "array",
//         Build.apply(
//           Build.builtin("Array.of"),
//           Build.primitive(void 0),
//           [])),
//       Scope.Initialize(
//         scope,
//         "step",
//         Build.primitive(void 0)),
//       Build.While(
//         [],
//         Scope.write(
//           scope,
//           "step",
//           Build.apply(
//             Build.apply(
//               Build.builtin("Reflect.get"),
//               Build.primitive(void 0),
//               [
//                 Scope.read(scope, "iterator"),
//                 Build.primitive("next")]),
//             Scope.read(scope, "iterator"),
//             []),
//           Build.unary(
//             "!",
//             Build.apply(
//               Build.builtin("Reflect.get"),
//               Build.primitive(void 0),
//               [
//                 Scope.read(scope, "step"),
//                 Build.primitive("done")]))),
//         Scope.BLOCK(
//           scope,
//           [],
//           [],
//           (scope) => Build.Expression(
//             Build.apply(
//               Build.builtin("Array.prototype.push"),
//               Scope.read(scope, "array"),
//               [
//                 Build.apply(
//                   Build.builtin("Reflect.get"),
//                   Build.primitive(void 0),
//                   [
//                     Scope.read(scope, "step"),
//                     Build.primitive("value")])])))),
//       Build.Return(
//         Scope.read(scope, "array")))));
// 
// // function AranObjectSpread () {
// //   const target = arguments[0];
// //   const source = arguments[1];
// //   const keys = Object.keys();
// //   const length = Reflect.get(keys, "length");
// //   let index = 0;
// //   while (index < length) {
// //     const descriptor = Object.create(null);
// //     Reflect.set(descriptor, "value", Reflect.get(source, Reflect.get(keys, index)));
// //     Reflect.set(descriptor, "writable", true);
// //     Reflect.set(descriptor, "enumerable", true);
// //     Reflect.set(descriptor, "configurable", true);
// //     Object.defineProperty(target, Reflect.get(keys, index), descriptor);
// //     index = index + 1;
// //   }
// //   return target;
// // }
// helpers["HelperObjectSpread"] = (scope) => Build.closure(
//   Scope.BLOCK(
//     scope,
//     ["index"],
//     ["target", "source", "keys", "length"],
//     (scope) => ArrayLite.concat(
//       Build.Expression(
//         Build.conditional(
//           Build.argument("new.target"),
//           Build.primitive(null),
//           Build.argument("this"))),
//       Build.Expression(
//         Build.argument("length")),
//       Scope.Initialize(
//         scope,
//         "target",
//         Build.argument("next")),
//       Scope.Initialize(
//         scope,
//         "source",
//         Build.argument("next")),
//       Scope.Initialize(
//         scope,
//         "keys",
//         Build.apply(
//           Build.builtin("Object.keys"),
//           Build.primitive(void 0),
//           [
//             Scope.read(scope, "source")])),
//       Scope.Initialize(
//         scope,
//         "index",
//         Build.primitive(0)),
//       Scope.Initialize(
//         scope,
//         "length",
//         Build.apply(
//           Build.builtin("Reflect.get"),
//           Build.primitive(void 0),
//           [
//             Scope.read(scope, "keys"),
//             Build.primitive("length")])),
//       Build.While(
//         [],
//         Build.binary(
//           "<",
//           Scope.read(scope, "index"),
//           Scope.read(scope, "length")),
//         Scope.BLOCK(
//           scope,
//           [],
//           ["descriptor"],
//           (scope) => ArrayLite.concat(
//             Scope.Initialize(
//               scope,
//               "descriptor",
//               Build.apply(
//                 Build.builtin("Object.create"),
//                 Build.primitive(void 0),
//                 [
//                   Build.primitive(null)])),
//             Build.Expression(
//               Build.apply(
//                 Build.builtin("Reflect.set"),
//                 Build.primitive(void 0),
//                 [
//                   Scope.read(scope, "descriptor"),
//                   Build.primitive("value"),
//                   Build.apply(
//                     Build.builtin("Reflect.get"),
//                     Build.primitive(void 0),
//                     [
//                       Scope.read(scope, "source"),
//                       Build.apply(
//                         Build.builtin("Reflect.get"),
//                         Build.primitive(void 0),
//                         [
//                           Scope.read(scope, "keys"),
//                           Scope.read(scope, "index")])])])),
//             Build.Expression(
//               Build.apply(
//                 Build.builtin("Reflect.set"),
//                 Build.primitive(void 0),
//                 [
//                   Scope.read(scope, "descriptor"),
//                   Build.primitive("writable"),
//                   Build.primitive(true)])),
//             Build.Expression(
//               Build.apply(
//                 Build.builtin("Reflect.set"),
//                 Build.primitive(void 0),
//                 [
//                   Scope.read(scope, "descriptor"),
//                   Build.primitive("enumerable"),
//                   Build.primitive(true)])),
//             Build.Expression(
//               Build.apply(
//                 Build.builtin("Reflect.set"),
//                 Build.primitive(void 0),
//                 [
//                   Scope.read(scope, "descriptor"),
//                   Build.primitive("configurable"),
//                   Build.primitive(true)])),
//             Build.Expression(
//               Build.apply(
//                 Build.builtin("Reflect.defineProperty"),
//                 Build.primitive(void 0),
//                 [
//                   Scope.read(scope, "target"),
//                   Build.apply(
//                     Build.builtin("Reflect.get"),
//                     Build.primitive(void 0),
//                     [
//                       Scope.read(scope, "keys"),
//                       Scope.read(scope, "index")]),
//                   Scope.read(scope, "descriptor")])),
//             Scope.Write(
//               scope,
//               "index",
//               Build.binary(
//                 "+",
//                 Scope.read(scope, "index"),
//                 Build.primitive(1)))))),
//       Build.Return(
//         Scope.read(scope, "target")))));
// 
// // function AranObjectRest () => {
// //   const source = arguments[0];
// //   const blacklist = arguments[1];
// //   const keys = Object.keys(source);
// //   const target = Object.create(Object.prototype);
// //   const length2 = Reflect.get(keys, "length");
// //   let index2 = 0;
// //   while (index2 < length2) {
// //     const key2 = Reflect.get(keys2, index2);
// //     if (Array.prototype.includes.call(keys1, key2)) {
// //     } else {
// //       Reflect.set(target, key2, Reflect.get(source, key2));
// //     }
// //     index = index + 1;
// //   }
// // };
// helpers["HelperObjectRest"] = (scope) => Build.closure(
//   Scope.BLOCK(
//     scope,
//     ["index"],
//     ["source", "blacklist", "keys", "target", "length"],
//     (scope) => ArrayLite.concat(
//       Build.Expression(
//         Build.conditional(
//           Build.argument("new.target"),
//           Build.primitive(null),
//           Build.argument("this"))),
//       Build.Expression(
//         Build.argument("length")),
//       Scope.Initialize(
//         scope,
//         "source",
//         Build.argument("next")),
//       Scope.Initialize(
//         scope,
//         "blacklist",
//         Build.argument("next")),
//       Scope.Initialize(
//         scope,
//         "target",
//         Build.apply(
//           Build.builtin("Object.create"),
//           Build.primitive(void 0),
//           [
//             Build.primitive(void 0)])),
//       Scope.Initialize(
//         scope,
//         "keys",
//         Build.apply(
//           Build.builtin("Object.keys"),
//           Build.primitive(void 0),
//           [
//             Scope.read(scope, "source")])),
//       Scope.Initialize(
//         scope,
//         "length",
//         Build.apply(
//           Build.builtin("Reflect.get"),
//           Build.primitive(void 0),
//           [
//             Scope.read(scope, "keys"),
//             Build.primitive("length")])),
//       Scope.Initialize(
//         scope,
//         "index",
//         Build.primitive(0)),
//       Build.While(
//         [],
//         Build.binary(
//           "<",
//           Scope.read(scope, "index"),
//           Scope.read(scope, "length")),
//         Scope.BLOCK(
//           scope,
//           [],
//           ["key"],
//           (scope) => ArrayLite.concat(
//             Scope.Initialize(
//               scope,
//               "key",
//               Build.apply(
//                 Build.builtin("Reflect.get"),
//                 Build.primitive(void 0),
//                 [
//                   Scope.read(scope, "keys"),
//                   Scope.read(scope, "index")])),
//             Build.If(
//               [],
//               Build.apply(
//                 Build.builtin("Array.prototype.includes"),
//                 Scope.read(scope, "blacklist"),
//                 [
//                   Scope.read(scope, "key")]),
//               Scope.BLOCK(
//                 scope,
//                 [],
//                 [],
//                 (scope) => []),
//               Scope.BLOCK(
//                 scope,
//                 [],
//                 [],
//                 (scope) => Build.Expression(
//                   Build.apply(
//                     Build.builtin("Reflect.set"),
//                     Build.primitive(void 0),
//                     [
//                       Scope.read(scope, "target"),
//                       Scope.read(scope, "key"),
//                       Build.apply(
//                         Build.builtin("Reflect.get"),
//                         Build.primitive(void 0),
//                         [
//                           Scope.read(scope, "source"),
//                           Scope.read(scope, "key")])])))),
//             Scope.Write(
//               scope,
//               "index",
//               Build.binary(
//                 "+",
//                 Scope.read(scope, "index"),
//                 Build.primitive(1)))))),
//       Build.Expression(
//         Build.apply(
//           Build.builtin("Reflect.setPrototypeOf"),
//           Build.primitive(void 0),
//           [
//             Scope.read(scope, "target"),
//             Build.builtin("Object.prototype")])),
//       Build.Return(
//         Scope.read(scope, "target")))));


// ArrayLite.forEach(["ForStatement", "ForOfStatement", "ForInStatement"], (type) => {
//   const key = type === "ForStatement" ? "init" : "left";
//   exports[type] = (node1, scope, boolean) => {
//     if (node1[key].type !== "VariableDeclaration" || node1[key].kind === "var")
//       return Scope.BLOCK(scope, [], [], (scope) => Visit.Node(node1, scope));
//     const node2 = node1[key];
//     node1[key] = null;
//     const block = Scope.BLOCK(
//       scope,
//       (
//         node2.kind === "let" ?
//         ArrayLite.flatMap(node2.declarations, Query.DeclarationNames) :
//         []),
//       (
//         node2.kind === "const" ?
//         ArrayLite.flatMap(node2.declarations, Query.DeclarationNames) :
//         []),
//       (scope) => ArrayLite.concat(
//         Visit.Node(node2, scope),
//         Visit.Node(node1, scope)));
//     node1[key] = node2;
//     return block;
//   };
// });
// 
// ArrayLite.forEach([
//   "EmptyStatement",
//   "LabeledStatement",
//   "ExpressionStatement",
//   "FunctionDeclaration",
//   "DebuggerStatement",
//   "BreakStatement",
//   "ContinueStatement",
//   "ReturnStatement",
//   "ThrowStatement",
//   "TryStatement",
//   "WithStatement",
//   "IfStatement",
//   "WhileStatement",
//   "DoWileStatement",
//   "SwitchStatement"
// ], (type) => {
//   exports[type] = (node, scope, boolean) => {
//     return Scope.BLOCK(scope, [], [], (scope) => Visit.Node(node, scope));
//   };
// });

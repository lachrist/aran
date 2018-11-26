
// const Util = require("../util");
// const Visit = require("./");

// // with (new Proxy({x:1}, {
// //   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec)),
// //   has: (tgt, key) => (console.log("has", key), Reflect.has(tgt, key))
// // })) {
// //   x;
// // }

// // (
// //   (
// //     x in ARAN10 ?
// //     (ARAN11 = ARAN10[Symbol.unscopables]) ? ARAN11.x : false) :
// //     true) ?
// //   EXPRESSION :
// //   ARAN10.x

// exports.lookup = (scope, string, expression, onwith, onhit) => ArrayLite.reduce(
//   scope,
//   (expression, frame, number) => (
//     typeof frame === "number" ?
//     ARAN.cut.conditional(
//       ARAN.cut.conditional(
//         Builtin.has(
//           ARAN.cut.read(frame),
//           ARAN.cut.primitive(string)),
//         ARAN.cut.conditional(
//           ARAN.cut.hoist(
//             number = ++ARAN.counter,
//             Builtin.get(
//               ARAN.cut.read(frame),
//               ARAN.cut.builtin("Symbol.unscopables"))),
//           Builtin.get(
//             ARAN.cut.read(number),
//             ARAN.cut.primitive(string)),
//           ARAN.cut.primitive(false)),
//         ARAN.cut.primitive(true)),
//       expression,
//       onwith(number)),
//     (
//       string in frame.bindings ?
//       onhit(frame.bindings[string], string in frame.undeclared) :
//       expression)),
//   expression);

// exports.extends = (scope) => 

// exports.assignment = (pattern, expression, number) => ARAN.cut.sequence(
//   ARAN.cut.hoist(
//     number = ++ARAN.counter,
//     expression),
//   ...,
//   ARAN.cut.read(number));



// exports.property = (computed, node) => (
//   computed ?
//   Visit.expression(node) :
//   (
//     node.property.type === "Identifier" ?
//     ARAN.cut.primitive(node.name) :
//     ARAN.cut.primitive(node.value)));

// exports.Body = (node) => (
//   node.type === "BlockStatement" ?
//   ArrayLite.flatenMap(
//     node.body,
//     Visit.Statement) :
//   Visit.Statement(node));

// exports.$arguments = (elements) => (
//   ArrayLite.some(
//     elements,
//     (element) => element.type === "SpreadElement") ?

//   ARAN.build.array(
//     ArrayLite.map(elements, Visit.expression));



// exports.array = (elements) => ARAN.cut.apply(
//   ARAN.cut.builtin("Array.prototype.concat"),
//   ARAN.cut.apply(
//     ARAN.cut.builtin("Array.of"),
//     ARAN.cut.primitive(void 0),
//     []),
//   ArrayLite.map(
//     elements,
//     (element) => ARAN.cut.apply(
//       ARAN.cut.builtin(
//         (
//           element && element.type === "SpreadElement" ?
//           "Array.from",
//           "Array.of")),
//       ARAN.cut.primitive(void 0),
//       [
//         (
//           element ?
//           Visit.expression(
//             (
//               element.type === "SpreadElement" ?
//               element.argument :
//               element)) :
//           ARAN.cut.primitive(void 0))])));

// exports.closure = (node) => Util.closure(
//   {
//     arrow: node.type === "ArrowFunctionExpression",
//     callee: node.id && node.id.name,
//     // TODO handle AssignmentPattern: [x=()=>{}] = []; assert(x.name === "x");
//     name: (
//       node.id ?
//       node.id.name :
//       (
//         node.AranParent.type === "VariableDeclaration" ?
//         ArrayLite.reduce(
//           node.AranParent.declarations,
//           (result, declaration) => (
//             declaration.init === node ?
//             (
//               declaration.id.type === "Identifier" ?
//               declaration.id.name :
//               "") :
//             result),
//           null) :
//         (
//           node.AranParent.type === "ObjectExpression" ?
//           ArrayLite.reduce(
//             node.AranParent.properties,
//             (result, property) => (
//               property.value === node ?
//               (
//                 property.computed ?
//                 "" :
//                 (
//                   property.key.type === "Identifier" ?
//                   property.key.name :
//                   property.key.value)) :
//               result),
//             null) :
//           (
//             (
//               node.AranParent.type === "AssignmentExpression" &&
//               node.AranParent.right === node &&
//               node.AranParent.left.type === "identifier") ?
//             node.AranParent.left.name :
//             "")))) },
//   ArrayLite.map(node.patterns, Helpers.$pattern),
//   ArrayLite.flatenMap(Visit.Statement, node.body.body)); 

// exports.Declaration = (node) => {
//   const identifiers = (pattern) => {
//     if (pattern.type === "Identifier")
//       return [pattern.name];
//     if (pattern.type === "ObjectPattern")
//       return ArrayLite.flatenMap(pattern.properties, identifiers);
//     if (pattern.type === "ArrayPattern")
//       return ArrayLite.flatenMap(pattern.elements, identifiers);
//     if (pattern.type === "RestElement")
//       return identifiers(pattern.argument);
//     if (pattern.type === "AssignmentPattern")
//       return identifiers(pattern.left);
//     return [];
//   };
//   const statements1 = ArrayLite.flatenMap(
//     ArrayLite.flatenMap(
//       node.declarations,
//       (declarator) => identifiers(declarator.id)),
//     (identifier) => ARAN.cut.Declare(
//       node.kind,
//       identifier,
//       ARAN.cut.primitive(void 0)));
//   const statements2 = ArrayLite.flatenMap(
//     node.declarations,
//     (declarator) => ARAN.build.Statement(
//       ARAN.cut.$drop(
//         exports.assignment(declarator.id, declarator.init))))
//   return (
//     node.kind === "var" ?
//     ARAN.build.Hoist(statements1, statements2) :
//     ArrayLite.concat(statements1, statements2));
// };

// exports.Declaration = (node) => ArrayLite.flatenMap(
//   node.declarations,
//   (declarator, local) => (
//     declarator.init ?
//     Util.Declare(
//       node.kind,
//       declarator.id,
//       Visit.expression(declarator.init)) :
//     (
//       local = ARAN.cut.Declare(
//         node.kind,
//         declarator.id.name,
//         ARAN.cut.primitive(void 0)),
//       (
//         node.kind === "var" ?
//         (
//           ARAN.hoisted[ARAN.hoisted.length] = local,
//           []) :
//         local))));

// exports.$pattern = (pattern) => {
//   if (pattern.type === "ObjectPattern")
//     return {
//       type: "ObjectPattern",
//       properties: ArrayLite.map(
//         pattern.properties,
//         (property) => ({
//           type: "Property",
//           value: exports.$pattern(property.value),
//           kind: "init",
//           method: false})) };
//   if (pattern.type === "ArrayPattern")
//     return {
//       type: "ArrayPattern",
//       elements: ArrayLite.map(
//         pattern.elements,
//         (element) => (
//           element &&
//           exports.$pattern(element))) };
//   if (pattern.type === "RestElement")
//     return {
//       type: "RestElement",
//       argument: exports.$pattern(pattern.argument) };
//   if (pattern.type === "AssignmentPattern")
//     return {
//       type: "AssignmenPattern",
//       left: exports.$pattern(pattern.left),
//       right: Visit.expression(pattern.right) };
//   if (pattern.type === "MemberExpression")
//     return {
//       type: "MemberExpression",
//       computed: true,
//       object: Visit.expression(pattern.object),
//       property: exports.property(pattern.computed, pattern.property) };
//   throw new Error("Unknwon pattern: "+pattern.type);
// };

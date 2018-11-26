
// Version based on Object.defineProperty, Object.fromEntries and Array.of
// exports.ObjectExpression = (node) => (
//   ArrayLite.every(
//     node.properties,
//     (property) => property.kind === "init") ?
//   Build.apply(
//     Build.builtin("Object.fromEntries"),
//     Build.primitive(void 0),
//     [
//       Build.apply(
//         Build.builtin("Array.of"),
//         Build.primitive(void 0),
//         ArrayLite.map(
//           node.properties,
//           (property) => Build.apply(
//             Build.builtin("Array.of"),
//             Build.primitive(void 0),
//             [
//               (
//                 property.computed ?
//                 Visit.expression(property.key) :
//                 Build.primitive(property.key.name || property.key.value)),
//               Visit.expression(property.value)])))]) :
//   ArrayLite.reduce(
//     ArrayLite.filter(
//       node.properties,
//       (property) => property.kind !== "init"),
//     (expression, property) => Build.apply(
//       Build.builtin("Object.defineProperty"),
//       Build.primitive(void 0),
//       [
//         expression,
//         (
//           property.computed ?
//           Visit.expression(property.key) :
//           Build.primitive(property.key.name || property.key.value)),
//         Build.apply(
//           Build.builtin("Object.fromEntries"),
//           Build.primitive(void 0),
//           [
//             Build.apply(
//               Build.builtin("Array.of"),
//               Build.primitive(void 0),
//               [
//                 Build.apply(
//                   Build.builtin("Array.of"),
//                   Build.primitive(void 0),
//                   [
//                     Build.primitive("configurable"),
//                     Build.primitive(true)]),
//                 Build.apply(
//                   Build.builtin("Array.of"),
//                   Build.primitive(void 0),
//                   [
//                     Build.primitive("enumerable"),
//                     Build.primitive(true)]),
//                 Build.apply(
//                   Build.builtin("Array.of"),
//                   Build.primitive(void 0),
//                   [
//                     Build.primitive(property.kind),
//                     Visit.expression(property.value)])])])]),
//     Build.apply(
//       Build.builtin("Object.fromEntries"),
//       Build.primitive(void 0),
//       [
//         Build.apply(
//           Build.builtin("Array.of"),
//           Build.primitive(void 0),
//           ArrayLite.map(
//             ArrayLite.filter(
//               node.properties,
//               (property) => property.kind === "init"),
//             (property) => Build.apply(
//               Build.builtin("Array.of"),
//               Build.primitive(void 0),
//               [
//                 (
//                   property.computed ?
//                   Visit.expression(property.key) :
//                   Build.primitive(property.key.name || property.key.value)),
//                 Visit.expression(property.value)])))])));

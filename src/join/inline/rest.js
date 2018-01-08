
// function rest () {
//   const array = arguments[0];
//   const iterator = arguments[1];
//   let step = null;
//   while (!(step = iterator.next()).done) {
//     array[array.length] = step.value;
//   }
//   return array;
// }

module.exports = () => {
  throw new Error("Rest not supported *yet*");
};

// module.exports = () => Build.closure(
//   false,
//   Flaten(
//     ARAN.cut.While(
//       ARAN.cut.unary(
//         "!",
//         ARAN.cut.get(
//           Build.set(
//             Argument(2),
//             ARAN.cut.copy2(
//               ARAN.cut.apply(
//                 ARAN.cut.get(
//                   ARAN.cut.before.copy0(
//                     Argument(1)),
//                   ARAN.cut.primitive("next")),
//                 ARAN.cut.before.copy3(
//                   Argument(1)),
//                 [])))
//           ARAN.cut.primitive("done"))),
//       Build.Statement(
//         ARAN.cut.set(
//           ARAN.cut.copy2.before(
//             Build.read("array")),
//           Build.get(
//             ARAN.cut.copy0.before(
//               Build.read("array")),
//             ARAN.cut.primitive("length")),
//           Build.get(
//             ARAN.cut.copy2.before(
//               Buil.read("step")),
//             ARAN.cut.primitive("value"))))),
//     ARAN.cut.Drop(),
//     Build.Return(
//       Build.get(
//         Build.read("arguments"),
//         Build.primitive(1)))));
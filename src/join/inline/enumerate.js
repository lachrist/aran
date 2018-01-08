
const ArrayLite = require("array-lite");
const Visit = require("../visit");

exports.enumerate = () => {
  throw new Error("Enumerate not supported *yet*");
};

// function enumerate () {
//   const object = arguments[0];
//   const keys = [];
//   while (object) {
//     const array = ARAN.keys(object);
//     let index = 0;
//     let length = array.length;
//     while (index < length) {
//       keys[keys.length] = array[index];
//       index++;
//     }
//     object = ARAN.getPrototypeOf(object);
//   }
//   return keys;
// }

// Build.closure(
//   null,
//   ["object"],
//   [
//     ARAN.cut.while(
//       ARAN.cut.copy0.before(
//         Build.read("object")),
//       [
//         ARAN.cut.set(
//           ARAN.cut.copy1.before(
//             Build.read("keyss")),
//           ARAN.cut.get(
//             ARAN.cut.copy1.before(
//               Build.read("keyss")),
//             ARAN.cut.primitive("length")),
//           ARAN.cut.apply(
//             ARAN.cut.protect("Object.keys"),
//             null,
//             [
//               ARAN.cut.copy0(
//                 Build.read("object"))])),
//         Build.write(
//           "object",
//           ARAN.cut.apply(
//             ARAN.cut.protect("Object.getPrototypeOf"),
//             null,
//             [
//               Build.read("object")]))]),
//     ARAN.cut.Drop(),
//     Build.Return(
//       ARAN.cut.apply(
//         ARAN.cut.protect("Reflect.apply"),
//         null,
//         [
//           ARAN.cut.protect("concat"),
//           ARAN.cut.array(),
//           Build.read("keyss")]))]);


const Build = require("./build.js");

// function (iterator, array, step) {
//   while(!(step = iterator.next()).done)
//     array[array.length] = step.value;
//   return array;
// }

module.exports = () => Build.closure(
  null,
  ["iterator", "array", "step"]
  [
    ARAN.cut.while(
      ARAN.cut.unary(
        "!",
        ARAN.cut.get(
          Build.write(
            "step",
            ARAN.cut.apply(
              Build.cut.get(
                ARAN.cut.copy0.before(
                  Build.read("iterator")),
                ARAN.cut.primitive("next")),
              ARAN.cut.copy0.before(
                Build.read("iterator")),
              [])),
          ARAN.cut.copy0.before(
            ARAN.cut.primitive("done")))),
      [
        Build.statement(
          ARAN.cut.set(
            ARAN.cut.copy2.before(
              Build.read("array")),
            Build.get(
              ARAN.cut.copy0.before(
                Build.read("array")),
              ARAN.cut.primitive("length")),
            Build.get(
              ARAN.cut.copy2.before(
                Buil.read("step")),
              ARAN.cut.primitive("value")))),
        ARAN.cut.Drop()]),
    ARAN.cut.Drop(),
    Build.Return(
      Build.read("array"))]);


const Build = require("../../build.js");
const Flaten = require("../../flaten.hs");
const Hide = require("../../hide.js");

// (function () {
//   while(!(arguments[2] = arguments[1].next()).done)
//     arguments[0][arguments[0].length] = arguments[2].value;
//   return arguments[0];
// } (array, iterator))

// TODO

module.exports = () => Build.closure(
  false,
  Flaten(
    ARAN.cut.While(
      ARAN.cut.unary(
        "!",
        ARAN.cut.get(
          Build.set(
            Argument(2),
            ARAN.cut.copy2(
              ARAN.cut.apply(
                ARAN.cut.get(
                  ARAN.cut.before.copy0(
                    Argument(1)),
                  ARAN.cut.primitive("next")),
                ARAN.cut.before.copy3(
                  Argument(1)),
                [])))
          ARAN.cut.primitive("done"))),
      Build.Statement(
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
            ARAN.cut.primitive("value"))))),
    ARAN.cut.Drop(),
    Build.Return(
      Build.get(
        Build.read("arguments"),
        Build.primitive(1)))));

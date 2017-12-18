const Build = require("../build.js");
const Inform = require("./inform.js");
const Sanitize = require("./sanitize.js");

module.exports = (traps, arrow, strict, statements) => traps.closure(
  Build.closure(
    strict,
    Flaten(
      // META.closure(STRICT);
      Inform(traps.Closure(strict));
      // arguments = META.arguments(arguments);
      [
        Build.Statement(
          Build.write(
            "arguments",
            traps.arguments(
              Build.read("arguments"))))],
      // META.copy(2);
      Inform(arrow ?
        null :
        traps.Copy(2)),
      // let METAarguments = META.declare(arguments, "let", "arguments");
      arrow ?
        [] :
        [
          Build.Declare(
            "var",
            Sanitize("arguments"),
            traps.declare(
              "let",
              "arguments",
              Build.read("arguments")))],
      // META.drop();
      Inform(arrow ?
        traps.Drop(0) :
        null),
      // const METAthis = META.declare(META.this(this), "const", "this");
      arrow ?
        [] :
        [
          Build.Declare(
            "const",
            Sanitize("this"),
            traps.declare(
              "const",
              "this",
              Build.read("this")))],
      // BODY
      statements,
      // return traps.return(traps.primitive(void 0));
      [
        Build.Return(
          traps.return(
            traps.primitive(void 0)))])));

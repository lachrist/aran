
const Build = require("../../build.js");
const Flaten = require("../../flaten.hs");
const Hide = require("../../hide.js");
const Visit = require("../visit");
const Helpers = require("./index.js");

module.exports = (pattern, expression) => Build.sequence(
  Flaten(
    Assign(
      null,
      [
        [
          pattern,
          ARAN.cut.copy0.after(
            Build.write(
              Hide("write"),
              Visit(expression)))]]),
    [
      Build.read(
        Hide("write"))]));

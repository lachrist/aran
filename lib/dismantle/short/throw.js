
const Build = require("../build.js");

exports.throw = (string1, string2) => Build.apply(
  Build.closure(
    Build.BLOCK(
      [],
      Build.Throw(
        Build.construct(
          Build.builtin(string1),
          [
            Build.primitive(string2)])))),
  Build.primitive(void 0),
  []);

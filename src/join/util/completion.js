
const ArrayLite = require("array-lite");

exports.Completion = (statements) => (
  ARAN.parent.AranCompletion ?
  ArrayLite.concat(
    ARAN.build.Statement(
      ARAN.cut.$completion(
        ARAN.cut.primitive(void 0))),
    statements) :
  statements);

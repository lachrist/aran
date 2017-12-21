
const ArrayLite = require("array-lite");
const Visit = require("../visit");

exports.Body = (statement) => (
  statement.type === "BlockStatement" ?
  ArrayLite.flaten(
    ArrayLite.map(
      statement.body,
      Visit.Statement)) :
  Visit.Statement(statement));

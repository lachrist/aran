
const ArrayLite = require("array-lite");
const Visit = require("../visit");

exports.Body = (node) => (
  node.type === "BlockStatement" ?
  ArrayLite.flaten(
    ArrayLite.map(
      node.body,
      Visit.Statement)) :
  Visit.Statement(node));

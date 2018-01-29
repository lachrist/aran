
const ArrayLite = require("array-lite");
const Visit = require("../visit");

exports.Body = (node) => (
  node.type === "BlockStatement" ?
  ArrayLite.flatenMap(
    node.body,
    Visit.Statement) :
  Visit.Statement(node));

const Visit = require("./visit");

module.exports = (root, scope) => {
  root.AranScope = scope;
  return Visit.PROGRAM(root);
};

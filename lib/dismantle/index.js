
const Visit = require("./visit");

module.exports = (root, scope, nodes) => {
  const temporary = global.ARAN;
  global.ARAN = {
    nodes,
    root,
    node: Array_isArray(scope) ? null : scope
  };
  const result = Visit.PROGRAM(
    root,
    (
      scope && "AranScope" in scope ?
      scope.AranScope :
      scope));
  global.ARAN = temporary;
  return result;
};

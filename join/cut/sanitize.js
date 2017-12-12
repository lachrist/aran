
const protected = ["this", "arguments", "error"];

module.exports = (identifier) => protected.indexOf(identifier) !== -1 ?
  Protect(identifier) :
  (identifier.indexOf(ARAN.namespace) === 0 ?
    (ARAN.namespace[0] === "$" ? "_" : "$") + identifier :
    identifier);

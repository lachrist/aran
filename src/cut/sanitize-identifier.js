
const apply = Reflect.apply;
const startsWith = String.prototype.startsWith;

module.exports = (identifier) => (
  identifier === "new.target" ?
  (ARAN.namespace[0] === "$" ? "_" : "$") + "newtarget" :
  (
    (
      identifier === "callee" ||
      identifier === "this" ||
      identifier === "arguments" ||
      identifier === "error" ||
      identifier === "completion" ||
      identifier[0] === (ARAN.namespace[0] === "$" ? "_" : "$") ||
      apply(startsWith, identifier, [ARAN.namespace])) ?
    (ARAN.namespace[0] === "$" ? "_" : "$") + identifier :
    identifier));

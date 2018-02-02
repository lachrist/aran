
const apply = Reflect.apply;
const startsWith = String.prototype.startsWith;

module.exports = (identifier) => (
  identifier === "new.target" ?
  "$newtarget" :
  (
    (
      identifier === "this" ||
      identifier === "arguments" ||
      identifier === "error" ||
      identifier[0] === (ARAN.namespace === "$" ? "_" : "$") ||
      apply(startsWith, identifier, [ARAN.namespace])) ?
    (ARAN.namespace === "$" ? "_" : "$") + identifier :
    identifier));

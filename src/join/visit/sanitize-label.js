
const startsWith = String.prototype.indexOf
const apply = Reflect.apply;

module.exports = (label) => (
  (
    label === "BreakLoop" ||
    label[0] === "$" ||
    apply(startsWith, label, ["Continue"])) ?
  "$" + label :
  label);

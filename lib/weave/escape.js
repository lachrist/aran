
module.exports = (identifier) => (
  identifier === "this" ?
  "_this" :
  (
    identifier === "new.target" ?
    "_new_target" :
    (
      typeof identifier === "string" ?
      "$" + identifier :
      identifier)));

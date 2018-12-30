
module.exports = (identifier) => (
  identifier === "this" ?
  "_this" :
  (
    identifier === "new.target" ?
    "_newtarget" :
    (
      typeof identifier === "string" ?
      "$" + identifier :
      identifier)));


module.exports = (identifier) => (
  typeof identifier === "number" ?
  "_" + identifier :
  identifier);

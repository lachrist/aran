
module.exports = (identifier) => (
  identifier === "new.target" ?
  "$0newtarget" :
  "$" + identifier);

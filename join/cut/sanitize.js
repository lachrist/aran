
const Protect = require("../protect.js");

const blacklist = ["this", "arguments", "error"];

module.exports = (identifier) => blacklist.indexOf(identifier) !== -1 ?
  Protect(identifier) :
  (identifier.indexOf(ARAN.namespace) === 0 ?
    (ARAN.namespace[0] === "$" ? "_" : "$") + identifier :
    identifier);

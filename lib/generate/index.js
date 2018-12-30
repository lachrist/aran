
const Estree = require("./estree");
const Script = require("./script.js");

module.exports = (block, namespace, type) => (
  type === "script" ? Script(block, namespace, type) :
  Estree.block(block, namespace, "program"));


module.exports = (block, {iseval:boolean, namespace}) => Visit.block(
  block,
  namespace,
  boolean ? "eval" : "program");

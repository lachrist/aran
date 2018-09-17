
module.exports = (identifier) => {
  if (identifier === "new.target")
    return "_new_target";
  if (identifier === "this")
    return "_this";
  return "$" + identifier;
  
    return "$newtarget";
  let prefix = "";
  for (let index = 0; identifier[index] === "$"; index++)
    prefix += "$";
  if (identifier === prefix + "newtarget")
    return "$$"+identifier;
  if (identifier === prefix + "this" ||
      identifier === prefix + "arguments" ||
      identifier === prefix + "eval" ||
      identifier === prefix + "callee" ||
      identifier === prefix + "completion" ||
      identifier === prefix + "error")
    return "$" + identifier;
  for (let index = 0; index < ARAN.namespace.length; index++) {
    if (identifier[prefix.length+index] !== ARAN.namespace[index]) {
      return identifier;
    }
  }
  return "$" + identifier;
};

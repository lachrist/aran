let depth = "";
Function.prototype.toString = function () {
  return this.name || "anonymous";
};
exports.apply = (callee, values, serial) => {
  console.log(depth + callee + "@" + serial + "(" + values.join(", ") + ")");
  depth += ".";
  const result = callee(...values);
  depth = depth.substring(1);
  console.log(depth + result);
  return result;
};
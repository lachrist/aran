
const Build = require("../../build");

module.exports = (key, array) => {
  array.push(Build.primitive(ARAN.index));
  return Build.call(
    Build.get(
      Build.read(ARAN.namespace),
      key),
    array);
};


const Build = require("../../build.js");

module.exports = (key, array) => {
  array[array.length] = Build.primitive(ARAN.index);
  return Build.call(
    Build.get(
      Build.read(ARAN.namespace),
      key),
    array);
};

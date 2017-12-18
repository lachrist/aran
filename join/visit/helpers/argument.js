
const Build = require("../build.js");

module.exports = (index) => Build.get(
  Build.read("arguments"),
  Build.primitive(index));

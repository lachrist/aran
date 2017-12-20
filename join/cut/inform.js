
const Build = require("../build.js");

module.exports = (expression) => expression ?
  Build.Statement(expression) :
  [];

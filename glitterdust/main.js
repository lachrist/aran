
var Aran = require("../main.js");

module.exports = function (master, code) {
  function require (module) {
    if (module === "aran")
      return Aran;
    throw new Error("Only ``aran'' can be required...");
  };
  var module = {};
  var exports = {};
  eval("(function () {\n"+master+"\n} ());");
  return module.exports(code);
};

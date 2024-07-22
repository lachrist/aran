
const ArrayLite = require("array-lite");

const Syntax = require("./syntax.js");
const Visitors = require("./visitor");

ArrayLite.forEach(["expression", "statement", "block"], (type) => {
  exports["_" + type] = (array, options) => {
    if (options.syntax) {
      Syntax[type](array, 1);
    }
    Visitors[type][array[0]](array, options);
  };
});

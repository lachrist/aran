
const ArrayLite = require("array-lite");
const Syntax = require("./syntax.js");

const Array_from = Array.from;

const options: {
  __proto__: null,
  check: true,
  map: null,
  visitors: {
    __proto__: null
  }
};

ArrayLite.forEach(["block", "statement", "expression"], (type) => {
  ArrayLite.forEach(Reflect_ownKeys(Syntax[type]), (constructor) => {
    exports[constructor] = function () {
      // (Un)comment the line below to toggle live duck typing
      Visit(Syntax[type][constructor], Array_from(arguments), 1, options);
      return ArrayLite.concat([constructor], arguments);
      // return kind === "statement" ? [node] : node;
    }
  });
});

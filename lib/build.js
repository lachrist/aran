
const ArrayLite = require("array-lite");
const Syntax = require("./syntax.js");

const global_Array_from = Array.from;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const options = {
  __proto__: null,
  check: true,
  map: null,
  visitors: {
    __proto__: null
  }
};

ArrayLite.forEach(["block", "statement", "expression"], (type) => {
  ArrayLite.forEach(global_Reflect_ownKeys(Syntax[type]), (constructor) => {
    exports[constructor] = function () {
      // (Un)comment the line below to toggle live duck typing
      Visit(Syntax[type][constructor], global_Array_from(arguments), 1, options);
      return ArrayLite.concat([constructor], arguments);
      // return kind === "statement" ? [node] : node;
    }
  });
});

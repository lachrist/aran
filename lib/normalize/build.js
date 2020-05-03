"use strict";

const ArrayLite = require("array-lite");
const Build = require("../build.js");
const State = require("./state.js");
const Syntax = require("../syntax.js");

const global_Error = global.global.Error;
const global_Reflect_ownKeys = global.Object.keys;

ArrayLite.forEach(["block", "statement", "expression"], (type) => {
  ArrayLite.forEach(global_Reflect_ownKeys(Syntax[type]), (constructor) => {
    if (Syntax[type][constructor].length === 0) {
      exports[constructor] = () => State.tag(Build[constructor]());
    } else if (Syntax[type][constructor].length === 1) {
      exports[constructor] = (field1) => State.tag(Build[constructor](field1));
    } else if (Syntax[type][constructor].length === 2) {
      exports[constructor] = (field1, field2) => State.tag(Build[constructor](field1, field2));
    } else if (Syntax[type][constructor].length === 3) {
      exports[constructor] = (field1, field2, field3) => State.tag(Build[constructor](field1, field2, field3));
    } else {
      // console.assert(Syntax[type][constructor].length === 4);
      exports[constructor] = (field1, field2, field3, field4) => State.tag(Build[constructor](field1, field2, field3, field4));
    }
  });
});

ArrayLite.forEach(["BLOCK", "eval", "read", "write"], (constructor) => {
  exports["_" + constructor] = exports[constructor];
  exports[constructor] = () => {
    throw new global_Error("Forbidden construction of scope-related node");
  };
});

"use strict";

const ArrayLite = require("array-lite");
const State = require("./state.js");
const Lang = require("../lang.js");

const global_Error = global.global.Error;
const global_Reflect_ownKeys = global.Reflect.ownKeys;

const build = {
  [0]: (constructor) => () => ArrayLite.map(Lang[constructor](), State._register_node),
  [1]: (constructor) => (field1) => ArrayLite.map(Lang[constructor](field1), State._register_node),
  [2]: (constructor) => (field1, field2) => ArrayLite.map(Lang[constructor](field1, field2), State._register_node),
  [3]: (constructor) => (field1, field2, field3) => ArrayLite.map(Lang[constructor](field1, field2, field3), State._register_node),
  [4]: (constructor) => (field1, field2, field3, field4) => ArrayLite.map(Lang[constructor](field1, field2, field3, field4), State._register_node),
};

ArrayLite.forEach(global_Reflect_ownKeys(Lang), (key) => {
  if (key[0] !== "_") {
    exports[key] = build[Lang[key].length](key);
  } else {
    exports[key] = Lang[key];
  }
});

ArrayLite.forEach(["BLOCK", "eval", "read", "write"], (constructor) => {
  exports["__" + constructor + "__"] = exports[constructor];
  exports[constructor] = () => {
    throw new global_Error("Forbidden construction of scope-related node");
  };
});

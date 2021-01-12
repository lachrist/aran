"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const Tree = require("../tree.js");
const State = require("./state.js");

const global_Reflect_ownKeys = global.Reflect.ownKeys;

const build = {
  [0]: (constructor) => () => State._register_node(Tree[constructor]()),
  [1]: (constructor) => (field1) => State._register_node(Tree[constructor](field1)),
  [2]: (constructor) => (field1, field2) => State._register_node(Tree[constructor](field1, field2)),
  [3]: (constructor) => (field1, field2, field3) => State._register_node(Tree[constructor](field1, field2, field3)),
  [4]: (constructor) => (field1, field2, field3, field4) => State._register_node(Tree[constructor](field1, field2, field3, field4)),
};

ArrayLite.forEach(global_Reflect_ownKeys(Tree), (key) => {
  if (key[0] !== "_") {
    exports[key] = build[Tree[key].length](key);
  } else if (key !== "_toggle_debug_mode") {
    exports[key] = Tree[key];
  }
});

ArrayLite.forEach(
  [
    "intrinsic",             // intrinsic.js
    "Block",                 // scope/layer-1-core.js
    "read",                  // scope/layer-1-core
    "write",                 // scope/layer-1-core
    "eval",                  // scope/layer-5-index
    "EnclaveDeclare",        // scope/layer-5-index
    "enclave_read",          // scope/layer-5-index
    "enclave_typeof",        // scope/layer-5-index
    "enclave_write",         // scope/layer-5-index
    "enclave_super_call",    // scope/layer-5-index
    "enclave_super_member",  // scope/layer-5-index
    "enclave_super_invoke"], // scope/layer-5-index
  (constructor) => {
    exports["__" + constructor + "__"] = exports[constructor];
    exports[constructor] = () => Throw.abort(null, `Forbidden construction`);
  });

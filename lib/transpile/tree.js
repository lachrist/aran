"use strict";

const ArrayLite = require("array-lite");
const Throw = require("../throw.js");
const Tree = require("../tree.js");
const State = require("./state.js");

const global_Reflect_apply = global.Reflect.apply;
const global_Reflect_ownKeys = global.Reflect.ownKeys;
const global_String_prototype_toUpperCase = global.String.prototype.toUpperCase;

const build = {
  [0]: (constructor) => () => State.registerNode(Tree[constructor]()),
  [1]: (constructor) => (field1) => State.registerNode(Tree[constructor](field1)),
  [2]: (constructor) => (field1, field2) => State.registerNode(Tree[constructor](field1, field2)),
  [3]: (constructor) => (field1, field2, field3) => State.registerNode(Tree[constructor](field1, field2, field3)),
  [4]: (constructor) => (field1, field2, field3, field4) => State.registerNode(Tree[constructor](field1, field2, field3, field4)),
};

ArrayLite.forEach(global_Reflect_ownKeys(Tree), (key) => {
  if (global_Reflect_apply(global_String_prototype_toUpperCase, key[0], []) === key[0]) {
    exports[key] = build[Tree[key].length](key);
  } else {
    exports[key] = Tree[key];
  }
});

ArrayLite.forEach([
  "IntrinsicExpression",          // intrinsic.js
  "Block",                        // scope/layer-1-core.js
  "ReadExpression",               // scope/layer-1-core && scope/layer-3-meta (TestBox only)
  "WriteExpression",              // scope/layer-1-core && scope/layer-3-meta (TestBox only)
  "EvalExpression",               // scope/layer-5-index
  "DeclareEnclaveStatement",      // scope/layer-5-index
  "ReadEnclaveExpression",        // scope/layer-5-index
  "TypeofEnclaveExpression",      // scope/layer-5-index
  "WriteEnclaveExpression",       // scope/layer-5-index
  "SuperCallEnclaveExpression",   // scope/layer-5-index
  "SuperMemberEnclaveExpression"  // scope/layer-5-index
], (constructor) => {
  exports["__" + constructor + "__"] = exports[constructor];
  exports[constructor] = () => Throw.abort(null, `Forbidden construction of ${constructor}`);
});

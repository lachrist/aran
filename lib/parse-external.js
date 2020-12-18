"use strict";

const global_Object_assign = global.Object.assign;

const Acorn = require("acorn");
const Parse = require("./parse.js");

const parser = {
  script: (code, options) => Acorn.parse(code, global_Object_assign({
    __proto__:null,
    ecmaVersion: 2021,
    sourceType: "script"
  }, options)),
  module: (code, options) => Acorn.parse(code, global_Object_assign({
    __proto__: null,
    ecmaVersion: 2021,
    sourceType: "module"
  }, options))
};

module.exports = (code, options) => Parse(code, global_Object_assign({
  __proto__: null,
  parser
}, options));

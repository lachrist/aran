"use strict";

const global_Object_assign = global.Object.assign;

const Acorn = require("acorn");
const Parser = require("./parser.js");

const script_option_object = {
  __proto__:null,
  ecmaVersion: 2021,
  sourceType: "script"
};

const module_option_object = {
  __proto__: null,
  ecmaVersion: 2021,
  sourceType: "module"
}

const parser = {
  parseScript: (code, offset) => Acorn.parse(code, script_option_object),
  parseModule: (code, offset) => Acorn.parse(code, module_option_object)
};

exports.parse = (code, source) => Parser.parse(code, source, parser);

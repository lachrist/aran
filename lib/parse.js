
const Acorn = require("acorn");
const ParseEval = require("./parse-eval.js");

const script_option_object = {
  __proto__: null,
  ecmaVersion: 2021,
  sourceType: "script"
};

const module_option_object = {
  __proto__: null,
  ecmaVersion: 2021,
  sourceType: "module"
};

exports.script = (code) => Acorn.parse(code, script_option_object);

exports.module = (code) => Acorn.parse(code, module_option_object);

exports.eval = (code, sort, options) => ParseEval(code, sort, options, exports.script);


const Acorn = require("acorn");
const ParseLocal = require("./parse-local.js");

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

exports.eval = (code, options) => (
  (
    options === null ||
    options === void 0) ?
  exports.script(code) :
  ParseLocal(code, options, exports));

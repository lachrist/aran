
const Assign = require("./assign.js");
const Closure = require("./closure.js");
const Class = require("./class.js");

exports._resolve_circular_dependencies = (expression_module, statement_module) => {
  Assign._resolve_circular_dependencies(expression_module);
  Closure._resolve_circular_dependencies(expression_module, statement_module);
  Class._resolve_circular_dependencies(expression_module);
};

exports.assign = Assign.assign;

exports.closure = Closure.closure;

exports.class = Class.class;

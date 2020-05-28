
"use strict";

// type Statement = estree.Statement
// type Property = estree.Property

const ArrayLite = require("array-lite");

const Eval = require("./eval.js");
const Access = require("./access.js");
const Hoisting = require("./hoisting.js");

exports._access = Access._access;

exports._is_direct_eval_call = Eval._is_direct_eval_call;

exports._is_dynamic_closure_frame = Eval._is_dynamic_closure_frame;

exports._param_hoisting = Hoisting._param;

exports._shallow_hoisting = Hoisting._shallow;

exports._deep_hoisting = Hoisting._deep;

exports._is_dynamic_closure_frame = Eval._is

// https://tc39.es/ecma262/#directive-prologue
exports._is_use_strict = (statements) => {
  for (let index = 0; index < statements.length; index++) {
    if (statements[index].type !== "ExpressionStatement") {
      return false;
    }
    if (statements[index].expression.type !== "Literal") {
      return false;
    }
    if (typeof statements[index].expression.value !== "string") {
      return false;
    }
    if (statements[index].expression.value === "use strict") {
      return true;
    }
  }
  return false;
};

exports._is_function_declaration = (statement) => statement.type === "FunctionDeclaration";

exports._is_not_function_declaration = (statement) => statement.type !== "FunctionDeclaration";

exports._is_init_property = (property) => (
  property.type !== "SpreadElement" &&
  property.kind === "init");

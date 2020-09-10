"use strict";

// type Statement = estree.Statement
// type Property = estree.Property

const ArrayLite = require("array-lite");

const Access = require("./access.js");
const Eval = require("./eval.js");
const Hoisting = require("./hoisting.js");
const Other = require("./other.js");
const Valuation = require("./valuation.js");

const global_Object_assign = global.Object.assign;

global_Object_assign(exports, Eval, Hoisting, Other, Valuation);

// Suggestion: directly build hoisting (with side effect for performance) and get rid of the access datastructure.
exports._get_implicit_hoisting = (node) => {
  const access = Access._access(node);
  const hoisting = {__proto__:null};
  if (access.is_direct_eval_call || access.is_callee_read || access.is_callee_written) {
    if (node.id !== null) {
      hoisting[node.id.name] = true;
    }
  }
  if (access.is_direct_eval_call || access.is_this_read) {
    hoisting["this"] = false;
  }
  if (access.is_direct_eval_call || access.is_new_target_read) {
    hoisting["new.target"] = false;
  }
  if (access.is_direct_eval_call || access.is_arguments_read || access.is_arguments_written) {
    hoisting["arguments"] = true;
  }
  return hoisting;
};

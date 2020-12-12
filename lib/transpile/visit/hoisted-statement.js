"use strict";

const ArrayLite = require("array-lite");
const Tree = require("../tree.js");
const Scope = require("../scope");
const Visit = require("./index.js");

exports.HoistedStatement = (scope, node, context) => visitors[node.type](scope, node, context);

const visitors = {__proto__:null};

visitors.FunctionDeclaration = (scope, node, context) => Tree.Lift(
  Scope.initialize(
    scope,
    "function",
    node.id.name,
    Visit.closure(
      scope,
      node,
      null)));

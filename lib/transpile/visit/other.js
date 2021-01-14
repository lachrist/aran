"use strict";

const global_Object_assign = global.Object.assign;

const Throw = require("../../throw.js");
const Scope = require("../scope");
const Tree = require("../tree.js");
const Intrinsic = require("../intrinsic.js");
const Visit = require("./index.js");

exports.visitKey = (scope, node, context) => (
  context = global_Object_assign({computed:false}, context),
  (
    context.computed ?
    Visit.visitExpression(scope, node, null) :
    (
      node.type === "Identifier" ?
      Tree.PrimitiveExpression(node.name) :
      (
        Throw.assert(node.type === "Literal", null, `Invalid non-computed key node`),
        Tree.PrimitiveExpression(node.value)))));

exports.visitNamed = (scope, node, context) => (
  context = global_Object_assign(
    {name:null},
    context),
  (
    (
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression") ?
    Visit.visitClosure(scope, node, {name:context.name}) :
    Visit.visitExpression(scope, node, null)));

"use strict";

const global_Object_assign = global.Object.assign;
const global_Error = global.Error;

const Scope = require("../scope");
const Tree = require("../tree.js");
const Builtin = require("../builtin.js");
const Visit = require("./index.js");

const assert = (check, message) => {
  if (!check) {
    throw new global_Error(message);
  }
};

const missing_callback = () => assert(false, `Missing callback`);

exports.key = (scope, node, context) => (
  context = global_Object_assign({computed:false}, context),
  (
    context.computed ?
    Visit.expression(scope, node, null) :
    (
      node.type === "Identifier" ?
      Tree.primitive(node.name) :
      (
        assert(node.type === "Literal", `Invalid non-computed key node`),
        Tree.primitive(node.value)))));

exports.quasi = (scope, node, context) => (
  assert(node.type === "TemplateElement", `Invalid quasi node`),
  Tree.primitive(node.value.cooked));

exports.member = (scope, node, context) => (
  assert(node.type === "MemberExpression", `Invalid member node`),
  context = global_Object_assign({callback: missing_callback}, context),
  Scope.box(
    scope,
    false,
    "ExpressionMemberObject",
    Visit.expression(scope, node.object, null),
    (box) => context.callback(
      box,
      (
        node.optional ?
        Builtin.fork_nullish(
          () => Scope.get(scope, box),
          Tree.primitive(void 0),
          Builtin.get(
            Builtin.convert_to_object(
              Scope.get(scope, box)),
            Visit.key(scope, node.property, {computed:node.computed}),
            null)) :
        Builtin.get(
          Builtin.fork_nullish(
            () => Scope.get(scope, box),
            null,
            null),
          Visit.key(scope, node.property, {computed:node.computed}),
          null)))));

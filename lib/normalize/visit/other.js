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

exports.super = (scope, node, context) => (
  assert(node.type === "Super", `Invalid super node`),
  context = global_Object_assign(
    {callee:false},
    context),
  (
    context.callee ?
    Tree.conditional( // console.assert(node.optional === false)
      Scope.read(scope, "this"),
      Builtin.throw_reference_error("Super constructor may only be called once"),
      Scope.get_super(scope)) :
    ( // console.assert(Scope._get_binding_self_nullable_box(scope) !== null)
      Scope._has_super(scope) ?
      Tree.conditional(
        Scope.read(scope, "this"),
        Builtin.get_prototype_of(
          Scope.get_self(scope)),
        Builtin.throw_reference_error("Super constructor must be called before accessing super property")) :
      Builtin.get_prototype_of(
        Scope.get_self(scope)))));

// exports.delete = (scope, node, context) => (
//   assert(node.type === "MemberExpression", `Invalid delete node`),
//   Builtin.delete_property(
//     Scope.box(
//       scope,
//       false,
//       "OtherDeleteObject",
//       Visit.expression(scope, node.object, null),
//       (box) => Builtin.fork_nullish(
//         () => Scope.get(scope, box),
//         null,
//         null)),
//     Visit.key(scope, node.property, {computed:node.computed}),
//     Scope._is_strict(scope),
//     Builtin._success_result));

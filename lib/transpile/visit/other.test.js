"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Parse = require("../../parse.js");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit._test_init(
  [
    require("./other.js"),
    {
      expression: (scope, node, context) => (
        Assert.deepEqual(context, null),
        Assert.deepEqual(node.type, "Literal"),
        Tree.primitive(node.value)),
      closure: (scope, node, context) => (
        Assert.deepEqual(node.type, "ArrowFunctionExpression"),
        Scope.get(scope, context.name))}]);

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {

  // key //

  Assert.throws(
    () => Visit.key(
      Scope._make_root(),
      Parse.script(`!123;`).body[0].expression,
      {computed: false}),
    new global.Error("Invalid non-computed key node")),

  Lang._match(
    Visit.key(
      Scope._make_root(),
      Parse.script(`123;`).body[0].expression,
      {computed: true}),
    Lang.parse_expression(`123`),
    Assert);

  Lang._match(
    Visit.key(
      Scope._make_root(),
      Parse.script(`123;`).body[0].expression,
      {computed: false}),
    Lang.parse_expression(`123`),
    Assert);

  Lang._match(
    Visit.key(
      Scope._make_root(),
      Parse.script(`foo;`).body[0].expression,
      {computed: false}),
    Lang.parse_expression(`"foo"`),
    Assert);

  // named //

  Lang._match(
    Visit.named(
      Scope._make_root(),
      Parse.script(`() => {};`).body[0].expression,
      {name:Scope._primitive_box("foo")}),
    Lang.parse_expression(`"foo"`),
    Assert);

  Lang._match(
    Visit.named(
      Scope._make_root(),
      Parse.script(`123;`).body[0].expression,
      {name:Scope._primitive_box("foo")}),
    Lang.parse_expression(`123`),
    Assert);

  // quasi //

  // Assert.throws(
  //   () => Visit.quasi(
  //     Scope._make_root(),
  //     Parse.script(`123;`).body[0].expression,
  //     {computed: false}),
  //   new global.Error("Invalid quasi node")),
  //
  // Lang._match(
  //   Visit.quasi(
  //     Scope._make_root(),
  //     Parse.script("`foo`").body[0].expression.quasis[0],
  //     null),
  //   Lang.parse_expression(`"foo"`),
  //   Assert);


  // member //

  // Assert.throws(
  //   () => Visit.member(
  //     Scope._make_root(),
  //     Parse.script(`123[456];`).body[0].expression,
  //     {}),
  //   new global.Error("Missing callback"));
  //
  // Assert.throws(
  //   () => Visit.member(
  //     Scope._make_root(),
  //     Parse.script(`123;`).body[0].expression,
  //     {}),
  //   new global.Error("Invalid member node"));
  //
  // Lang._match(
  //   Visit.member(
  //     Scope._make_root(),
  //     Parse.script(`123[456];`).body[0].expression,
  //     {callback: (box, expression) => Tree.sequence(
  //       Scope.get(
  //         Scope._make_root(),
  //         box),
  //       expression)}),
  //   Lang.parse_expression(`(
  //     123,
  //     #Reflect.get(
  //       (
  //         (
  //           (123 === null) ?
  //           true :
  //           (123 === void 0)) ?
  //         123 :
  //         #Object(123)),
  //       456))`),
  //   Assert);
  //
  // Lang._match(
  //   Visit.member(
  //     Scope._make_root(),
  //     Parse.script(`123?.[456];`).body[0].expression.expression,
  //     {callback: (box, expression) => Tree.sequence(
  //       Scope.get(
  //         Scope._make_root(),
  //         box),
  //       expression)}),
  //   Lang.parse_expression(`(
  //     123,
  //     (
  //       (
  //         (123 === null) ?
  //         true :
  //         (123 === void 0)) ?
  //       void 0 :
  //       #Reflect.get(
  //         #Object(123),
  //         456)))`),
  //   Assert);

  // super //

  // Assert.throws(
  //   () => Visit.super(
  //     Scope._make_root(),
  //     Parse.script(`123;`).body[0].expression,
  //     {}),
  //   new global.Error("Invalid super node"));
  //
  // Lang._match_block(
  //   Scope.CLOSURE_HEAD(
  //     Scope._make_root(),
  //     {
  //       sort: "constructor",
  //       super: Scope._primitive_box("foo"),
  //       self: Scope._primitive_box("bar"),
  //       newtarget: true},
  //     false,
  //     [
  //       {kind: "var", name: "this"}],
  //     (scope) => Tree.Lift(
  //       Tree.sequence(
  //         Visit.super(scope, {type:"Super"}, {callee:false}),
  //         Visit.super(scope, {type:"Super"}, {callee:true})))),
  //   Lang.PARSE_BLOCK(`{
  //     let $this;
  //     $this = void 0;
  //     (
  //       (
  //         $this ?
  //         #Reflect.getPrototypeOf("bar") :
  //         throw new #ReferenceError("Super constructor must be called before accessing super property")),
  //       (
  //         $this ?
  //         throw new #ReferenceError("Super constructor may only be called once") :
  //         "foo"));}`),
  //   Assert);
  //
  // Lang._match_block(
  //   Scope.CLOSURE_HEAD(
  //     Scope._make_root(),
  //     {
  //       sort: "constructor",
  //       super: null,
  //       self: Scope._primitive_box("foo"),
  //       newtarget: true},
  //     false,
  //     [],
  //     (scope) => Tree.Lift(
  //       Visit.super(scope, {type:"Super"}, {callee:false}))),
  //   Lang.PARSE_BLOCK(`{
  //     #Reflect.getPrototypeOf("foo");}`),
  //   Assert);

});

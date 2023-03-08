"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ParseExternal = require("../../parse-external.js");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit.initializeTest(
  [
    require("./other.js"),
    {
      visitExpression: (scope, node, context) => (
        Assert.deepEqual(context, null),
        Assert.deepEqual(node.type, "Literal"),
        Tree.PrimitiveExpression(node.value)),
      visitClosure: (scope, node, context) => (
        Assert.deepEqual(node.type, "ArrowFunctionExpression"),
        Scope.makeOpenExpression(scope, context.name))}]);

State.runSession({nodes:[], serials:new Map(), evals:{__proto__:null}}, () => {

  // key //

  Assert.throws(
    () => Visit.visitKey(
      Scope.RootScope(),
      ParseExternal(`!123;`).body[0].expression,
      {computed: false}),
    new global.Error("Invalid non-computed key node")),

  Lang.match(
    Visit.visitKey(
      Scope.RootScope(),
      ParseExternal(`123;`).body[0].expression,
      {computed: true}),
    Lang.parseExpression(`123`),
    Assert);

  Lang.match(
    Visit.visitKey(
      Scope.RootScope(),
      ParseExternal(`123;`).body[0].expression,
      {computed: false}),
    Lang.parseExpression(`123`),
    Assert);

  Lang.match(
    Visit.visitKey(
      Scope.RootScope(),
      ParseExternal(`foo;`).body[0].expression,
      {computed: false}),
    Lang.parseExpression(`"foo"`),
    Assert);

  // named //

  Lang.match(
    Visit.visitNamed(
      Scope.RootScope(),
      ParseExternal(`() => {};`).body[0].expression,
      {name:Scope.PrimitiveBox("foo")}),
    Lang.parseExpression(`"foo"`),
    Assert);

  Lang.match(
    Visit.visitNamed(
      Scope.RootScope(),
      ParseExternal(`123;`).body[0].expression,
      {name:Scope.PrimitiveBox("foo")}),
    Lang.parseExpression(`123`),
    Assert);

  // quasi //

  // Assert.throws(
  //   () => Visit.visitQuasi(
  //     Scope.RootScope(),
  //     ParseExternal(`123;`).body[0].expression,
  //     {computed: false}),
  //   new global.Error("Invalid quasi node")),
  //
  // Lang.match(
  //   Visit.visitQuasi(
  //     Scope.RootScope(),
  //     ParseExternal("`foo`").body[0].expression.quasis[0],
  //     null),
  //   Lang.parseExpression(`"foo"`),
  //   Assert);


  // member //

  // Assert.throws(
  //   () => Visit.visitMember(
  //     Scope.RootScope(),
  //     ParseExternal(`123[456];`).body[0].expression,
  //     {}),
  //   new global.Error("Missing callback"));
  //
  // Assert.throws(
  //   () => Visit.visitMember(
  //     Scope.RootScope(),
  //     ParseExternal(`123;`).body[0].expression,
  //     {}),
  //   new global.Error("Invalid member node"));
  //
  // Lang.match(
  //   Visit.visitMember(
  //     Scope.RootScope(),
  //     ParseExternal(`123[456];`).body[0].expression,
  //     {callback: (box, expression) => Tree.SequenceExpression(
  //       Scope.makeOpenExpression(
  //         Scope.RootScope(),
  //         box),
  //       expression)}),
  //   Lang.parseExpression(`(
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
  // Lang.match(
  //   Visit.visitMember(
  //     Scope.RootScope(),
  //     ParseExternal(`123?.[456];`).body[0].expression.expression,
  //     {callback: (box, expression) => Tree.SequenceExpression(
  //       Scope.makeOpenExpression(
  //         Scope.RootScope(),
  //         box),
  //       expression)}),
  //   Lang.parseExpression(`(
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
  //     Scope.RootScope(),
  //     ParseExternal(`123;`).body[0].expression,
  //     {}),
  //   new global.Error("Invalid super node"));
  //
  // Lang.match_block(
  //   Scope.makeHeadClosureBlock(
  //     Scope.RootScope(),
  //     {
  //       sort: "constructor",
  //       super: Scope.PrimitiveBox("foo"),
  //       self: Scope.PrimitiveBox("bar"),
  //       newtarget: true},
  //     false,
  //     [
  //       {kind: "var", name: "this"}],
  //     (scope) => Tree.ExpressionStatement(
  //       Tree.SequenceExpression(
  //         Visit.super(scope, {type:"Super"}, {callee:false}),
  //         Visit.super(scope, {type:"Super"}, {callee:true})))),
  //   Lang.parseBlock(`{
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
  // Lang.match_block(
  //   Scope.makeHeadClosureBlock(
  //     Scope.RootScope(),
  //     {
  //       sort: "constructor",
  //       super: null,
  //       self: Scope.PrimitiveBox("foo"),
  //       newtarget: true},
  //     false,
  //     [],
  //     (scope) => Tree.ExpressionStatement(
  //       Visit.super(scope, {type:"Super"}, {callee:false}))),
  //   Lang.parseBlock(`{
  //     #Reflect.getPrototypeOf("foo");}`),
  //   Assert);

});

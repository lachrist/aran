"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Base = require("./layer-4-base.js");

State.runSession({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {
  // _extend_dynamic //
  Assert.throws(
    () => Base.DynamicScope(
      Base.RootScope(),
      ["var", "let"],
      "tag",
      false,
      Base.PrimitiveBox(123)),
    new global.Error("Cannot mix rigid variables and loose variables inside dynamic frame"));
  // Declare //
  Lang.match(
    Base.makeDeclareStatement(
      Base.RootScope(),
      {
        kind: "var",
        name: "foo",
        exports: []},
      false,
      (scope, kind, identifier, expression) => Tree.ExpressionStatement(
        Tree.SequenceExpression(
          Tree.PrimitiveExpression(kind + "-" + identifier),
          expression))),
    Lang.parseSingleStatement(`("var-foo", void 0);`),
    Assert);
  Assert.deepEqual(
    Base.makeDeclareStatement(
      Base.RootScope(),
      {
        kind: "let",
        name: "foo",
        exports: []},
      false,
      (scope, kind, identifier, expression) => Tree.ExpressionStatement(
        Tree.SequenceExpression(
          Tree.PrimitiveExpression(kind + "-" + identifier),
          expression))),
    Tree.ListStatement([]));
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      ["var", "let"],
      (scope) => Tree.ListStatement(
        [
          Base.makeDeclareStatement(scope, {kind:"let", ghost:true, name:"x"}, false, () => Assert.fail()),
          (
            Assert.throws(() => Base.makeDeclareStatement(scope, {kind:"let", ghost:false, name:"x"}, false, () => Assert.fail()), new global.Error("Duplicate variable declaration")),
            Tree.ListStatement([])),
          Base.makeDeclareStatement(scope, {kind:"var", ghost:false, name:"y", exports:[]}, false, () => Assert.fail()),
          Base.makeDeclareStatement(scope, {kind:"var", ghost:false, name:"y", exports:[]}, false, () => Assert.fail()),
          Base.makeBoxStatement(
            scope,
            false,
            "frame",
            Tree.PrimitiveExpression(123),
            (box) => Tree.ListStatement(
              [
                Base.makeDeclareStatement(
                  Base.DynamicScope(scope, ["const"], "tag", false, box),
                  {kind:"const", ghost:false, name:"z", exports:[]},
                  false,
                  () => Assert.fail()),
                Base.makeDeclareStatement(
                  Base.DynamicScope(scope, ["var"], "tag", false, box),
                  {kind:"var", ghost:false, name:"t", exports:[]},
                  false,
                  () => Assert.fail()),
                Base.makeDeclareStatement(
                  Base.DynamicScope(scope, ["function"], "tag", false, box),
                  {kind:"function", ghost:false, name:"f", exports:[]},
                  false,
                  () => Assert.fail()),
                Base.makeDeclareStatement(
                  Base.DynamicScope(scope, ["function"], "tag", false, box),
                  {kind:"function", ghost:false, name:"g", exports:[]},
                  true,
                  () => Assert.fail())])),
                Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(
      `{
        let $$y, $_descriptor;
        $$y = void 0;
        (
          #Reflect.getOwnPropertyDescriptor(123, "z") ?
          throw new #SyntaxError("Rigid variable of kind const named 'z' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
          #Object.defineProperty(
            123,
            "z",
            {
              __proto__: null,
              ["value"]: #aran.deadzoneMarker,
              ["writable"]: false,
              ["enumerable"]: true,
              ["configurable"]: false}));
        (
          #Reflect.getOwnPropertyDescriptor(123, "t") ?
          void 0 :
          #Object.defineProperty(
            123,
            "t",
            {
              __proto__: null,
              ["value"]: void 0,
              ["writable"]: true,
              ["enumerable"]: true,
              ["configurable"]: false}));
        #Object.defineProperty(
          123,
          "f",
          {
            __proto__: null,
            value: #Symbol("function-placeholder"),
            writable: true,
            enumerable: true,
            configurable: false});
        #Object.defineProperty(
          123,
          "g",
          {
            __proto__: null,
            value: #Symbol("function-placeholder"),
            writable: true,
            enumerable: true,
            configurable: (
              $_descriptor = #Reflect.getOwnPropertyDescriptor(123, "g"),
              (
                $_descriptor ?
                #Reflect.get($_descriptor, "configurable") :
                true))});
        completion "completion"; }`),
    Assert);
  // initialize //
  Lang.match(
    Base.makeInitializeStatement(
      Base.RootScope(),
      "let",
      "foo",
      Tree.PrimitiveExpression(123),
      false,
      () => Assert.fail(),
      (scope, kind, identifier, expression) => Tree.ExpressionStatement(
        Tree.SequenceExpression(
          Tree.PrimitiveExpression(`${kind}-${identifier}`),
          expression))),
    Lang.parseSingleStatement(`("let-foo", 123);`),
    Assert);
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      ["let"],
      (scope) => (
        // Assert.throws(
        //   () => Base.initialize(scope, "import", "foo", "qux", () => Assert.fail()),
        //   new global.Error("Must used import initialization for import variable")),
        Tree.ListStatement(
          [
            Base.makeInitializeStatement(
              scope,
              "var",
              "x",
              Tree.PrimitiveExpression(123),
              false,
              (scope, identifier, expression) => (
                Assert.deepEqual(identifier, "x"),
                expression),
              () => Assert.fail()),
            Base.makeDeclareStatement(scope, {kind:"let", ghost:false, name:"y", exports:["foo", "bar"]}, false, () => Assert.fail()),
            Base.makeInitializeStatement(
              scope,
              "let",
              "y",
              Tree.PrimitiveExpression(456),
              false,
              (scope, kind, identifier) => Assert.fail(),
              () => Assert.fail()),
            Base.makeBoxStatement(
              scope,
              false,
              "frame",
              Tree.PrimitiveExpression(789),
              (box) => Base.makeInitializeStatement(
                Base.DynamicScope(scope, ["const"], "tag", false, box),
                "const",
                "z",
                Tree.PrimitiveExpression(901),
                false,
                (scope, kind, identifier) => Assert.fail(),
                () => Assert.fail())),
            Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))]))),
    Lang.parseBlock(
      `{
        let $$y;
        123;
        (
          (
            $$y = 456,
            export foo $$y),
          export bar $$y);
        (
          #Reflect.has(789, "z") ?
          (
            (#Reflect.get(789, "z") === #aran.deadzoneMarker) ?
            #Reflect.defineProperty(
              789,
              "z",
              {
                __proto__: null,
                value: 901}) :
            throw new #SyntaxError("Variable named 'z' has already been initialized (this should never happen, please consider submitting a bug repport)")) :
          throw new #SyntaxError("Variable named 'z' has not yet been declared (this should never happen, please consider submitting a bug repport)"));
        completion "completion"; }`),
    Assert);
  // _is_available //
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      ["function", "const"],
      (scope) => (
        scope = Base.DynamicScope(
          scope,
          [],
          "tag1",
          false,
          Base.PrimitiveBox(123)),
        scope = Base.DynamicScope(
          scope,
          ["let"],
          "tag2",
          false,
          Base.PrimitiveBox(456)),
        scope = Base.DynamicScope(
          scope,
          ["var"],
          "tag3",
          false,
          Base.PrimitiveBox(789)),
        Tree.ListStatement(
          [
            Base.makeDeclareStatement(scope, {kind:"function", ghost:false, name:"x", exports:[]}, false, () => Assert.fail()),
            Base.makeDeclareStatement(scope, {kind:"const", ghost:true, name:"y", exports:[]}, false, () => Assert.fail()),
            (
              Assert.deepEqual(
                Base.isAvailable(scope, "function", "z"),
                ["tag2"]),
              Assert.deepEqual(
                Base.isAvailable(scope, "function", "x"),
                ["tag2"]),
              Assert.deepEqual(
                Base.isAvailable(scope, "const", "z"),
                ["tag3", "tag2"]),
              Assert.deepEqual(
                Base.isAvailable(scope, "const", "y"),
                null),
              Tree.ExpressionStatement(
                Tree.PrimitiveExpression(0))),
            Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))]))),
    Lang.parseBlock(`{
      let $$x;
      $$x = void 0;
      0;
      completion "completion"; }`),
    Assert);
  // lookup >> miss //
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Base.makeLookupExpression(
              scope,
              "x",
              {
                foo: "bar",
                on_miss: function () { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Tree.PrimitiveExpression(123)) },
                on_static_live_hit: () => Assert.fail(),
                on_static_dead_hit: () => Assert.fail(),
                on_dynamic_dead_hit: () => Assert.fail(),
                on_dynamic_live_hit: () => Assert.fail()})),
          Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      123;
      completion "completion"; }`),
    Assert);
  // lookup >> live hit //
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      ["let", "const"],
      (scope) => Tree.ListStatement(
        [
          Base.makeDeclareStatement(scope, {kind:"let", ghost:false, name:"x", exports:[]}, false, () => Assert.fail()),
          Base.makeInitializeStatement(
            scope,
            "let",
            "x",
            Tree.PrimitiveExpression(123),
            false,
            () => Assert.fail(),
            () => Assert.fail()),
          Base.makeDeclareStatement(scope, {kind:"const", ghost:false, name:"this", exports:[]}, false, () => Assert.fail()),
          Base.makeInitializeStatement(
            scope,
            "const",
            "this",
            Tree.PrimitiveExpression(456),
            false,
            () => Assert.fail(),
            () => Assert.fail()),
          Tree.ExpressionStatement(
            Base.makeLookupExpression(
              scope,
              "x",
              {
                foo: "bar",
                on_miss: () => Assert.fail(),
                on_static_live_hit: function (variable, read, write) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(variable, {kind:"let", ghost:false, name:"x", exports:[]}),
                  write(
                    Tree.PrimitiveExpression(789))) },
                on_static_dead_hit: () => Assert.fail(),
                on_dynamic_dead_hit: () => Assert.fail(),
                on_dynamic_live_hit: () => Assert.fail()})),
          Tree.ExpressionStatement(
            Base.makeLookupExpression(
              scope,
              "this",
              {
                foo: "bar",
                on_miss: () => Assert.fail(),
                on_static_live_hit: function (variable, read, write) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(variable, {kind:"const", ghost:false, name:"this", exports:[]}),
                  write(
                    Tree.PrimitiveExpression(901))) },
                on_static_dead_hit: () => Assert.fail(),
                on_dynamic_dead_hit: null,
                on_dynamic_live_hit: null})),
          Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`
      {
        let $$x, $$this;
        $$x = 123;
        $$this = 456;
        $$x = 789;
        $$this = 901;
        completion "completion"; }`),
    Assert);
  // lookup >> dead hit //
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      ["let", "const"],
      (scope) => Tree.ListStatement(
        [
          Base.makeDeclareStatement(scope, {kind:"let", ghost:true, name:"x", exports:[]}, false, () => Assert.fail()),
          Base.makeDeclareStatement(scope, {kind:"const", ghost:true, name:"this", exports:[]}, false, () => Assert.fail()),
          Tree.ExpressionStatement(
            Base.makeLookupExpression(
              scope,
              "x",
              {
                foo: "bar",
                on_miss: () => Assert.fail(),
                on_static_live_hit: () => Assert.fail(),
                on_static_dead_hit: function (variable) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(variable, {kind:"let", ghost:true, name:"x", exports:[]}),
                  Tree.PrimitiveExpression(123)) },
                on_dynamic_dead_hit: () => Assert.fail(),
                on_dynamic_live_hit: () => Assert.fail()})),
          Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`
      {
        123;
        completion "completion"; }`),
    Assert);
  // lookup >> on_dynamic_hit >> special_identifier //
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      ["var"],
      (scope) => Tree.ListStatement(
        [
          Base.makeDeclareStatement(scope, {kind:"var", ghost:false, name:"this", exports:[]}, false, () => Assert.fail()),
          Tree.ExpressionStatement(
            Base.makeLookupExpression(
              Base.DynamicScope(
                scope,
                [],
                "tag",
                false,
                Base.PrimitiveBox(123)),
              "this",
              {
                foo: "bar",
                on_miss: () => Assert.fail(),
                on_static_dead_hit: () => Assert.fail(),
                on_static_live_hit: function (variable, read, write) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(variable, {kind:"var", ghost:false, name:"this", exports:[]}),
                  write(
                    Tree.PrimitiveExpression(456))) },
                on_dynamic_dead_hit: null,
                on_dynamic_live_hit: null})),
          Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(
      `{
        let $$this;
        $$this = void 0;
        $$this = 456;
        completion "completion"; }`),
    Assert);
  // lookup >> on_dynamic_hit >> (not-unscopables && loose) //
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Base.makeLookupExpression(
              Base.DynamicScope(
                scope,
                ["var"],
                "tag",
                false,
                Base.PrimitiveBox(123)),
              "x",
              {
                foo: "bar",
                on_miss: function () { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Tree.PrimitiveExpression(456)) },
                on_static_live_hit: () => Assert.fail(),
                on_static_dead_hit: () => Assert.fail(),
                on_dynamic_dead_hit: () => Assert.fail(),
                on_dynamic_live_hit: function (tag, box) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(tag, "tag"),
                  Base.makeOpenExpression(scope, box)) }})),
          Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(
      `{
        (
          #Reflect.has(123, "x") ?
          123 :
          456);
        completion "completion"; }`),
    Assert);
  // lookup >> on_dynamic_hit >> (unscopables && rigid)
  Lang.match(
    Base.makeBlock(
      Base.RootScope(),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Base.makeLookupExpression(
              Base.DynamicScope(
                scope,
                ["let"],
                "tag",
                true,
                Base.PrimitiveBox(123)),
              "x",
              {
                foo: "bar",
                on_miss: function () { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Tree.PrimitiveExpression(456)) },
                on_static_live_hit: () => Assert.fail(),
                on_static_dead_hit: () => Assert.fail(),
                on_dynamic_dead_hit: function () { return Tree.PrimitiveExpression(789) },
                on_dynamic_live_hit: function (tag, box) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(tag, "tag"),
                  Base.makeOpenExpression(scope, box)) }})),
          Tree.CompletionStatement(Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(
      `{
        let $_unscopables;
        (
          (
            #Reflect.has(123, "x") ?
            (
              $_unscopables = #Reflect.get(123, #Symbol.unscopables),
              (
                (
                  (typeof $_unscopables === "object") ?
                  $_unscopables :
                  (typeof $_unscopables === "function")) ?
                !#Reflect.get($_unscopables, "x") :
                true)) :
            false) ?
          (
            (#Reflect.get(123, "x") === #aran.deadzoneMarker) ?
            789 :
            123) :
          456);
        completion "completion"; }`),
    Assert);
}, []);

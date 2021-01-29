"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Scope = require("./layer-5-index.js");

const state = {nodes:[], serials:new Map(), scopes:{__proto__:null}};

State.runSession(state, () => {

  /////////////
  // Binding //
  /////////////
  // sort //
  Assert.deepEqual(
    Scope.fetchSort(
      Scope.RootScope(null)),
    "program");
  Assert.deepEqual(
    Scope.fetchSort(
      Scope.RootScope({sort:"arrow"})),
    "arrow");
  // loop //
  Assert.deepEqual(
    Scope.fetchLoop(
      Scope.LoopBindingScope(
        Scope.RootScope(null),
        "foo")),
    "foo");
  // strict //
  Assert.deepEqual(
    Scope.isStrict(
      Scope.RootScope(null)),
    false);
  Assert.deepEqual(
    Scope.isStrict(
      Scope.StrictBindingScope(
        Scope.RootScope(null))),
    true);
  // completion //
  Assert.deepEqual(
    Scope.hasCompletion(
      Scope.RootScope(null)),
    false);
  Assert.deepEqual(
    Scope.hasCompletion(
      Scope.CompletionBindingScope(
        Scope.RootScope(null),
        Scope.PrimitiveBox(123))),
    true);
  Assert.deepEqual(
    Scope.makeCloseCompletionExpression(
      Scope.CompletionBindingScope(
        Scope.RootScope(null),
        Scope.TestBox("x")),
      Tree.PrimitiveExpression(123)),
    Tree.WriteExpression(
      "x",
      Tree.PrimitiveExpression(123)));
  Assert.deepEqual(
    Scope.makeOpenCompletionExpression(
      Scope.CompletionBindingScope(
        Scope.RootScope(null),
        Scope.PrimitiveBox(123))),
    Tree.PrimitiveExpression(123));

  ///////////////
  // Extension //
  ///////////////
  // GlobalDynamicScope //
  Scope.GlobalDynamicScope(Scope.RootScope(null));
  // WithDynamicScope //
  Scope.WithDynamicScope(Scope.RootScope(null));
  // makeModuleBlock //
  Lang.match(
    Scope.makeModuleBlock(
      Scope.RootScope(null),
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"let", ghost:false, name:"y", exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "var",
            "x",
            Tree.PrimitiveExpression(123)),
          Scope.makeInitializeStatement(
            scope,
            "let",
            "y",
            Tree.PrimitiveExpression(456)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      let $x, $y;
      $x = void 0;
      $x = 123;
      $y = 456;
      completion void 0; }`),
    Assert);
  // makeEvalBlock //
  Lang.match(
    Scope.makeEvalBlock(
      Scope.RootScope({strict:true, enclave:false}),
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"let", ghost:false, name:"y", exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "var",
            "x",
            Tree.PrimitiveExpression(123)),
          Scope.makeInitializeStatement(
            scope,
            "let",
            "y",
            Tree.PrimitiveExpression(456)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      let $x, $y;
      $x = void 0;
      $x = 123;
      $y = 456;
      completion "completion"; }`),
    Assert);
  Lang.match(
    Scope.makeEvalBlock(
      Scope.RootScope({strict:false, enclave:true}),
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"let", ghost:false, name:"y", exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "var",
            "x",
            Tree.PrimitiveExpression(123)),
          Scope.makeInitializeStatement(
            scope,
            "let",
            "y",
            Tree.PrimitiveExpression(456)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      let $y;
      enclave var x = void 0;
      enclave x ?= 123;
      $y = 456;
      completion "completion"; }`),
    Assert);
  // makeScriptBlock //
  Lang.match(
    Scope.makeScriptBlock(
      Scope.RootScope({enclave:true}),
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"let", ghost:false, name:"y", exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "var",
            "x",
            Tree.PrimitiveExpression(123)),
          Scope.makeInitializeStatement(
            scope,
            "let",
            "y",
            Tree.PrimitiveExpression(456)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression("completion"))])),
    Lang.parseBlock(`{
      enclave var x = void 0;
      enclave x ?= 123;
      enclave let y = 456;
      completion "completion"; }`),
    Assert);
  // makeCaseBlock //
  Lang.match(
    Scope.makeCaseBlock(
      Scope.RootScope(null),
      (scope) => Tree.ListStatement(
        [
          Tree.BranchStatement(
            Tree.Branch(
              [],
              Scope.makeNormalBlock(
                scope,
                [],
                (scope) => Tree.CompletionStatement(
                  Tree.PrimitiveExpression(123))))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(456))])),
    Lang.parseBlock(`{
      {
        completion 123; }
      completion 456; }`),
    Assert);
  // makeRegularBlock //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.RootScope(null),
      [
        {kind:"let", ghost:false, name:"x", exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "let",
            "x",
            Tree.PrimitiveExpression(123)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      let $x;
      $x = 123;
      completion void 0; }`),
    Assert);
  // makeHeadClosureBlock //
  Lang.match(
    Scope.makeHeadClosureBlock(
      Scope.RootScope(null),
      "function",
      false,
      [
        {kind:"var", ghost:false, name:"x", exports:[]}],
      (scope) => (
        Assert.deepEqual(
          Scope.fetchSort(scope),
          "function"),
        Tree.ListStatement(
          [
            Scope.makeInitializeStatement(
              scope,
              "var",
              "x",
              Tree.PrimitiveExpression(123)),
            Tree.CompletionStatement(
              Tree.PrimitiveExpression("completion"))]))),
    Lang.parseBlock(`{
      let $x;
      $x = void 0;
      $x = 123;
      completion "completion"; }`),
    Assert);
  Lang.match(
    Scope.makeHeadClosureBlock(
      Scope.RootScope({enclave:true}),
      "arrow",
      true,
      [
        {kind:"param", ghost:false, name:"x", exports:[]},
        {kind:"var", ghost:false, name:"y", exports:[]}],
      (scope) => (
        Assert.deepEqual(
          Scope.fetchSort(scope),
          "arrow"),
        Tree.ListStatement(
          [
            Scope.makeInitializeStatement(
              scope,
              "param",
              "x",
              Tree.PrimitiveExpression(123)),
            Scope.makeInitializeStatement(
              scope,
              "var",
              "y",
              Tree.PrimitiveExpression(456)),
            Tree.CompletionStatement(
              Tree.PrimitiveExpression("completion"))]))),
    Lang.parseBlock(`{
      let _frame, $x;
      _frame = {__proto__:null};
      (
        #Reflect.getOwnPropertyDescriptor(_frame, "y") ?
        void 0 :
        #Object.defineProperty(
          _frame,
          "y",
          {
            __proto__: null,
            value: void 0,
            writable: true,
            enumerable: true,
            configurable: false}));
      $x = 123;
      (
        #Reflect.has(_frame, "y") ?
        #Reflect.set(_frame, "y", 456) :
        enclave y ?= 456);
      completion "completion"; }`),
    Assert);
  // makeBodyClosureBlock //
  Lang.match(
    Scope.makeBodyClosureBlock(
      Scope.RootScope(null),
      false,
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"let", ghost:false, name:"y", exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "var",
            "x",
            Tree.PrimitiveExpression(123)),
          Scope.makeInitializeStatement(
            scope,
            "let",
            "y",
            Tree.PrimitiveExpression(456)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      let $x, $y;
      $x = void 0;
      $x = 123;
      $y = 456;
      completion void 0; }`),
    Assert);
  Lang.match(
    Scope.makeBodyClosureBlock(
      Scope.RootScope({enclave:true}),
      true,
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"let", ghost:false, name:"y", exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "var",
            "x",
            Tree.PrimitiveExpression(123)),
          Scope.makeInitializeStatement(
            scope,
            "let",
            "y",
            Tree.PrimitiveExpression(456)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      let _frame, $y;
      _frame = {__proto__:null};
      (
        #Reflect.getOwnPropertyDescriptor(_frame, "x") ?
        void 0 :
        #Object.defineProperty(
          _frame,
          "x",
          {
            __proto__: null,
            value: void 0,
            writable: true,
            enumerable: true,
            configurable: false}));
      (
        #Reflect.has(_frame, "x") ?
        #Reflect.set(_frame, "x", 123) :
        enclave x ?= 123);
      $y = 456;
      completion void 0; }`),
    Assert);

  ///////////
  // Other //
  ///////////
  // isAvailable //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.GlobalDynamicScope(
        Scope.RootScope(null)),
      [
        {kind:"let", name:"x", ghost:true, exports:[]}],
      (scope) => (
        Assert.deepEqual(
          Scope.isAvailable(scope, "let", "x"),
          false),
        Assert.deepEqual(
          Scope.isAvailable(scope, "let", "y"),
          true),
        Assert.deepEqual(
          Scope.isAvailable(scope, "var", "z"),
          null),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(123)))),
    Lang.parseBlock(`{
      completion 123; }`),
    Assert);
  // makeInitializeStatement //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.GlobalDynamicScope(
        Scope.RootScope(null)),
      [
        {kind:"let", name:"this", ghost:false, exports:[]},
        {kind:"let", name:"x", ghost:false, exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "let",
            "this",
            Tree.PrimitiveExpression(123)),
          Scope.makeInitializeStatement(
            scope,
            "let",
            "x",
            Tree.PrimitiveExpression(456)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      let $this, $x;
      $this = 123;
      $x = 456;
      completion void 0; }`),
    Assert);
  // makeEvalExpression //
  Assert.deepEqual(global.Reflect.ownKeys(state.scopes).length, 0);
  Lang.match(
    Scope.makeEvalExpression(
      Scope.RootScope({sort:"function", strict:true}),
      Tree.PrimitiveExpression(123)),
    Lang.parseExpression(`eval 123`),
    Assert);
  Assert.deepEqual(global.Reflect.ownKeys(state.scopes).length, 1);
  Assert.deepEqual(state.scopes[global.Reflect.ownKeys(state.scopes)[0]].context, {strict:true, sort:"function"});
  
  ////////////
  // Access //
  ////////////
  // on-missing (normal) //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.RootScope(null),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Scope.makeDeleteExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeTypeofExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeReadExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeWriteExpression(
              scope,
              "x",
              Tree.PrimitiveExpression(123))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      true;
      "undefined";
      throw new #ReferenceError("Cannot read from missing variable x");
      #Reflect.defineProperty(
        #aran.globalObjectRecord,
        "x",
        {
          __proto__: null,
          value: 123,
          writable: true,
          enumerable: true,
          configurable: true});
      completion void 0; }`),
    Assert);
  // on-missing (strict) //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.RootScope({strict:true}),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Scope.makeDeleteExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeTypeofExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeReadExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeWriteExpression(
              scope,
              "x",
              Tree.PrimitiveExpression(123))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      true;
      "undefined";
      throw new #ReferenceError("Cannot read from missing variable x");
      (
        123,
        throw new #ReferenceError("Cannot write to missing variable x"));
      completion void 0; }`),
    Assert);
  // on-missing (enclave) //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.RootScope({enclave:true}),
      [],
      (scope) => (
        Assert.throws(
          () => Scope.makeDeleteExpression(scope, "x"),
          Throw.EnclaveLimitationAranError),
        Tree.ListStatement(
          [
            Tree.ExpressionStatement(
              Scope.makeSuperCallExpression(
                scope,
                Tree.PrimitiveExpression("super-call"))),
            Tree.ExpressionStatement(
              Scope.makeSuperMemberExpression(
                scope,
                Tree.PrimitiveExpression("super-member"))),
            Tree.ExpressionStatement(
              Scope.makeTypeofExpression(scope, "x")),
            Tree.ExpressionStatement(
              Scope.makeReadExpression(scope, "x")),
            Tree.ExpressionStatement(
              Scope.makeReadExpression(scope, "this")),
            Tree.ExpressionStatement(
              Scope.makeWriteExpression(
                scope,
                "x",
                Tree.PrimitiveExpression(123))),
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(void 0))]))),
    Lang.parseBlock(`{
      enclave super(..."super-call");
      enclave super["super-member"];
      enclave typeof x;
      enclave x;
      enclave this;
      enclave x ?= 123;
      completion void 0; }`),
    Assert);
  // on-static-live-hit //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.RootScope({sort:"derived-constructor"}),
      [
        {kind:"let", name:"x", ghost:false, exports:[]},
        {kind:"const", name:"y", ghost:false, exports:[]},
        {kind:"const", name:"this", ghost:false, exports:[]},
        {kind:"const", name:"new.target", ghost:false, exports:[]},
        {kind:"const", name:"super", ghost:false, exports:[]},],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "let",
            "x",
            Tree.PrimitiveExpression("x")),
          Scope.makeInitializeStatement(
            scope,
            "const",
            "y",
            Tree.PrimitiveExpression("y")),
          Scope.makeInitializeStatement(
            scope,
            "const",
            "this",
            Tree.PrimitiveExpression("this")),
          Scope.makeInitializeStatement(
            scope,
            "const",
            "new.target",
            Tree.PrimitiveExpression("new.target")),
          Scope.makeInitializeStatement(
            scope,
            "const",
            "super",
            Tree.PrimitiveExpression("super")),
          Tree.ExpressionStatement(
            Scope.makeSuperCallExpression(
              scope,
              Tree.PrimitiveExpression("super-call"))),
          Tree.ExpressionStatement(
            Scope.makeSuperMemberExpression(
              scope,
              Tree.PrimitiveExpression("super-member"))),
          Tree.ExpressionStatement(
            Scope.makeDeleteExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeTypeofExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeReadExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeReadExpression(scope, "this")),
          Tree.ExpressionStatement(
            Scope.makeReadExpression(scope, "new.target")),
          Tree.ExpressionStatement(
            Scope.makeWriteExpression(
              scope,
              "x",
              Tree.PrimitiveExpression(123))),
          Tree.ExpressionStatement(
            Scope.makeWriteExpression(
              scope,
              "y",
              Tree.PrimitiveExpression(456))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      let $x, $y, $this, $0newtarget, $super;
      $x = "x";
      $y = "y";
      $this = "this";
      $0newtarget = "new.target";
      $super = "super";
      (
        $this ?
        throw new #ReferenceError("Super constructor may only be called once") :
        (
          $this = #Reflect.construct(
            #Reflect.get($super, "constructor"),
            "super-call",
            $0newtarget),
          $this));
      (
        $this ?
        #Reflect.get(
          #Reflect.getPrototypeOf(
            #Reflect.get($super, "prototype")),
          "super-member") :
        throw new #ReferenceError("Cannot access super property before calling super constructor"));
      false;
      typeof $x;
      $x;
      (
        $this ?
        $this :
        throw new #ReferenceError("Cannot read variable named 'this' before calling super constructor"));
      $0newtarget;
      $x = 123;
      (
        456,
        throw new #TypeError("Cannot write to static constant variable named y"));
      completion void 0; }`),
    Assert);
  // on-static-dead-hit //
  Lang.match(
    Scope.makeModuleBlock(
      Scope.RootScope(null),
      [
        {kind:"let", name:"x", ghost:false, exports:[]},
        {kind:"const", name:"this", ghost:false, exports:[]},
        {kind:"const", name:"super", ghost:false, exports:[]},
        {kind:"import", name:"m", ghost:true, exports:[], import:"foo", source:"bar"}],
      (scope) => (
        Assert.throws(
          () => Scope.makeReadExpression(scope, "this"),
          global.Error("Dead special variable named 'this'")),
        Assert.throws(
          () => Scope.makeSuperCallExpression(
            scope,
            Tree.PrimitiveExpression("dummy")),
          global.Error("Super identifier in deadzone (call)")),
        Assert.throws(
          () => Scope.makeSuperMemberExpression(
            scope,
            Tree.PrimitiveExpression("dummy")),
          global.Error("Super identifier in deadzone (member)")),
        Tree.ListStatement(
          [
            Tree.ExpressionStatement(
              Scope.makeDeleteExpression(scope, "x")),
            Tree.ExpressionStatement(
              Scope.makeTypeofExpression(scope, "x")),
            Tree.ExpressionStatement(
              Scope.makeTypeofExpression(scope, "m")),
            Tree.ExpressionStatement(
              Scope.makeReadExpression(scope, "x")),
            Tree.ExpressionStatement(
              Scope.makeReadExpression(scope, "m")),
            Tree.ExpressionStatement(
              Scope.makeWriteExpression(
                scope,
                "x",
                Tree.PrimitiveExpression(123))),
            Scope.makeInitializeStatement(
              scope,
              "let",
              "x",
              Tree.PrimitiveExpression("x")),
            Scope.makeInitializeStatement(
              scope,
              "const",
              "this",
              Tree.PrimitiveExpression("this")),
            Scope.makeInitializeStatement(
              scope,
              "const",
              "super",
              Tree.PrimitiveExpression("super")),
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(void 0))]))),
    Lang.parseBlock(`{
      let $x, $this, $super;
      false;
      throw new #ReferenceError("Cannot read type from non-initialized static variable named x");
      typeof import foo from "bar";
      throw new #ReferenceError("Cannot read from non-initialized static variable named x");
      import foo from "bar";
      (
        123,
        throw new #ReferenceError("Cannot write to non-initialized static variable named x"));
      $x = "x";
      $this = "this";
      $super = "super";
      completion void 0; }`),
    Assert);
  // on-dynamic-live-hit && on-dynamic-dead-hit //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.GlobalDynamicScope(
        Scope.RootScope(null)),
      [],
      (scope) => Tree.ListStatement(
        [
          Tree.ExpressionStatement(
            Scope.makeDeleteExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeTypeofExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeReadExpression(scope, "x")),
          Tree.ExpressionStatement(
            Scope.makeWriteExpression(
              scope,
              "x",
              Tree.PrimitiveExpression(123))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      (
        #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
        (
          (
            #Reflect.get(#aran.globalDeclarativeRecord, "x") ===
            #aran.deadzoneMarker) ?
          false :
          false) :
        (
          #Reflect.has(#aran.globalObjectRecord, "x") ?
          #Reflect.deleteProperty(#aran.globalObjectRecord, "x") :
          true));
      (
        #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
        (
          (
            #Reflect.get(#aran.globalDeclarativeRecord, "x") ===
            #aran.deadzoneMarker) ?
          throw new #ReferenceError("Cannot read type from non-initialized dynamic variable named x") :
          typeof #Reflect.get(#aran.globalDeclarativeRecord, "x")) :
        (
          #Reflect.has(#aran.globalObjectRecord, "x") ?
          typeof #Reflect.get(#aran.globalObjectRecord, "x") :
          "undefined"));
      (
        #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
        (
          (
            #Reflect.get(#aran.globalDeclarativeRecord, "x") ===
            #aran.deadzoneMarker) ?
          throw new #ReferenceError("Cannot read from non-initialized dynamic variable named x") :
          #Reflect.get(#aran.globalDeclarativeRecord, "x")) :
        (
          #Reflect.has(#aran.globalObjectRecord, "x") ?
          #Reflect.get(#aran.globalObjectRecord, "x") :
          throw new #ReferenceError("Cannot read from missing variable x")));
      (
        #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
        (
          (
            #Reflect.get(#aran.globalDeclarativeRecord, "x") ===
            #aran.deadzoneMarker) ?
          throw new #ReferenceError("Cannot write to non-initialized dynamic variable named x") :
          (
            #Reflect.set(#aran.globalDeclarativeRecord, "x", 123) ?
            true :
            throw new #TypeError("Cannot set object property"))) :
        (
          #Reflect.has(#aran.globalObjectRecord, "x") ?
          #Reflect.set(#aran.globalObjectRecord, "x", 123) :
          #Reflect.defineProperty(
            #aran.globalObjectRecord,
            "x",
            {
              __proto__: null,
              value: 123,
              writable: true,
              enumerable: true,
              configurable: true})));
      completion void 0; }`),
    Assert);
  // special write //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.RootScope(null),
      [
        {kind:"let", name:"x", ghost:false, exports:[]}],
      (scope) => Tree.ListStatement(
        [
          Scope.makeInitializeStatement(
            scope,
            "let",
            "x",
            Tree.PrimitiveExpression("x")),
          Tree.ExpressionStatement(
            Scope.makeWriteExpression(
              Scope.WithDynamicScope(
                scope,
                Scope.PrimitiveBox(123)),
              "x",
              Tree.PrimitiveExpression(456))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))])),
    Lang.parseBlock(`{
      let $x, _unscopables;
      $x = "x";
      (
        (
          #Reflect.has(123, "x") ?
          (
            (_unscopables = #Reflect.get(123, #Symbol.unscopables)),
            (
              (
                (typeof _unscopables === "object") ?
                _unscopables :
                (typeof _unscopables === "function")) ?
              !#Reflect.get(_unscopables, "x") :
              true)) :
          false) ?
        #Reflect.set(123, "x", 456) :
        $x = 456);
      completion void 0; }`),
    Assert);
  // special super //
  Lang.match(
    Scope.makeNormalBlock(
      Scope.RootScope(null),
      [
        {kind:"const", name:"super", ghost:false, exports:[]},
        {kind:"const", name:"this", ghost:false, exports:[]}],
      (scope, _statement1, _statement2) => (
        _statement1 = Scope.makeInitializeStatement(
          scope,
          "const",
          "super",
          Tree.PrimitiveExpression("super")),
        Assert.throws(
          () => Scope.makeSuperCallExpression(
            scope,
            Tree.PrimitiveExpression("dummy")),
          new global.Error("Dead special variable during super access")),
        _statement2 = Scope.makeInitializeStatement(
          scope,
          "const",
          "this",
          Tree.PrimitiveExpression("this")),
        Assert.throws(
          () => Scope.makeSuperCallExpression(
            scope,
            Tree.PrimitiveExpression("dummy")),
          new global.Error("Missing special variable during super access")),
        Tree.ListStatement([
          _statement1,
          _statement2,
          Tree.ExpressionStatement(
            Scope.makeSuperMemberExpression(
              scope,
              Tree.PrimitiveExpression("super-member"))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(void 0))]))),
    Lang.parseBlock(`{
      let $super, $this;
      $super = "super";
      $this = "this";
      #Reflect.get(
        #Reflect.getPrototypeOf(
          #Reflect.get($super, "prototype")),
        "super-member");
      completion void 0; }`),
    Assert);
});

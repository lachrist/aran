"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Base = require("./layer-4-base.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {
  // _extend_dynamic //
  Assert.throws(
    () => Base._extend_dynamic(
      Base._make_root(),
      ["var", "let"],
      "tag",
      false,
      Base._primitive_box(123)),
    new global.Error("Cannot mix rigid variables and loose variables inside dynamic frame"));
  // Declare //
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      ["var", "let"],
      (scope) => Tree.Bundle(
        [
          Base.Declare(scope, {kind:"let", ghost:true, name:"x"}, false),
          (
            Assert.throws(() => Base.Declare(scope, {kind:"let", ghost:false, name:"x"}, false), new global.Error("Duplicate variable declaration")),
            Tree.Bundle([])),
          Base.Declare(scope, {kind:"var", ghost:false, name:"y", exports:[]}, false),
          Base.Declare(scope, {kind:"var", ghost:false, name:"y", exports:[]}, false),
          Base.Box(
            scope,
            false,
            "frame",
            Tree.primitive(123),
            (box) => Tree.Bundle(
              [
                Base.Declare(
                  Base._extend_dynamic(scope, ["const"], "tag", false, box),
                  {kind:"const", ghost:false, name:"z", exports:[]},
                  false),
                Base.Declare(
                  Base._extend_dynamic(scope, ["var"], "tag", false, box),
                  {kind:"var", ghost:false, name:"t", exports:[]},
                  false),
                Base.Declare(
                  Base._extend_dynamic(scope, ["function"], "tag", false, box),
                  {kind:"function", ghost:false, name:"f", exports:[]},
                  false),
                Base.Declare(
                  Base._extend_dynamic(scope, ["function"], "tag", false, box),
                  {kind:"function", ghost:false, name:"g", exports:[]},
                  true)]))])),
    Lang.PARSE_BLOCK(
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
                true))}); }`),
    Assert);
  // initialize //
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      ["let"],
      (scope) => (
        // Assert.throws(
        //   () => Base.initialize(scope, "import", "foo", "qux", () => Assert.fail()),
        //   new global.Error("Must used import initialization for import variable")),
        Tree.Bundle(
          [
            Tree.Lift(
              Base.initialize(
                scope,
                "var",
                "x",
                Tree.primitive(123),
                false,
                (scope, identifier, expression) => (
                  Assert.deepEqual(identifier, "x"),
                  expression))),
            Base.Declare(scope, {kind:"let", ghost:false, name:"y", exports:["foo", "bar"]}, false),
            Tree.Lift(
              Base.initialize(
                scope,
                "let",
                "y",
                Tree.primitive(456),
                false,
                (scope, kind, identifier) => Assert.fail())),
            Base.Box(
              scope,
              false,
              "frame",
              Tree.primitive(789),
              (box) => Tree.Lift(
                Base.initialize(
                  Base._extend_dynamic(scope, ["const"], "tag", false, box),
                  "const",
                  "z",
                  Tree.primitive(901),
                  false,
                  (scope, kind, identifier) => Assert.fail())))]))),
    Lang.PARSE_BLOCK(
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
          throw new #SyntaxError("Variable named 'z' has not yet been declared (this should never happen, please consider submitting a bug repport)")); }`),
    Assert);
  // // ImportInitialize //
  // Lang._match(
  //   Base.EXTEND_STATIC(
  //     Base._make_root(),
  //     ["import"],
  //     (scope) => Tree.Bundle(
  //       [
  //         Base.Declare(scope, "import", "x"),
  //         Base.ImportInitialize(scope, "x", "source", false)])),
  //   Lang.PARSE_BLOCK(
  //     `{
  //       let _x;
  //       import * as _x from "source";}`),
  //   Assert);
  // _is_available //
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      ["var", "let"],
      (scope) => (
        scope = Base._extend_dynamic(
          scope,
          [],
          "tag",
          false,
          Base._primitive_box(123)),
        Tree.Bundle(
          [
            Base.Declare(scope, {kind:"var", ghost:false, name:"x", exports:[]}, false),
            Base.Declare(scope, {kind:"let", ghost:true, name:"y", exports:[]}, false),
            (
              Assert.deepEqual(
                Base._is_available(scope, "var", "x"),
                ["tag"]),
              Assert.deepEqual(
                Base._is_available(scope, "let", "y"),
                null),
              Tree.Lift(
                Tree.primitive(123)))]))),
    Lang.PARSE_BLOCK(`{
      let $$x;
      $$x = void 0;
      123; }`),
    Assert);
  // lookup >> miss //
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      [],
      (scope) => (
        // Assert.throws(
        //   () => Base.lookup(
        //     scope,
        //     true,
        //     "this",
        //     {
        //       foo: "bar",
        //       on_miss: () => Assert.fail(),
        //       on_static_live_hit: () => Assert.fail(),
        //       on_static_dead_hit: () => Assert.fail(),
        //       on_dynamic_dead_hit: () => Assert.fail(),
        //       on_dynamic_live_hit: () => Assert.fail()}),
        //   new global.Error("Missing special identifier")),
        Tree.Lift(
          Base.lookup(
            scope,
            "x",
            {
              foo: "bar",
              on_miss: function () { return (
                Assert.deepEqual(this.foo, "bar"),
                Tree.primitive(123)) },
              on_static_live_hit: () => Assert.fail(),
              on_static_dead_hit: () => Assert.fail(),
              on_dynamic_dead_hit: () => Assert.fail(),
              on_dynamic_live_hit: () => Assert.fail()})))),
    Lang.PARSE_BLOCK(`{123;}`),
    Assert);
  // lookup >> live hit //
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      ["let", "const"],
      (scope) => Tree.Bundle(
        [
          Base.Declare(scope, {kind:"let", ghost:false, name:"x", exports:[]}, false),
          Tree.Lift(
            Base.initialize(
              scope,
              "let",
              "x",
              Tree.primitive(123),
              false,
              () => Assert.fail())),
          Base.Declare(scope, {kind:"const", ghost:false, name:"this", exports:[]}, false),
          Tree.Lift(
            Base.initialize(
              scope,
              "const",
              "this",
              Tree.primitive(456),
              false,
              () => Assert.fail())),
          Tree.Lift(
            Base.lookup(
              scope,
              "x",
              {
                foo: "bar",
                on_miss: () => Assert.fail(),
                on_static_live_hit: function (variable, read, write) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(variable, {kind:"let", ghost:false, name:"x", exports:[]}),
                  write(
                    Tree.primitive(789))) },
                on_static_dead_hit: () => Assert.fail(),
                on_dynamic_dead_hit: () => Assert.fail(),
                on_dynamic_live_hit: () => Assert.fail()})),
          Tree.Lift(
            Base.lookup(
              scope,
              "this",
              {
                foo: "bar",
                on_miss: () => Assert.fail(),
                on_static_live_hit: function (variable, read, write) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(variable, {kind:"const", ghost:false, name:"this", exports:[]}),
                  write(
                    Tree.primitive(901))) },
                on_static_dead_hit: () => Assert.fail(),
                on_dynamic_dead_hit: null,
                on_dynamic_live_hit: null}))])),
    Lang.PARSE_BLOCK(`
      {
        let $$x, $$this;
        $$x = 123;
        $$this = 456;
        $$x = 789;
        $$this = 901; }`),
    Assert);
  // lookup >> dead hit //
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      ["let", "const"],
      (scope) => Tree.Bundle(
        [
          Base.Declare(scope, {kind:"let", ghost:true, name:"x", exports:[]}, false),
          Base.Declare(scope, {kind:"const", ghost:true, name:"this", exports:[]}, false),
          Tree.Lift(
            Base.lookup(
              scope,
              "x",
              {
                foo: "bar",
                on_miss: () => Assert.fail(),
                on_static_live_hit: () => Assert.fail(),
                on_static_dead_hit: function (variable) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(variable, {kind:"let", ghost:true, name:"x", exports:[]}),
                  Tree.primitive(123)) },
                on_dynamic_dead_hit: () => Assert.fail(),
                on_dynamic_live_hit: () => Assert.fail()})),
          (
            // Assert.throws(
            //   () => Tree.Lift(
            //     Base.lookup(
            //       scope,
            //       true,
            //       "this",
            //       {
            //         on_miss: () => Assert.fail(),
            //         on_static_live_hit: () => Assert.fail(),
            //         on_static_dead_hit: () => Assert.fail(),
            //         on_dynamic_dead_hit: () => Assert.fail(),
            //         on_dynamic_live_hit: () => Assert.fail()})),
            //   new global.Error("Special identifier in deadzone")),
            Tree.Bundle([]))])),
    Lang.PARSE_BLOCK(`
      {
        123; }`),
    Assert);
  // lookup >> on_dynamic_hit >> special_identifier //
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      ["var"],
      (scope) => Tree.Bundle(
        [
          Base.Declare(scope, {kind:"var", ghost:false, name:"this", exports:[]}, false),
          Tree.Lift(
            Base.lookup(
              Base._extend_dynamic(
                scope,
                [],
                "tag",
                false,
                Base._primitive_box(123)),
              "this",
              {
                foo: "bar",
                on_miss: () => Assert.fail(),
                on_static_dead_hit: () => Assert.fail(),
                on_static_live_hit: function (variable, read, write) { return (
                  Assert.deepEqual(this.foo, "bar"),
                  Assert.deepEqual(variable, {kind:"var", ghost:false, name:"this", exports:[]}),
                  write(
                    Tree.primitive(456))) },
                on_dynamic_dead_hit: null,
                on_dynamic_live_hit: null}))])),
    Lang.PARSE_BLOCK(
      `{
        let $$this;
        $$this = void 0;
        $$this = 456; }`),
    Assert);
  // lookup >> on_dynamic_hit >> (not-unscopables && loose) //
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      [],
      (scope) => Tree.Lift(
        Base.lookup(
          Base._extend_dynamic(
            scope,
            ["var"],
            "tag",
            false,
            Base._primitive_box(123)),
          "x",
          {
            foo: "bar",
            on_miss: function () { return (
              Assert.deepEqual(this.foo, "bar"),
              Tree.primitive(456)) },
            on_static_live_hit: () => Assert.fail(),
            on_static_dead_hit: () => Assert.fail(),
            on_dynamic_dead_hit: () => Assert.fail(),
            on_dynamic_live_hit: function (tag, box) { return (
              Assert.deepEqual(this.foo, "bar"),
              Assert.deepEqual(tag, "tag"),
              Base.get(scope, box)) }}))),
    Lang.PARSE_BLOCK(
      `{
        (
          #Reflect.has(123, "x") ?
          123 :
          456); }`),
    Assert);
  // lookup >> on_dynamic_hit >> (unscopables && rigid)
  Lang._match(
    Base.EXTEND_STATIC(
      Base._make_root(),
      [],
      [],
      (scope) => Tree.Lift(
        Base.lookup(
          Base._extend_dynamic(
            scope,
            ["let"],
            "tag",
            true,
            Base._primitive_box(123)),
          "x",
          {
            foo: "bar",
            on_miss: function () { return (
              Assert.deepEqual(this.foo, "bar"),
              Tree.primitive(456)) },
            on_static_live_hit: () => Assert.fail(),
            on_static_dead_hit: () => Assert.fail(),
            on_dynamic_dead_hit: function () { return Tree.primitive(789) },
            on_dynamic_live_hit: function (tag, box) { return (
              Assert.deepEqual(this.foo, "bar"),
              Assert.deepEqual(tag, "tag"),
              Base.get(scope, box)) }}))),
    Lang.PARSE_BLOCK(
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
          456); }`),
    Assert);
}, []);

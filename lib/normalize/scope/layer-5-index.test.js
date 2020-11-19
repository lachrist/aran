"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Scope = require("./layer-5-index.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  // MODULE //
  Assert.throws(
    () => Scope.MODULE(false, false, [{kind:"param", name:"x"}], () => Assert.fail()),
    new global.Error("Parameter variables in module block"));
  Lang._match_block(
    Scope.MODULE(
      false,
      false,
      [
        {kind: "var", name: "VAR"},
        {kind: "function", name:"FUNCTION"},
        {kind: "let", name: "LET"},
        {kind: "const", name: "CONST"},
        {kind: "class", name: "CLASS"}],
      (scope) => (
        Assert.deepEqual(
          Scope._is_strict(scope),
          true),
        Assert.deepEqual(
          Scope._has_completion(scope),
          false),
        Assert.throws(
          () => Scope.get_completion(scope),
          new global.Error("Missing box")),
        Tree.Lift(
          Scope.initialize(
            scope,
            "let",
            "LET",
            Tree.primitive(123))))),
    Lang.PARSE_BLOCK(
      `
        {
          let $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS;
          $$VAR = void 0;
          $$FUNCTION = void 0;
          $$LET = 123;}`),
    Assert);
  Lang._match_block(
    Scope.MODULE(
      true,
      true,
      [],
      (scope) => (
        Assert.deepEqual(
          Scope._is_strict(scope),
          true),
        Assert.deepEqual(
          Scope._has_completion(scope),
          true),
        Tree.Bundle(
          [
            Tree.Lift(
              Scope.get_completion(scope)),
            Tree.Lift(
              Scope.set_completion(
                scope,
                Tree.primitive(123)))]))),
    Lang.PARSE_BLOCK(
      `
        {
          let $_completion;
          $_completion = void 0;
          $_completion;
          $_completion = 123; }`),
    Assert);
  // SCRIPT //
  Assert.throws(
    () => Scope.SCRIPT(false, false, [{kind:"param", name:"x"}], () => Assert.fail()),
    new global.Error("Parameter variables in script block"));
  Lang._match_block(
    Scope.SCRIPT(
      false,
      false,
      [
        {kind: "var", name: "VAR"},
        {kind: "function", name:"FUNCTION"},
        {kind: "let", name: "LET"},
        {kind: "const", name: "CONST"},
        {kind: "class", name: "CLASS"}],
      (scope) => (
        Assert.deepEqual(
          Scope._is_strict(scope),
          false),
        Assert.deepEqual(
          Scope._has_completion(scope),
          false),
        Assert.throws(
          () => Scope.get_completion(scope),
          new global.Error("Missing box")),
        // Check CASE_KEY
        Tree.Lift(
          Tree.primitive(123)))),
    Lang.PARSE_BLOCK(
      `
        {
          (
            #Reflect.has(#aran.globalObjectRecord, "VAR") ?
            void 0 :
            #Reflect.defineProperty(
              #aran.globalObjectRecord,
              "VAR",
              {
                __proto__: null,
                value: void 0,
                writable: true,
                enumerable: true,
                configurable: false}));
          (
            #Reflect.has(#aran.globalObjectRecord, "FUNCTION") ?
            void 0 :
            #Reflect.defineProperty(
              #aran.globalObjectRecord,
              "FUNCTION",
              {
                __proto__: null,
                value: void 0,
                writable: true,
                enumerable: true,
                configurable: false}));
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "LET") ?
            throw new #SyntaxError("Variable 'LET' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
            #Reflect.defineProperty(
              #aran.globalDeclarativeRecord,
              "LET",
              {
                __proto__: null,
                value: #aran.deadzoneMarker,
                writable: true,
                enumerable: true,
                configurable: false}));
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "CONST") ?
            throw new #SyntaxError("Variable 'CONST' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
            #Reflect.defineProperty(
              #aran.globalDeclarativeRecord,
              "CONST",
              {
                __proto__: null,
                value: #aran.deadzoneMarker,
                writable: false,
                enumerable: true,
                configurable: false}));
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "CLASS") ?
            throw new #SyntaxError("Variable 'CLASS' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
            #Reflect.defineProperty(
              #aran.globalDeclarativeRecord,
              "CLASS",
              {
                __proto__: null,
                value: #aran.deadzoneMarker,
                writable: false,
                enumerable: true,
                configurable: false}));
          123; }`),
    Assert);
  Lang._match_block(
    Scope.SCRIPT(
      true,
      true,
      [],
      (scope) => (
        Assert.deepEqual(
          Scope._is_strict(scope),
          true),
        Assert.deepEqual(
          Scope._has_completion(scope),
          true),
        Tree.Bundle(
          [
            Tree.Lift(
              Scope.get_completion(scope)),
            Tree.Lift(
              Scope.set_completion(
                scope,
                Tree.primitive(123)))]))),
    Lang.PARSE_BLOCK(
      `
        {
          let $_completion;
          $_completion = void 0;
          $_completion;
          $_completion = 123; }`),
    Assert);
  // EVAL //
  Assert.throws(
    () => Scope.SCRIPT(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.EVAL(
          scope,
          false,
          false,
          [
            {kind:"param", name:"x"}],
          () => Assert.fail()))),
    new global.Error("Parameter variables in eval block"));
  Lang._match_block(
    Scope.SCRIPT(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.EVAL(
          scope,
          false,
          false,
          [
            {kind: "var", name: "VAR"},
            {kind: "function", name:"FUNCTION"},
            {kind: "let", name: "LET"},
            {kind: "const", name: "CONST"},
            {kind: "class", name: "CLASS"}],
          (scope) => (
            Assert.deepEqual(
              Scope._is_strict(scope),
              false),
            Assert.deepEqual(
              Scope._has_completion(scope),
              false),
            Assert.throws(
              () => Scope.get_completion(scope),
              new global.Error("Missing box")),
            Tree.Lift(
              Scope.initialize(
                scope,
                "let",
                "LET",
                Tree.primitive(123))))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            let $$LET, $$CONST, $$CLASS;
            (
              #Reflect.has(#aran.globalObjectRecord, "VAR") ?
              void 0 :
              #Reflect.defineProperty(
                #aran.globalObjectRecord,
                "VAR",
                {
                  __proto__: null,
                  value: void 0,
                  writable: true,
                  enumerable: true,
                  configurable: false}));
            (
              #Reflect.has(#aran.globalObjectRecord, "FUNCTION") ?
              void 0 :
              #Reflect.defineProperty(
                #aran.globalObjectRecord,
                "FUNCTION",
                {
                  __proto__: null,
                  value: void 0,
                  writable: true,
                  enumerable: true,
                  configurable: false}));
            $$LET = 123; } }`),
    Assert);
  Lang._match_block(
    Scope.SCRIPT(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.EVAL(
          scope,
          true,
          true,
          [
            {kind: "var", name: "VAR"},
            {kind: "function", name:"FUNCTION"},
            {kind: "let", name: "LET"},
            {kind: "const", name: "CONST"},
            {kind: "class", name: "CLASS"}],
          (scope) => (
            Assert.deepEqual(
              Scope._is_strict(scope),
              true),
            Assert.deepEqual(
              Scope._has_completion(scope),
              true),
            Tree.Bundle(
              [
                Tree.Lift(
                  Scope.initialize(
                    scope,
                    "let",
                    "LET",
                    Tree.primitive(123))),
                Tree.Lift(
                  Scope.get_completion(scope)),
                Tree.Lift(
                  Scope.set_completion(
                    scope,
                    Tree.primitive(456)))]))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            let $_completion, $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS;
            $_completion = void 0;
            $$VAR = void 0;
            $$FUNCTION = void 0;
            $$LET = 123;
            $_completion;
            $_completion = 456; } }`),
    Assert);
  // CASE //
  Lang._match_block(
    Scope.MODULE(
      false,
      false,
      [
        {kind:"let", name:"x"}],
      (scope) => Tree.Lone(
        [],
        Scope.CASE(
          scope,
          (scope) => Tree.Lift(
            Scope.initialize(
              scope,
              "let",
              "x",
              Tree.primitive(123)))))),
    Lang.PARSE_BLOCK(
      `
        {
          let $$x, _$x;
          _$x = false;
          {
            (
              $$x = 123,
              _$x = true); } }`),
    Assert);
  // NORMAL //
  Assert.throws(
    () => Scope.MODULE(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.NORMAL(
          scope,
          [
            {kind:"param", name:"PARAM"}],
          (scope) => Assert.fail()))),
    new global.Error("Non-block variables in normal block"));
  Lang._match_block(
    Scope.MODULE(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CASE(
          scope,
          (scope) => Tree.Lone(
            [],
            Scope.NORMAL(
              scope,
              [
                {kind:"let", name:"LET"},
                {kind:"const", name:"CONST"},
                {kind:"class", name:"CLASS"}],
              (scope) => Tree.Lift(
                Scope.initialize(
                  scope,
                  "let",
                  "LET",
                  Tree.primitive(123)))))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            {
              let $$LET, $$CONST, $$CLASS;
              $$LET = 123; } } }`),
    Assert);
  // CATCH //
  Lang._match_block(
    Scope.MODULE(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CASE(
          scope,
          (scope) => Tree.Lone(
            [],
            Scope.CATCH(
              scope,
              {
                is_head_eval_free: false,
                is_head_closure_free: false},
              [
                {kind:"param", name:"PARAM"},
                {kind:"let", name:"LET"},
                {kind:"const", name:"CONST"},
                {kind:"class", name:"CLASS"}],
              (scope) => Tree.Lift(
                Scope.initialize(
                  scope,
                  "param",
                  "PARAM",
                  Tree.primitive(123))),
              (scope) => Tree.Lift(
                Scope.initialize(
                  scope,
                  "let",
                  "LET",
                  Tree.primitive(456)))))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            {
              let $$PARAM;
              $$PARAM = 123;
              {
                let $$LET, $$CONST, $$CLASS;
                $$LET = 456; } } } }`),
    Assert);
  Lang._match_block(
    Scope.MODULE(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CASE(
          scope,
          (scope) => Tree.Lone(
            [],
            Scope.CATCH(
              scope,
              {
                is_head_eval_free: true,
                is_head_closure_free: true},
              [
                {kind:"param", name:"PARAM"},
                {kind:"let", name:"LET"},
                {kind:"const", name:"CONST"},
                {kind:"class", name:"CLASS"}],
              (scope) => Tree.Lift(
                Scope.initialize(
                  scope,
                  "param",
                  "PARAM",
                  Tree.primitive(123))),
              (scope) => Tree.Lift(
                Scope.initialize(
                  scope,
                  "let",
                  "LET",
                  Tree.primitive(456)))))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            {
              let $$PARAM, $$LET, $$CONST, $$CLASS;
              $$PARAM = 123;
              $$LET = 456; } } }`),
    Assert);
  // WITH //
  Lang._match_block(
    Scope.SCRIPT(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CASE(
          scope,
          (scope) => Scope.Box(
            scope,
            false,
            "frame",
            Tree.primitive(123),
            (box) => Tree.Lone(
              [],
              Scope.WITH(
                scope,
                box,
                [
                  {kind:"let", name:"LET"},
                  {kind:"const", name:"CONST"},
                  {kind:"class", name:"CLASS"}],
                (scope) => Tree.Bundle(
                  [
                    Tree.Lift(
                      Scope.initialize(
                        scope,
                        "let",
                        "LET",
                        Tree.primitive(456))),
                    Tree.Lift(
                      Scope.delete(scope, "x"))]))))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            {
              let $$LET, $$CONST, $$CLASS, $_unscopables;
              $$LET = 456;
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
                #Reflect.deleteProperty(123, "x") :
                (
                  #Reflect.has(#aran.globalDeclarativeRecord, "x") ?
                  (
                    (#Reflect.get(#aran.globalDeclarativeRecord, "x") === #aran.deadzoneMarker) ?
                    false :
                    false) :
                  (
                    #Reflect.has(#aran.globalObjectRecord, "x") ?
                    #Reflect.deleteProperty(#aran.globalObjectRecord, "x") :
                    true))); } } }`),
    Assert);
  // CLOSURE //
  Lang._generate_block(
    Scope.SCRIPT(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CLOSURE(
          scope,
          false,
          {
            kind: "arrow",
            super: null,
            self: null,
            newtarget: false},
          {
            is_head_eval_free: false,
            is_head_closure_free: false,
            is_body_eval_free: false},
          [
            {kind:"param", name:"PARAM"},
            {kind:"var", name:"STATIC_BODY_VAR"},
            {kind:"function", name:"STATIC_BODY_FUNCTION"},
            {kind:"let", name:"LET"},
            {kind:"const", name:"CONST"},
            {kind:"class", name:"CLASS"}],
          (scope) => (
            Assert.deepEqual(
              Scope._is_strict(scope),
              false),
            Assert.deepEqual(
              Scope._get_closure_kind(scope),
              "arrow"),
            Assert.deepEqual(
              Scope._has_super(scope),
              false),
            Assert.throws(
              () => Scope.get_super(scope),
              new global.Error("Missing box")),
            Assert.deepEqual(
              Scope._has_self(scope),
              false),
            Assert.throws(
              () => Scope.get_self(scope),
              new global.Error("Missing box")),
            Assert.deepEqual(
              Scope._has_new_target(scope),
              false),
            Tree.Bundle(
              [
                Tree.Lift(
                  Scope.initialize(
                    scope,
                    "param",
                    "PARAM",
                    Tree.primitive(123))),
                Tree.Lone(
                  [],
                  Scope.EVAL(
                    scope,
                    false,
                    false,
                    [
                      {kind:"var", name:"DYNAMIC_HEAD_VAR"},
                      {kind:"function", name:"DYNAMIC_HEAD_FUNCTION"}],
                    (scope) => Tree.Lift(
                      Tree.primitive(456))))])),
          (scope) => Tree.Bundle(
            [
              Tree.Lift(
                Scope.initialize(
                  scope,
                  "let",
                  "LET",
                  Tree.primitive(456))),
              Tree.Lift(
                Scope.delete(scope, "x")),
              Tree.Lone(
                [],
                Scope.EVAL(
                  scope,
                  false,
                  false,
                  [
                    {kind:"var", name:"DYNAMIC_BODY_VAR"},
                    {kind:"function", name:"DYNAMIC_BODY_FUNCTION"}],
                  (scope) => Tree.Lift(
                    Tree.primitive(456))))])))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            let $_head_frame;
            $_head_frame = {__proto__:null};
            {
              let $$PARAM, $_body_frame;
              $$PARAM = 123;
              {
                (
                  #Reflect.has($_head_frame, "DYNAMIC_HEAD_VAR") ?
                  void 0 :
                  #Reflect.defineProperty(
                    $_head_frame,
                    "DYNAMIC_HEAD_VAR",
                    {
                      __proto__: null,
                      ["value"]: void 0,
                      ["writable"]: true,
                      ["enumerable"]: true,
                      ["configurable"]: false}));
                (
                  #Reflect.has($_head_frame, "DYNAMIC_HEAD_FUNCTION") ?
                  void 0 :
                  #Reflect.defineProperty(
                    $_head_frame,
                    "DYNAMIC_HEAD_FUNCTION",
                    {
                      __proto__: null,
                      ["value"]: void 0,
                      ["writable"]: true,
                      ["enumerable"]: true,
                      ["configurable"]: false}));
                456;}
              $_body_frame = {__proto__:null};
              {
                let $$LET, $$CONST, $$CLASS;
                (
                  #Reflect.has($_body_frame, "STATIC_BODY_VAR") ?
                  void 0 :
                  #Reflect.defineProperty(
                    $_body_frame,
                    "STATIC_BODY_VAR",
                    {
                      __proto__: null,
                      ["value"]: void 0,
                      ["writable"]: true,
                      ["enumerable"]: true,
                      ["configurable"]: false}));
                (
                  #Reflect.has($_body_frame, "STATIC_BODY_FUNCTION") ?
                  void 0 :
                  #Reflect.defineProperty(
                    $_body_frame,
                    "STATIC_BODY_FUNCTION",
                    {
                      __proto__: null,
                      ["value"]: void 0,
                      ["writable"]: true,
                      ["enumerable"]: true,
                      ["configurable"]: false}));
                $$LET = 456;
                (
                  #Reflect.has($_body_frame, "x") ?
                  false :
                  (
                    #Reflect.has($_head_frame, "x") ?
                    false :
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
                        true))));
                {
                  (
                    #Reflect.has($_body_frame, "DYNAMIC_BODY_VAR") ?
                    void 0 :
                    #Reflect.defineProperty(
                      $_body_frame,
                      "DYNAMIC_BODY_VAR",
                      {
                        __proto__: null,
                        ["value"]: void 0,
                        ["writable"]: true,
                        ["enumerable"]: true,
                        ["configurable"]: false}));
                  (
                    #Reflect.has($_body_frame, "DYNAMIC_BODY_FUNCTION") ?
                    void 0 :
                    #Reflect.defineProperty(
                      $_body_frame,
                      "DYNAMIC_BODY_FUNCTION",
                      {
                        __proto__: null,
                        ["value"]: void 0,
                        ["writable"]: true,
                        ["enumerable"]: true,
                        ["configurable"]: false}));
                  456; } } } } }`),
    Assert);
  Lang._match_block(
    Scope.SCRIPT(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CASE(
          scope,
          (scope) => Scope.Box(
            scope,
            false,
            "super",
            Tree.primitive(123),
            (box1) => Scope.Box(
              scope,
              false,
              "self",
              Tree.primitive(456),
              (box2) => Tree.Lone(
                [],
                Scope.CLOSURE(
                  scope,
                  true,
                  {
                    kind: "function",
                    super: box1,
                    self: box2,
                    newtarget: true},
                  {
                    is_head_eval_free: true,
                    is_head_closure_free: true,
                    is_body_eval_free: true},
                  [
                    {kind:"param", name:"PARAM"},
                    {kind:"var", name:"VAR"},
                    {kind:"function", name:"FUNCTION"},
                    {kind:"let", name:"LET"},
                    {kind:"const", name:"CONST"},
                    {kind:"class", name:"CLASS"}],
                  (scope) => (
                    Assert.deepEqual(
                      Scope._is_strict(scope),
                      true),
                    Assert.deepEqual(
                      Scope._get_closure_kind(scope),
                      "function"),
                    Assert.deepEqual(
                      Scope._has_super(scope),
                      true),
                    Assert.deepEqual(
                      Scope._has_self(scope),
                      true),
                    Assert.deepEqual(
                      Scope._has_new_target(scope),
                      true),
                    Tree.Bundle(
                      [
                        Tree.Lift(
                          Scope.initialize(
                            scope,
                            "param",
                            "PARAM",
                            Tree.primitive(789))),
                        Tree.Lift(
                          Scope.get_super(scope)),
                        Tree.Lift(
                          Scope.get_self(scope))])),
                  (scope) => Tree.Lift(
                    Scope.initialize(
                      scope,
                      "let",
                      "LET",
                      Tree.primitive(901)))))))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            {
              let $$PARAM, $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS;
              $$PARAM = 789;
              123;
              456;
              $$VAR = void 0;
              $$FUNCTION = void 0;
              $$LET = 901; } } }`),
    Assert);
  Lang._match_block(
    Scope.SCRIPT(
      false,
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CLOSURE(
          scope,
          false,
          {
            kind: "method",
            super: null,
            self: null,
            newtarget: false},
          {
            is_head_eval_free: true,
            is_head_closure_free: false,
            is_body_eval_free: true},
          [
            {kind:"param", name:"PARAM"},
            {kind:"var", name:"VAR"},
            {kind:"function", name:"FUNCTION"},
            {kind:"let", name:"LET"},
            {kind:"const", name:"CONST"},
            {kind:"class", name:"CLASS"}],
          (scope) => Tree.Lift(
            Scope.initialize(
              scope,
              "param",
              "PARAM",
              Tree.primitive(123))),
          (scope) => Tree.Lift(
            Scope.initialize(
              scope,
              "let",
              "LET",
              Tree.primitive(456)))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            let $$PARAM;
            $$PARAM = 123;
            {
              let $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS;
              $$VAR = void 0;
              $$FUNCTION = void 0;
              $$LET = 456; } } }`),
    Assert);
  // _is_available //
  // typeof //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x: true},
      (scope) => Scope.Box(
        scope,
        "object_box",
        true,
        Tree.primitive(123),
        (box) => Tree.Bundle(
          [
            Tree.Lift(
              Scope.typeof(scope, "y")),
            Tree.Lift(
              Scope.typeof(scope, "x")),
            Tree.Lift(
              Scope.initialize(
                scope,
                "x",
                Tree.primitive(456))),
            Tree.Lift(
              Scope.typeof(
                Scope._extend_dynamic(scope, box, null),
                "x"))]))),
    Lang.PARSE_BLOCK(
      `{
        let $$x, $_object_box_1_1;
        $_object_box_1_1 = 123;
        (
          #Reflect.has(#global, "y") ?
          typeof #Reflect.get(#global, "y") :
          "undefined");
        throw new #ReferenceError("Cannot access 'x' before initialization");
        $$x = 456;
        (
          #Reflect.has($_object_box_1_1, "x") ?
          typeof #Reflect.get($_object_box_1_1, "x") :
          typeof $$x);}`),
    Assert);
  // delete //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x: true},
    (scope) => Scope.Box(
      scope,
      "object_box",
      true,
      Tree.primitive(123),
      (box) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.delete(scope, "y")),
          Tree.Lift(
            Scope.delete(scope, "x")),
          Tree.Lift(
            Scope.initialize(
              scope,
              "x",
              Tree.primitive(456))),
          Tree.Lift(
            Scope.delete(
              Scope._extend_dynamic(scope, box, null),
              "x"))]))),
  Lang.PARSE_BLOCK(
    `{
      let $$x, $_object_box_1_1;
      $_object_box_1_1 = 123;
      (
        #Reflect.has(#global, "y") ?
        #Reflect.deleteProperty(#global, "y") :
        true);
      true;
      $$x = 456;
      (
        #Reflect.has($_object_box_1_1, "x") ?
        #Reflect.deleteProperty($_object_box_1_1, "x") :
        true);}`),
  Assert);
  // read //
  Assert.throws(
    () => Scope.read(
      Scope._make_global(),
      "this"),
    new Error("Missing special identifier"));
  Assert.throws(
    () => Scope.read(
      Scope._make_global(),
      "new.target"),
    new Error("Missing special identifier"));
  Assert.throws(
    () => Scope.read(
      Scope._make_global(),
      "super"),
    new Error("Missing special identifier"));
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x: true},
      (scope) => Scope.Box(
        scope,
        "object_box",
        true,
        Tree.primitive(123),
        (box) => Tree.Bundle(
          [
            Tree.Lift(
              Scope.read(scope, "y")),
            Tree.Lift(
              Scope.read(scope, "x")),
            Tree.Lift(
              Scope.initialize(
                scope,
                "x",
                Tree.primitive(456))),
            Tree.Lift(
              Scope.read(
                Scope._extend_dynamic(scope, box, null),
                "x"))]))),
  Lang.PARSE_BLOCK(
    `{
      let $$x, $_object_box_1_1;
      $_object_box_1_1 = 123;
      (
        #Reflect.has(#global, "y") ?
        #Reflect.get(#global, "y") :
        throw new #ReferenceError("y is not defined"));
      throw new #ReferenceError("Cannot access 'x' before initialization");
      $$x = 456;
      (
        #Reflect.has($_object_box_1_1, "x") ?
        #Reflect.get($_object_box_1_1, "x") :
        $$x);}`),
  Assert);
  // optimistic write //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x1: true,
        x2: false},
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.write(
              scope,
              "y",
              Tree.primitive("foo"))),
          Tree.Lift(
            Scope.write(
              scope,
              "x1",
              Tree.primitive("bar"))),
          Tree.Lift(
            Scope.initialize(
              scope,
              "x1",
              Tree.primitive(123))),
          Tree.Lift(
            Scope.initialize(
              scope,
              "x2",
              Tree.primitive(456))),
          Tree.Lift(
            Scope.write(
              scope,
              "x1",
              Tree.primitive("qux"))),
          Tree.Lift(
            Scope.write(
              scope,
              "x2",
              Tree.primitive("buz")))])),
    Lang.PARSE_BLOCK(
      `{
        let $$x1, $$x2;
        (
          #Reflect.has(#global, "y") ?
          #Reflect.set(#global, "y", "foo") :
          #Reflect.defineProperty(
            #global,
            "y",
            {
              __proto__: null,
              value: "foo",
              writable: true,
              enumerable: true,
              configurable: true}));
        (
          "bar",
          throw new #ReferenceError("Cannot access 'x1' before initialization"));
        $$x1 = 123;
        $$x2 = 456;
        $$x1 = "qux";
        (
          "buz",
          throw new #TypeError("Assignment to constant variable."));}`),
  Assert);
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_global(),
      {
        __proto__: null,
        x1: true,
        x2: false},
      (scope1) => Scope.Box(
        scope1,
        "object_box",
        true,
        Tree.primitive(123),
        (box) => Tree.Lone(
          [],
          Scope.EXTEND_STATIC(
            Scope._extend_dynamic(scope1, box, null),
            {__proto__: null},
            (scope2) => Tree.Bundle(
              [
                Tree.Lift(
                  Scope.write(
                    scope2,
                    "y",
                    Tree.unary("!", Tree.primitive("foo")))),
                Tree.Lift(
                  Scope.write(
                    scope2,
                    "x1",
                    Tree.unary(
                      "!",
                      Tree.primitive("bar")))),
                Tree.Lift(
                  Scope.initialize(
                    scope1,
                    "x1",
                    Tree.primitive(123))),
                Tree.Lift(
                  Scope.initialize(
                    scope1,
                    "x2",
                    Tree.primitive(456))),
                Tree.Lift(
                  Scope.write(
                    scope2,
                    "x1",
                    Tree.unary(
                      "!",
                      Tree.primitive("qux")))),
                Tree.Lift(
                  Scope.write(
                    scope2,
                    "x2",
                    Tree.unary(
                      "!",
                      Tree.primitive("buz"))))]))))),
    Lang.PARSE_BLOCK(
      `{
      let $$x1, $$x2, $_object_box_1_1;
      $_object_box_1_1 = 123;
      {
        let $_right_hand_side_2_1, $_right_hand_side_2_2, $_right_hand_side_2_3, $_right_hand_side_2_4;
        (
          $_right_hand_side_2_1 = !"foo",
          (
            #Reflect.has($_object_box_1_1, "y") ?
            #Reflect.set($_object_box_1_1, "y", $_right_hand_side_2_1) :
            (
              #Reflect.has(#global, "y") ?
              #Reflect.set(#global, "y", $_right_hand_side_2_1) :
              #Reflect.defineProperty(
                #global,
                "y",
                {
                  __proto__: null,
                  value: $_right_hand_side_2_1,
                  writable: true,
                  enumerable: true,
                  configurable: true}))));
        (
          $_right_hand_side_2_2 = !"bar",
          (
            #Reflect.has($_object_box_1_1, "x1") ?
            #Reflect.set($_object_box_1_1, "x1", $_right_hand_side_2_2) :
            throw new #ReferenceError("Cannot access 'x1' before initialization")));
        $$x1 = 123;
        $$x2 = 456;
        (
          $_right_hand_side_2_3 = !"qux",
          (
            #Reflect.has($_object_box_1_1, "x1") ?
            #Reflect.set($_object_box_1_1, "x1", $_right_hand_side_2_3) :
            $$x1 = $_right_hand_side_2_3));
        (
          $_right_hand_side_2_4 = !"buz",
          (
            #Reflect.has($_object_box_1_1, "x2") ?
            #Reflect.set($_object_box_1_1, "x2", $_right_hand_side_2_4) :
            throw new #TypeError("Assignment to constant variable.")));}}`),
  Assert);
  // strict pessimistic write && strict optimistic write //
  Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._extend_use_strict(
        Scope._make_global()),
      {__proto__: null},
      (scope) => Tree.Bundle(
        [
          Scope.Box(
            scope,
            "frame",
            true,
            Tree.primitive(123),
            (box) => Tree.Lift(
              Scope.write(
                Scope._extend_dynamic(scope, box, null),
                "y",
                Tree.unary(
                  "!",
                  Tree.primitive("bar")))))])),
    Lang.PARSE_BLOCK(
      `{
        let _right, _frame;
        _frame = 123;
        (
          _right = !"bar",
          (
            #Reflect.has(_frame, "y") ?
            (
              #Reflect.set(_frame, "y", _right) ?
              true :
              throw new #TypeError("Cannot set object property")) :
            (
              #Reflect.has(#global, "y") ?
              (
                #Reflect.set(#global, "y", _right) ?
                true :
                throw new #TypeError("Cannot set object property")) :
              throw new #ReferenceError("y is not defined"))));}`),
    Assert);
});

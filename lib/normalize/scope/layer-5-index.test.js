"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Scope = require("./layer-5-index.js");

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {
  // MODULE //
  Assert.throws(
    () => Scope.MODULE(false, [{kind:"param", name:"x"}], () => Assert.fail()),
    new global.Error("Invalid variable"));
  Lang._match_block(
    Scope.MODULE(
      false,
      [
        {kind: "var", name: "VAR"},
        {kind: "function", name:"FUNCTION"},
        {kind: "let", name: "LET"},
        {kind: "const", name: "CONST"},
        {kind: "class", name: "CLASS"},
        {kind: "import", name: "IMPORT"}],
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
        Tree.Bundle(
          [
            Tree.Lift(
              Scope.initialize(
                scope,
                "let",
                "LET",
                Tree.primitive(123))),
            Scope.ImportInitialize(
              scope,
              "IMPORT",
              "source")]))),
    Lang.PARSE_BLOCK(
      `
        {
          let $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS, $$IMPORT;
          $$VAR = void 0;
          $$FUNCTION = void 0;
          $$LET = 123;
          import * as $$IMPORT from "source"; }`),
    Assert);
  Lang._match_block(
    Scope.MODULE(
      true,
      [],
      (scope) => (
        Assert.deepEqual(
          Scope._is_strict(scope),
          false),
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
  ["param", "import"].forEach(
    (kind) => Assert.throws(
      () => Scope.SCRIPT(false, [{kind:kind, name:"foo"}], () => Assert.fail()),
      new global.Error("Invalid variable")));
  Lang._match_block(
    Scope.SCRIPT(
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
      [],
      (scope) => (
        Assert.deepEqual(
          Scope._is_strict(scope),
          false),
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
  ["import", "param"].forEach(
    (kind) => Assert.throws(
      () => Scope.SCRIPT(
        false,
        [],
        (scope) => Tree.Lone(
          [],
          Scope.EVAL(
            scope,
            false,
            [
              {kind:"param", name:"x"}],
            () => Assert.fail()))),
      new global.Error("Invalid variable")));
  Assert.throws(
    () => Scope.SCRIPT(
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.EVAL(
          scope,
          false,
          [
            {kind:"import", name:"x"}],
          () => Assert.fail()))),
    new global.Error("Invalid variable"));
  Lang._match_block(
    Scope.SCRIPT(
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.EVAL(
          scope,
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
      [],
      (scope) => Tree.Lone(
        [],
        Scope.EVAL(
          Scope._use_strict(scope),
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
  // BLOCK //
  ["var", "function", "import"].forEach(
    (kind) => Assert.throws(
      () => Scope.MODULE(
        false,
        [],
        (scope) => Tree.Lone(
          [],
          Scope.BLOCK(
            scope,
            null,
            [
              {kind:kind, name:"foo"}],
            (scope) => Assert.fail()))),
      new global.Error("Invalid variable")));
  Lang._match_block(
    Scope.MODULE(
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CASE(
          scope,
          (scope) => Tree.Lone(
            [],
            Scope.BLOCK(
              scope,
              null,
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
  // Assert.throws(
  //   () => Scope.MODULE(
  //     false,
  //     [],
  //     (scope) => Tree.Lone(
  //       [],
  //       Scope.CATCH(
  //         scope,
  //         [
  //           {kind:"var", name:"x"}],
  //         (scope) => Assert.fail(),
  //         [],
  //         (scope) => Assert.fail()))),
  //   new global.Error("Catch head block should only contain parameter variables"));
  // Assert.throws(
  //   () => Scope.MODULE(
  //     false,
  //     [],
  //     (scope) => Tree.Lone(
  //       [],
  //       Scope.CATCH(
  //         scope,
  //         [],
  //         (scope) => Assert.fail(),
  //         [
  //           {kind:"var", name:"x"}],
  //         (scope) => Assert.fail()))),
  //   new global.Error("Catch body block should only contain block variables"));
  // Lang._match_block(
  //   Scope.MODULE(
  //     false,
  //     [],
  //     (scope) => Tree.Lone(
  //       [],
  //       Scope.CASE(
  //         scope,
  //         (scope) => Tree.Lone(
  //           [],
  //           Scope.CATCH(
  //             scope,
  //             [
  //               {kind:"param", name:"PARAM"}],
  //             (scope) => Tree.Lift(
  //               Scope.initialize(
  //                 scope,
  //                 "param",
  //                 "PARAM",
  //                 Tree.primitive(123))),
  //             [
  //               {kind:"let", name:"LET"},
  //               {kind:"const", name:"CONST"},
  //               {kind:"class", name:"CLASS"}],
  //             (scope) => Tree.Lift(
  //               Scope.initialize(
  //                 scope,
  //                 "let",
  //                 "LET",
  //                 Tree.primitive(456)))))))),
  //   Lang.PARSE_BLOCK(
  //     `
  //       {
  //         {
  //           {
  //             let $$PARAM;
  //             $$PARAM = 123;
  //             {
  //               let $$LET, $$CONST, $$CLASS;
  //               $$LET = 456; } } } }`),
  //   Assert);
  // Lang._match_block(
  //   Scope.MODULE(
  //     false,
  //     false,
  //     [],
  //     (scope) => Tree.Lone(
  //       [],
  //       Scope.CASE(
  //         scope,
  //         (scope) => Tree.Lone(
  //           [],
  //           Scope.CATCH(
  //             scope,
  //             {
  //               is_head_eval_free: true,
  //               is_head_closure_free: true},
  //             [
  //               {kind:"param", name:"PARAM"}],
  //             (scope) => Tree.Lift(
  //               Scope.initialize(
  //                 scope,
  //                 "param",
  //                 "PARAM",
  //                 Tree.primitive(123))),
  //             [
  //               {kind:"let", name:"LET"},
  //               {kind:"const", name:"CONST"},
  //               {kind:"class", name:"CLASS"}],
  //             (scope) => Tree.Lift(
  //               Scope.initialize(
  //                 scope,
  //                 "let",
  //                 "LET",
  //                 Tree.primitive(456)))))))),
  //   Lang.PARSE_BLOCK(
  //     `
  //       {
  //         {
  //           {
  //             let $$PARAM, $$LET, $$CONST, $$CLASS;
  //             $$PARAM = 123;
  //             $$LET = 456; } } }`),
  //   Assert);
  // WITH //
  // Assert.throws(
  //   () => Scope.MODULE(
  //     false,
  //     [],
  //     (scope) => Scope.Box(
  //       scope,
  //       false,
  //       "frame",
  //       Tree.primitive(123),
  //       (box) => Tree.Lone(
  //         [],
  //         Scope.BLOCK(
  //           scope,
  //           box,
  //           [
  //             {kind:"var", name:"x"}],
  //           (scope) => Assert.fail())))),
  //   new global.Error("With block should only contain block variables"));
  Lang._match_block(
    Scope.SCRIPT(
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
              Scope.BLOCK(
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
  ["import", "let", "const", "class"].forEach(
    (kind) => Assert.throws(
      () => Scope.MODULE(
        false,
        [],
        (scope) => Tree.Lone(
          [],
          Scope.CLOSURE_HEAD(
            scope,
            {
              kind: "arrow",
              super: null,
              self: null,
              newtarget: false},
            false,
            [
              {kind:"let", name:"x"}],
            (scope) => Assert.fail()))),
      new global.Error("Invalid variable")));
  Lang._generate_block(
    Scope.SCRIPT(
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CLOSURE_HEAD(
          Scope._use_strict(scope),
          {
            sort: "arrow",
            super: null,
            self: null,
            newtarget: false},
          true,
          [
            {kind:"param", name:"PARAM"},
            {kind:"var", name:"HEAD_VAR"},
            {kind:"function", name:"HEAD_FUNCTION"}],
          (scope) => (
            Assert.deepEqual(
              Scope._is_strict(scope),
              true),
            Assert.deepEqual(
              Scope._get_sort(scope),
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
                    [
                      {kind:"var", name:"EVAL_HEAD_VAR"},
                      {kind:"function", name:"EVAL_HEAD_FUNCTION"}],
                    (scope) => Tree.Lift(
                      Tree.primitive(456)))),
                Tree.Lone(
                  [],
                  Scope.CLOSURE_BODY(
                    scope,
                    true,
                    [
                      {kind:"var", name:"BODY_VAR"},
                      {kind:"function", name:"BODY_FUNCTION"},
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
                          Scope.delete(scope, "x")),
                        Tree.Lone(
                          [],
                          Scope.EVAL(
                            scope,
                            false,
                            [
                              {kind:"var", name:"EVAL_BODY_VAR"},
                              {kind:"function", name:"EVAL_BODY_FUNCTION"}],
                            (scope) => Tree.Lift(
                              Tree.primitive(456))))])))]))))),
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
  // Lang._match_block(
  //   Scope.SCRIPT(
  //     false,
  //     false,
  //     [],
  //     (scope) => Tree.Lone(
  //       [],
  //       Scope.CASE(
  //         scope,
  //         (scope) => Scope.Box(
  //           scope,
  //           false,
  //           "super",
  //           Tree.primitive(123),
  //           (box1) => Scope.Box(
  //             scope,
  //             false,
  //             "self",
  //             Tree.primitive(456),
  //             (box2) => Tree.Lone(
  //               [],
  //               Scope.CLOSURE(
  //                 scope,
  //                 true,
  //                 {
  //                   kind: "function",
  //                   super: box1,
  //                   self: box2,
  //                   newtarget: true},
  //                 {
  //                   is_head_eval_free: true,
  //                   is_head_closure_free: true,
  //                   is_body_eval_free: true},
  //                 [
  //                   {kind:"param", name:"PARAM"}],
  //                 (scope) => (
  //                   Assert.deepEqual(
  //                     Scope._is_strict(scope),
  //                     true),
  //                   Assert.deepEqual(
  //                     Scope._get_sort(scope),
  //                     "function"),
  //                   Assert.deepEqual(
  //                     Scope._has_super(scope),
  //                     true),
  //                   Assert.deepEqual(
  //                     Scope._has_self(scope),
  //                     true),
  //                   Assert.deepEqual(
  //                     Scope._has_new_target(scope),
  //                     true),
  //                   Tree.Bundle(
  //                     [
  //                       Tree.Lift(
  //                         Scope.initialize(
  //                           scope,
  //                           "param",
  //                           "PARAM",
  //                           Tree.primitive(789))),
  //                       Tree.Lift(
  //                         Scope.get_super(scope)),
  //                       Tree.Lift(
  //                         Scope.get_self(scope))])),
  //                 [
  //                   {kind:"var", name:"VAR"},
  //                   {kind:"function", name:"FUNCTION"},
  //                   {kind:"let", name:"LET"},
  //                   {kind:"const", name:"CONST"},
  //                   {kind:"class", name:"CLASS"}],
  //                 (scope) => Tree.Lift(
  //                   Scope.initialize(
  //                     scope,
  //                     "let",
  //                     "LET",
  //                     Tree.primitive(901)))))))))),
  //   Lang.PARSE_BLOCK(
  //     `
  //       {
  //         {
  //           {
  //             let $$PARAM, $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS;
  //             $$PARAM = 789;
  //             123;
  //             456;
  //             $$VAR = void 0;
  //             $$FUNCTION = void 0;
  //             $$LET = 901; } } }`),
  //   Assert);

  Lang._match_block(
    Scope.SCRIPT(
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CLOSURE_HEAD(
          scope,
          {
            sort: "method",
            super: null,
            self: null,
            newtarget: false},
          false,
          [
            {kind:"param", name:"PARAM"},
            {kind:"var", name:"VAR"},
            {kind:"function", name:"FUNCTION"}],
          (scope) => Tree.Lone(
            [],
            Scope.CLOSURE_BODY(
              scope,
              false,
              [
                {kind:"var", name:"VAR"},
                {kind:"function", name:"FUNCTION"},
                {kind:"let", name:"LET"},
                {kind:"const", name:"CONST"},
                {kind:"class", name:"CLASS"}],
              (scope) => Tree.Lift(
                Tree.primitive(123))))))),
    Lang.PARSE_BLOCK(`{
      {
        let $$PARAM, $$VAR, $$FUNCTION;
        $$VAR = void 0;
        $$FUNCTION = void 0;
        {
          let $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS;
          $$VAR = void 0;
          $$FUNCTION = void 0;
          123; } } }`),
  Assert);
  Lang._match_block(
    Scope.SCRIPT(
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.CLOSURE_HEAD(
          scope,
          {
            sort: "method",
            super: null,
            self: null,
            newtarget: false},
          true,
          [
            {kind:"param", name:"PARAM"}],
          (scope) => Tree.Bundle(
            [
              Tree.Lift(
                Scope.initialize(
                  scope,
                  "param",
                  "PARAM",
                  Tree.primitive(123))),
              Tree.Lone(
                [],
                Scope.CLOSURE_BODY(
                  scope,
                  true,
                  [
                    {kind:"var", name:"VAR"},
                    {kind:"function", name:"FUNCTION"},
                    {kind:"let", name:"LET"},
                    {kind:"const", name:"CONST"},
                    {kind:"class", name:"CLASS"}],
                  (scope) => Tree.Lift(
                    Scope.initialize(
                      scope,
                      "let",
                      "LET",
                      Tree.primitive(456)))))])))),
    Lang.PARSE_BLOCK(
      `
      {
        {
          let $_DynamicHeadClosureFrame_10_1, $$PARAM;
          $_DynamicHeadClosureFrame_10_1 = {__proto__:null};
          $$PARAM = 123;
          {
            let $_DynamicBodyClosureFrame_12_1, $$LET, $$CONST, $$CLASS;
            $_DynamicBodyClosureFrame_12_1 = {__proto__:null};
            (
              #Reflect.has($_DynamicBodyClosureFrame_12_1, "VAR") ?
              void 0 :
              #Reflect.defineProperty(
                $_DynamicBodyClosureFrame_12_1,
                "VAR",
                {
                  __proto__: null,
                  ["value"]: void 0,
                  ["writable"]: true,
                  ["enumerable"]: true,
                  ["configurable"]: false}));
            (
              #Reflect.has($_DynamicBodyClosureFrame_12_1, "FUNCTION") ?
              void 0 :
              #Reflect.defineProperty(
                $_DynamicBodyClosureFrame_12_1,
                "FUNCTION",
                {
                  __proto__: null,
                  ["value"]: void 0,
                  ["writable"]: true,
                  ["enumerable"]: true,
                  ["configurable"]: false}));
            $$LET = 456;}}}`),
    Assert);
  // _is_available //
  Lang._match_block(
    Scope.SCRIPT(
      false,
      [],
      (scope) => (
        Assert.deepEqual(
          Scope._is_available(
            scope,
            "var",
            "x",
            [
              {kind:"var", name:"x"}]),
          true),
        Assert.deepEqual(
          Scope._is_available(
            scope,
            "let",
            "x",
            [
              {kind:"var", name:"x"}]),
          false),
        Assert.deepEqual(
          Scope._is_available(
            scope,
            "let",
            "x",
            [
              {kind:"let", name:"x"}]),
          false),
        Assert.deepEqual(
          Scope._is_available(
            scope,
            "var",
            "x",
            [
              {kind:"let", name:"x"}]),
          false),
        Scope.Box(
          scope,
          false,
          "frame",
          Tree.primitive(123),
          (box) => Tree.Lone(
            [],
            Scope.BLOCK(
              scope,
              box,
              [],
              (scope) => (
                Assert.deepEqual(
                  Scope._is_available(
                    scope,
                    "var",
                    "x",
                    [
                      {kind:"var", name:"x"}]),
                  true),
                // Assert.deepEqual(
                //   Scope._is_available(
                //     scope,
                //     "param",
                //     "x",
                //     [
                //       {kind:"var", name:"x"}]),
                //   false),
                Assert.deepEqual(
                  Scope._is_available(
                    scope,
                    "var",
                    "x",
                    [
                      {kind:"let", name:"x"}]),
                  false),
                Tree.Lift(
                  Tree.primitive(456)))))))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            456; } }`),
    Assert);
  // delete //
  Lang._match_block(
    Scope.MODULE(
      false,
      [
        {kind:"var", name:"x"}],
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.delete(scope, "y")),
          Tree.Lift(
            Scope.delete(scope, "x"))])),
    Lang.PARSE_BLOCK(
      `
        {
          let $$x;
          $$x = void 0;
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "y") ?
            (
              (#Reflect.get(#aran.globalDeclarativeRecord, "y") === #aran.deadzoneMarker) ?
              false :
              false) :
            (
              #Reflect.has(#aran.globalObjectRecord, "y") ?
              #Reflect.deleteProperty(#aran.globalObjectRecord, "y") :
              true));
          false; }`),
    Assert);
  // typeof //
  Lang._match_block(
    Scope.MODULE(
      false,
      [
        {kind:"var", name:"x"}],
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.typeof(scope, "y")),
          Tree.Lift(
            Scope.typeof(scope, "x"))])),
    Lang.PARSE_BLOCK(
      `
        {
          let $$x;
          $$x = void 0;
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "y") ?
            (
              (#Reflect.get(#aran.globalDeclarativeRecord, "y") === #aran.deadzoneMarker) ?
              throw new #ReferenceError("Cannot read type from deadzone variable y") :
              typeof #Reflect.get(#aran.globalDeclarativeRecord, "y")) :
            (
              #Reflect.has(#aran.globalObjectRecord, "y") ?
              typeof #Reflect.get(#aran.globalObjectRecord, "y") :
              "undefined"));
          typeof $$x; }`),
    Assert);
  // read //
  Lang._match_block(
    Scope.MODULE(
      false,
      [
        {kind:"var", name:"x"}],
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.read(scope, "y")),
          Tree.Lift(
            Scope.read(scope, "x"))])),
    Lang.PARSE_BLOCK(
      `
        {
          let $$x;
          $$x = void 0;
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "y") ?
            (
              (#Reflect.get(#aran.globalDeclarativeRecord, "y") === #aran.deadzoneMarker) ?
              throw new #ReferenceError("Cannot read from deadzone variable y") :
              #Reflect.get(#aran.globalDeclarativeRecord, "y")) :
            (
              #Reflect.has(#aran.globalObjectRecord, "y") ?
              #Reflect.get(#aran.globalObjectRecord, "y") :
              throw new #ReferenceError("Cannot read from missing variable y")));
          $$x; }`),
    Assert);
  // optimistic write //
  Lang._match_block(
    Scope.MODULE(
      false,
      [
        {kind:"var", name:"x"},
        {kind:"const", name:"y"}],
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.write(
              scope,
              "x",
              Tree.unary(
                "!",
                Tree.primitive(123)))),
          Tree.Lift(
            Scope.write(
              scope,
              "y",
              Tree.unary(
                "!",
                Tree.primitive(456)))),
          Tree.Lift(
            Scope.initialize(
              scope,
              "const",
              "y",
              Tree.primitive(789))),
          Tree.Lift(
            Scope.write(
              scope,
              "y",
              Tree.unary(
                "!",
                Tree.primitive(901))))])),
    Lang.PARSE_BLOCK(
      `
        {
          let $$x, $$y;
          $$x = void 0;
          $$x = !123;
          (
            !456,
            throw new #ReferenceError("Cannot write to deadzone variable y"));
          $$y = 789;
          (
            !901,
            throw new #TypeError("Cannot write to constant variable y")); }`),
    Assert);
  // pessimistic write strict //
  Lang._match_block(
    Scope.MODULE(
      false,
      [
        {kind:"var", name:"x"},
        {kind:"const", name:"y"},
        {kind:"const", name:"z"}],
      (scope) => (
        scope = Scope._use_strict(scope),
        Tree.Bundle(
          [
            Tree.Lift(
              Scope.initialize(
                scope,
                "const",
                "y",
                Tree.primitive(123))),
            Scope.Box(
              scope,
              false,
              "frame",
              Tree.primitive(456),
              (box) => Tree.Lone(
                [],
                Scope.BLOCK(
                  scope,
                  box,
                  [],
                  (scope) => Tree.Bundle(
                    [
                      Tree.Lift(
                        Scope.write(
                          scope,
                          "x",
                          Tree.unary(
                            "!",
                            Tree.primitive(789)))),
                      Tree.Lift(
                        Scope.write(
                          scope,
                          "y",
                          Tree.unary(
                            "!",
                            Tree.primitive(901)))),
                      Tree.Lift(
                        Scope.write(
                          scope,
                          "z",
                          Tree.unary(
                            "!",
                            Tree.primitive(234)))),
                      Tree.Lift(
                        Scope.write(
                          scope,
                          "t",
                          Tree.unary(
                            "!",
                            Tree.primitive(234))))]))))]))),
    Lang.PARSE_BLOCK(
      `
      {
        let $$x, $$y, $$z;
        $$x = void 0;
        $$y = 123;
        {
          let $_unscopables1, $_right1, $_unscopables2, $_unscopables3, $_right2, $_unscopables4, $_unscopables5, $_right3, $_unscopables6, $_right4, $_unscopables7;
          (
            $_right1 = ! 789,
            (
              (
                #Reflect.has(456, "x") ?
                (
                  $_unscopables2 = #Reflect.get(456, #Symbol.unscopables),
                  (
                    (
                      (typeof $_unscopables2 === "object") ?
                      $_unscopables2 :
                      (typeof $_unscopables2 === "function")) ?
                    ! #Reflect.get($_unscopables2, "x") :
                    true)) :
                false) ?
              (
                #Reflect.set(456, "x", $_right1) ?
                true :
                throw new #TypeError("Cannot set object property")) :
              $$x = $_right1));
          (
            $_right2 = ! 901,
            (
              (
                #Reflect.has(456, "y") ?
                (
                  $_unscopables4 = #Reflect.get(456, #Symbol.unscopables),
                  (
                    (
                      (typeof $_unscopables4 === "object") ?
                      $_unscopables4 :
                      (typeof $_unscopables4 === "function")) ?
                    ! #Reflect.get($_unscopables4, "y") :
                    true)) :
                false) ?
              (
                #Reflect.set(456, "y", $_right2) ?
                true :
                throw new #TypeError("Cannot set object property")) :
              throw new #TypeError("Cannot write to constant variable y")));
          (
            $_right3 = ! 234,
            (
              (
                #Reflect.has(456, "z") ?
                (
                  $_unscopables6 = #Reflect.get(456, #Symbol.unscopables),
                  (
                    (
                      (typeof $_unscopables6 === "object") ?
                      $_unscopables6 :
                      (typeof $_unscopables6 === "function")) ?
                    ! #Reflect.get($_unscopables6, "z") :
                    true)) :
                false) ?
              (
                #Reflect.set(456, "z", $_right3) ?
                true :
                throw new #TypeError("Cannot set object property")) :
              throw new #ReferenceError("Cannot write to deadzone variable z")));
          (
            $_right4 = ! 234,
            (
              (
                #Reflect.has(456, "t") ?
                (
                  $_unscopables7 = #Reflect.get(456, #Symbol.unscopables),
                  (
                    (
                      (typeof $_unscopables7 === "object") ?
                      $_unscopables7 :
                      (typeof $_unscopables7 === "function")) ?
                    ! #Reflect.get($_unscopables7, "t") :
                    true)) :
                false) ?
              (
                #Reflect.set(456, "t", $_right4) ?
                true :
                throw new #TypeError("Cannot set object property")) :
              (
                #Reflect.has(#aran.globalDeclarativeRecord, "t") ?
                (
                  (
                    #Reflect.get(#aran.globalDeclarativeRecord, "t") ===
                    #aran.deadzoneMarker) ?
                  throw new #ReferenceError("Cannot write to deadzone variable t") :
                  (
                    #Reflect.set(#aran.globalDeclarativeRecord, "t", $_right4) ?
                    true :
                    throw new #TypeError("Cannot set object property"))) :
                (
                  #Reflect.has(#aran.globalObjectRecord, "t") ?
                  (
                    #Reflect.set(#aran.globalObjectRecord, "t", $_right4) ?
                    true :
                    throw new #TypeError("Cannot set object property")) :
                  throw new #ReferenceError("Cannot write to missing variable t")))));}}`),
    Assert);
  // pessimistic write normal //
  Lang._match_block(
    Scope.SCRIPT(
      false,
      [],
      (scope) => Tree.Lone(
        [],
        Scope.BLOCK(
          scope,
          null,
          [
            {kind:"let", name:"x"},
            {kind:"const", name:"y"},
            {kind:"const", name:"z"}],
          (scope) => Tree.Bundle(
            [
              Tree.Lift(
                Scope.initialize(
                  scope,
                  "let",
                  "x",
                  Tree.primitive(0))),
              Tree.Lift(
                Scope.initialize(
                  scope,
                  "const",
                  "y",
                  Tree.primitive(123))),
              Scope.Box(
                scope,
                false,
                "frame",
                Tree.primitive(456),
                (box) => Tree.Lone(
                  [],
                  Scope.BLOCK(
                    scope,
                    box,
                    [],
                    (scope) => Tree.Bundle(
                      [
                        Tree.Lift(
                          Scope.write(
                            scope,
                            "x",
                            Tree.unary(
                              "!",
                              Tree.primitive(789)))),
                        Tree.Lift(
                          Scope.write(
                            scope,
                            "y",
                            Tree.unary(
                              "!",
                              Tree.primitive(901)))),
                        Tree.Lift(
                          Scope.write(
                            scope,
                            "z",
                            Tree.unary(
                              "!",
                              Tree.primitive(234)))),
                        Tree.Lift(
                          Scope.write(
                            scope,
                            "t",
                            Tree.unary(
                              "!",
                              Tree.primitive(234))))]))))])))),
    Lang.PARSE_BLOCK(
      `
        {
          {
            let $$x, $$y, $$z;
            $$x = 0;
            $$y = 123;
            {
              let $_ScopeBaseUnscopables_10_1, $_RightHandSide_10_1, $_ScopeBaseUnscopables_10_2, $_ScopeBaseUnscopables_10_3, $_RightHandSide_10_2, $_ScopeBaseUnscopables_10_4, $_ScopeBaseUnscopables_10_5, $_RightHandSide_10_3, $_ScopeBaseUnscopables_10_6, $_RightHandSide_10_4, $_ScopeBaseUnscopables_10_7;
              (
                $_RightHandSide_10_1 = ! 789,
                (
                  (
                    #Reflect.has(456, "x") ?
                    (
                      $_ScopeBaseUnscopables_10_2 = #Reflect.get(456, #Symbol.unscopables),
                      (
                        (
                          (typeof $_ScopeBaseUnscopables_10_2 === "object") ?
                          $_ScopeBaseUnscopables_10_2 :
                          (typeof $_ScopeBaseUnscopables_10_2 === "function")) ?
                        ! #Reflect.get($_ScopeBaseUnscopables_10_2, "x") :
                        true)) :
                    false) ?
                  #Reflect.set(456, "x", $_RightHandSide_10_1) :
                  $$x = $_RightHandSide_10_1));
              (
                $_RightHandSide_10_2 = ! 901,
                (
                  (
                    #Reflect.has(456, "y") ?
                    (
                      $_ScopeBaseUnscopables_10_4 = #Reflect.get(456, #Symbol.unscopables),
                      (
                        (
                          (typeof $_ScopeBaseUnscopables_10_4 === "object") ?
                          $_ScopeBaseUnscopables_10_4 :
                          (typeof $_ScopeBaseUnscopables_10_4 === "function")) ?
                        ! #Reflect.get($_ScopeBaseUnscopables_10_4, "y") :
                        true)) :
                    false) ?
                  #Reflect.set(456, "y", $_RightHandSide_10_2) :
                  throw new #TypeError("Cannot write to constant variable y")));
              (
                $_RightHandSide_10_3 = ! 234,
                (
                  (
                    #Reflect.has(456, "z") ?
                    (
                      $_ScopeBaseUnscopables_10_6 = #Reflect.get(456, #Symbol.unscopables),
                      (
                        (
                          (typeof $_ScopeBaseUnscopables_10_6 === "object") ?
                          $_ScopeBaseUnscopables_10_6 :
                          (typeof $_ScopeBaseUnscopables_10_6 === "function")) ?
                        ! #Reflect.get($_ScopeBaseUnscopables_10_6, "z") :
                        true)) :
                    false) ?
                  #Reflect.set(456, "z", $_RightHandSide_10_3) :
                  throw new #ReferenceError("Cannot write to deadzone variable z")));
              (
                $_RightHandSide_10_4 = ! 234,
                (
                  (
                    #Reflect.has(456, "t") ?
                    (
                      $_ScopeBaseUnscopables_10_7 = #Reflect.get(456, #Symbol.unscopables),
                      (
                        (
                          (typeof $_ScopeBaseUnscopables_10_7 === "object") ?
                          $_ScopeBaseUnscopables_10_7 :
                          (typeof $_ScopeBaseUnscopables_10_7 === "function")) ?
                        ! #Reflect.get($_ScopeBaseUnscopables_10_7, "t") :
                        true)) :
                    false) ?
                  #Reflect.set(456, "t", $_RightHandSide_10_4) :
                  (
                    #Reflect.has(#aran.globalDeclarativeRecord, "t") ?
                    (
                      (
                        #Reflect.get(#aran.globalDeclarativeRecord, "t") ===
                        #aran.deadzoneMarker) ?
                      throw new #ReferenceError("Cannot write to deadzone variable t") :
                      (
                        #Reflect.set(#aran.globalDeclarativeRecord, "t", $_RightHandSide_10_4) ?
                        true :
                        throw new #TypeError("Cannot set object property"))) :
                    (
                      #Reflect.has(#aran.globalObjectRecord, "t") ?
                      #Reflect.set(#aran.globalObjectRecord, "t", $_RightHandSide_10_4) :
                      #Reflect.defineProperty(
                        #aran.globalObjectRecord,
                        "t",
                        {
                          __proto__: null,
                          ["value"]: $_RightHandSide_10_4,
                          ["writable"]: true,
                          ["enumerable"]: true,
                          ["configurable"]: true})))));}}}`),
    Assert);

}, []);

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const Throw = require("../../throw.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Scope = require("./layer-5-index.js");

const state = {nodes:[], serials:new Map(), scopes:{__proto__:null}};

State._run_session(state, () => {
  Assert.deepEqual(
    Scope._fetch_sort(
      Scope._make_root()),
    "program");
  Assert.deepEqual(
    Scope._fetch_sort(
      Scope._make_root({sort:"arrow"})),
    "arrow");
  Assert.deepEqual(
    Scope._fetch_loop(
      Scope._extend_loop(
        Scope._make_root(null),
        "foo")),
    "foo");
  // Lang._match(
  //   Scope.MODULE(
  //     Scope._make_root(),
  //     [{kind:"var", name:"this", ghost:false, exports:[]}],
  //     (scope) => (
  //       Assert.throws(
  //         () => Scope.Initialize(
  //           scope,
  //           "var",
  //           "this",
  //           Tree.PrimitiveExpression("foo")),
  //         new global.Error("Special variable cannot be loose")),
  //       Tree.ExpressionStatement(
  //         Tree.PrimitiveExpression(123)))),
  //   Lang.parseBlock(`{
  //     let $this;
  //     $this = void 0;
  //     123; }`),
  //   Assert);
  // MODULE //
  // Assert.throws(
  //   () => Scope.MODULE(
  //     Scope._make_root(),
  //     [
  //       {kind:"yolo", name:"x"}],
  //     () => Assert.fail()),
  //   new global.Error("Invalid variable"));
  Lang._match(
    Scope.Initialize(
      Scope._make_root(),
      "let",
      "foo",
      Tree.PrimitiveExpression(123),
      false),
    Lang.parseStatement(`enclave let foo = 123;`),
    Assert);
  Lang._match(
    Scope.MODULE(
      Scope._make_root(),
      [
        {kind: "var", ghost:false, name: "VAR", exports:[]},
        {kind: "function", ghost:false, name:"FUNCTION", exports:[]},
        {kind: "let", ghost:false, name: "LET", exports:[]},
        {kind: "const", ghost:false, name: "CONST", exports:[]},
        {kind: "class", ghost:false, name: "CLASS", exports:[]},
        {kind: "import", ghost:false, name: "IMPORT", exports:[]}],
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
        Tree.BundleStatement(
          [
            Scope.Initialize(
              scope,
              "let",
              "LET",
              Tree.PrimitiveExpression("let-value")),
            Scope.Initialize(
              scope,
              "const",
              "CONST",
              Tree.PrimitiveExpression("const-value")),
            Scope.Initialize(
              scope,
              "class",
              "CLASS",
              Tree.PrimitiveExpression("class-value")),
            Scope.Initialize(
              scope,
              "import",
              "IMPORT",
              Tree.PrimitiveExpression("import-value"))]))),
    Lang.parseBlock(
      `
        {
          let $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS, $$IMPORT;
          $$VAR = void 0;
          $$FUNCTION = void 0;
          $$LET = "let-value";
          $$CONST = "const-value";
          $$CLASS = "class-value";
          $$IMPORT = "import-value"; }`),
    Assert);
  Lang._match(
    Scope.MODULE(
      Scope._make_root(),
      [],
      (scope) => Scope.Box(
        scope,
        true,
        "completion",
        Tree.PrimitiveExpression(void 0),
        (box) => (
          scope = Scope._extend_completion(scope, box),
          Assert.deepEqual(
            Scope._is_strict(scope),
            false),
          Assert.deepEqual(
            Scope._has_completion(scope),
            true),
          Tree.BundleStatement(
            [
              Tree.ExpressionStatement(
                Scope.get_completion(scope)),
              Tree.ExpressionStatement(
                Scope.set_completion(
                  scope,
                  Tree.PrimitiveExpression(123)))])))),
    Lang.parseBlock(
      `
        {
          let $_completion;
          $_completion = void 0;
          $_completion;
          $_completion = 123; }`),
    Assert);
  // SCRIPT //
  ["import"].forEach(
    (kind) => Assert.throws(
      () => Scope.SCRIPT(
        Scope._make_root(),
        [
          {kind:kind, name:"foo"}],
        () => Assert.fail()),
      new global.Error("Invalid variable")));
  Lang._match(
    Scope.SCRIPT(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [
        {kind: "var", ghost:false, name: "VAR", exports:[]},
        {kind: "function", ghost:false, name:"FUNCTION", exports:[]},
        {kind: "let", ghost:false, name: "LET", exports:[]},
        {kind: "const", ghost:false, name: "CONST", exports:[]},
        {kind: "class", ghost:false, name: "CLASS", exports:[]}],
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
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(123)))),
    Lang.parseBlock(
      `
        {
          (
            #Reflect.getOwnPropertyDescriptor(#aran.globalObjectRecord, "VAR") ?
            void 0 :
            #Object.defineProperty(
              #aran.globalObjectRecord,
              "VAR",
              {
                __proto__: null,
                value: void 0,
                writable: true,
                enumerable: true,
                configurable: false}));
          #Object.defineProperty(
            #aran.globalObjectRecord,
            "FUNCTION",
            {
              __proto__: null,
              value: #Symbol("function-placeholder"),
              writable: true,
              enumerable: true,
              configurable: false});
          (
            #Reflect.getOwnPropertyDescriptor(#aran.globalDeclarativeRecord, "LET") ?
            throw new #SyntaxError("Rigid variable of kind let named 'LET' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
            #Object.defineProperty(
              #aran.globalDeclarativeRecord,
              "LET",
              {
                __proto__: null,
                value: #aran.deadzoneMarker,
                writable: true,
                enumerable: true,
                configurable: true}));
          (
            #Reflect.getOwnPropertyDescriptor(#aran.globalDeclarativeRecord, "CONST") ?
            throw new #SyntaxError("Rigid variable of kind const named 'CONST' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
            #Object.defineProperty(
              #aran.globalDeclarativeRecord,
              "CONST",
              {
                __proto__: null,
                value: #aran.deadzoneMarker,
                writable: false,
                enumerable: true,
                configurable: true}));
          (
            #Reflect.getOwnPropertyDescriptor(#aran.globalDeclarativeRecord, "CLASS") ?
            throw new #SyntaxError("Rigid variable of kind class named 'CLASS' has already been declared (this should have been signaled as an early syntax error, please consider submitting a bug repport)") :
            #Object.defineProperty(
              #aran.globalDeclarativeRecord,
              "CLASS",
              {
                __proto__: null,
                value: #aran.deadzoneMarker,
                writable: false,
                enumerable: true,
                configurable: true}));
          123; }`),
    Assert);
  // Lang._match(
  //   Scope.SCRIPT(
  //     Scope._make_root(),
  //     true,
  //     [],
  //     (scope) => (
  //       Assert.deepEqual(
  //         Scope._is_strict(scope),
  //         false),
  //       Assert.deepEqual(
  //         Scope._has_completion(scope),
  //         true),
  //       Tree.BundleStatement(
  //         [
  //           Tree.ExpressionStatement(
  //             Scope.get_completion(scope)),
  //           Tree.ExpressionStatement(
  //             Scope.set_completion(
  //               scope,
  //               Tree.PrimitiveExpression(123)))]))),
  //   Lang.parseBlock(
  //     `
  //       {
  //         let $_completion;
  //         $_completion = void 0;
  //         $_completion;
  //         $_completion = 123; }`),
  //   Assert);
  // EVAL //
  ["import"].forEach(
    (kind) => Assert.throws(
      () => Scope.SCRIPT(
        Scope._make_root(),
        [],
        (scope) => Tree.BlockStatement(
          Scope.EVAL(
            scope,
            [
              {kind:kind, name:"x"}],
            () => Assert.fail()))),
      new global.Error("Invalid variable")));
  Lang._match(
    Scope.EVAL(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [
        {kind: "var", ghost:false, name: "VAR", exports:[]},
        {kind: "function", ghost:false, name:"FUNCTION", exports:[]},
        {kind: "let", ghost:false, name: "LET", exports:[]},
        {kind: "const", ghost:false, name: "CONST", exports:[]},
        {kind: "class", ghost:false, name: "CLASS", exports:[]}],
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
        Tree.BundleStatement(
          [
            Scope.Initialize(
              scope,
              "let",
              "LET",
              Tree.PrimitiveExpression(123)),
            Scope.Initialize(
              scope,
              "const",
              "CONST",
              Tree.PrimitiveExpression(456)),
            Scope.Initialize(
              scope,
              "class",
              "CLASS",
              Tree.PrimitiveExpression(789))]))),
    Lang.parseBlock(
      `
        {
          let $$LET, $$CONST, $$CLASS, $_descriptor;
          (
            #Reflect.getOwnPropertyDescriptor(#aran.globalObjectRecord, "VAR") ?
            void 0 :
            #Object.defineProperty(
              #aran.globalObjectRecord,
              "VAR",
              {
                __proto__: null,
                value: void 0,
                writable: true,
                enumerable: true,
                configurable: true}));
            #Object.defineProperty(
              #aran.globalObjectRecord,
              "FUNCTION",
              {
                __proto__: null,
                value: #Symbol("function-placeholder"),
                writable: true,
                enumerable: true,
                configurable: (
                  $_descriptor = #Reflect.getOwnPropertyDescriptor(#aran.globalObjectRecord, "FUNCTION"),
                  (
                    $_descriptor ?
                    #Reflect.get($_descriptor, "configurable") :
                    true))});
          $$LET = 123;
          $$CONST = 456;
          $$CLASS = 789; }`),
    Assert);
  // Lang._match(
  //   Scope.EVAL(
  //     Scope._make_root(),
  //     false,
  //     [],
  //     (scope) => Tree.BlockStatement(
  //       [],
  //       Scope.LOCAL_EVAL(
  //         Scope._use_strict(scope),
  //         true,
  //         [
  //           {kind: "var", name: "VAR"},
  //           {kind: "function", name:"FUNCTION"},
  //           {kind: "let", name: "LET"},
  //           {kind: "const", name: "CONST"},
  //           {kind: "class", name: "CLASS"}],
  //         (scope) => (
  //           Assert.deepEqual(
  //             Scope._is_strict(scope),
  //             true),
  //           Assert.deepEqual(
  //             Scope._has_completion(scope),
  //             true),
  //           Tree.BundleStatement(
  //             [
  //               Scope.Initialize(
  //                 scope,
  //                 "let",
  //                 "LET",
  //                 Tree.PrimitiveExpression(123)),
  //               Tree.ExpressionStatement(
  //                 Scope.get_completion(scope)),
  //               Tree.ExpressionStatement(
  //                 Scope.set_completion(
  //                   scope,
  //                   Tree.PrimitiveExpression(456)))]))))),
  //   Lang.parseBlock(
  //     `
  //       {
  //         {
  //           let $_completion, $$VAR, $$FUNCTION, $$LET, $$CONST, $$CLASS;
  //           $_completion = void 0;
  //           $$VAR = void 0;
  //           $$FUNCTION = void 0;
  //           $$LET = 123;
  //           $_completion;
  //           $_completion = 456; } }`),
  //   Assert);
  // CASE //
  Lang._match(
    Scope.MODULE(
      Scope._make_root(),
      [
        {kind:"let", ghost:false, name:"x", exports:[]}],
      (scope) => Tree.BlockStatement(
        Scope.CASE(
          scope,
          (scope) => Scope.Initialize(
            scope,
            "let",
            "x",
            Tree.PrimitiveExpression(123))))),
    Lang.parseBlock(
      `
        {
          let $$x, _$x;
          _$x = false;
          {
            (
              $$x = 123,
              _$x = true); } }`),
    Assert);
  // Block //
  ["var", "function", "import"].forEach(
    (kind) => Assert.throws(
      () => Scope.MODULE(
        Scope._make_root(),
        [],
        (scope) => Tree.BlockStatement(
          Scope.Block(
            scope,
            [],
            [
              {kind:kind, ghost:false, name:"foo", exports:[]}],
            (scope) => Assert.fail()))),
      new global.Error("Invalid variable")));
  Lang._match(
    Scope.MODULE(
      Scope._make_root(),
      [],
      (scope) => Tree.BlockStatement(
        Scope.CASE(
          scope,
          (scope) => Tree.BlockStatement(
            Scope.Block(
              scope,
              [],
              [
                {kind:"let", ghost:false, name:"LET", exports:[]},
                {kind:"const", ghost:false, name:"CONST", exports:[]},
                {kind:"class", ghost:false, name:"CLASS", exports:[]}],
              (scope) => Tree.BundleStatement(
                [
                  Scope.Initialize(
                    scope,
                    "let",
                    "LET",
                    Tree.PrimitiveExpression(123)),
                  Scope.Initialize(
                    scope,
                    "const",
                    "CONST",
                    Tree.PrimitiveExpression(456)),
                  Scope.Initialize(
                    scope,
                    "class",
                    "CLASS",
                    Tree.PrimitiveExpression(789))])))))),
    Lang.parseBlock(
      `
        {
          {
            {
              let $$LET, $$CONST, $$CLASS;
              $$LET = 123;
              $$CONST = 456;
              $$CLASS = 789; } } }`),
    Assert);
  // Block //
  Lang._match(
    Scope.SCRIPT(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [],
      (scope) => Tree.BlockStatement(
        Scope.CASE(
          scope,
          (scope) => Scope.Box(
            scope,
            false,
            "frame",
            Tree.PrimitiveExpression(123),
            (box) => Tree.BlockStatement(
              Scope.Block(
                Scope._extend_dynamic_with(scope, box),
                [],
                [
                  {kind:"let", ghost:true, name:"LET", exports:[]},
                  {kind:"const", ghost:true, name:"CONST", exports:[]},
                  {kind:"class", ghost:true, name:"CLASS", exports:[]}],
                (scope) => Tree.BundleStatement(
                  [
                    Tree.ExpressionStatement(
                      Scope.delete(scope, "x"))]))))))),
    Lang.parseBlock(
      `
        {
          {
            {
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
        Scope._make_root(),
        [],
        (scope) => Tree.BlockStatement(
          Scope.CLOSURE_HEAD(
            scope,
            "arrow",
            false,
            [
              {kind:"let", ghost:false, name:"x"}],
            (scope) => Assert.fail()))),
      new global.Error("Invalid variable")));
  Lang._match(
    Scope.SCRIPT(
      Scope._make_root(),
      [],
      (scope) => Tree.BlockStatement(
        Scope.CLOSURE_HEAD(
          Scope._use_strict(scope),
          "arrow",
          true,
          [
            {kind:"param", ghost:false, name:"PARAM", exports:[]},
            {kind:"var", ghost:false, name:"HEAD_VAR", exports:[]},
            {kind:"function", ghost:false, name:"HEAD_FUNCTION", exports:[]}],
          (scope) => (
            Assert.deepEqual(
              Scope._is_strict(scope),
              true),
            Assert.deepEqual(
              Scope._fetch_sort(scope),
              "arrow"),
            Tree.BundleStatement(
              [
                Scope.Initialize(
                  scope,
                  "param",
                  "PARAM",
                  Tree.PrimitiveExpression(123)),
                Tree.BlockStatement(
                  Scope.EVAL(
                    scope,
                    [
                      {kind:"var", ghost:false, name:"EVAL_HEAD_VAR", exports:[]},
                      {kind:"function", ghost:false, name:"EVAL_HEAD_FUNCTION", exports:[]}],
                    (scope) => Tree.ExpressionStatement(
                      Tree.PrimitiveExpression(456)))),
                Tree.BlockStatement(
                  Scope.CLOSURE_BODY(
                    scope,
                    true,
                    [
                      {kind:"var", ghost:false, name:"BODY_VAR", exports:[]},
                      {kind:"function", ghost:false, name:"BODY_FUNCTION", exports:[]},
                      {kind:"let", ghost:false, name:"LET", exports:[]},
                      {kind:"const", ghost:true, name:"CONST", exports:[]},
                      {kind:"class", ghost:true, name:"CLASS", exports:[]}],
                    (scope) => Tree.BundleStatement(
                      [
                        Scope.Initialize(
                          scope,
                          "let",
                          "LET",
                          Tree.PrimitiveExpression(456)),
                        Tree.ExpressionStatement(
                          Scope.delete(scope, "x")),
                        Tree.BlockStatement(
                          Scope.EVAL(
                            scope,
                            [
                              {kind:"var", ghost:false, name:"EVAL_BODY_VAR", exports:[]},
                              {kind:"function", ghost:false, name:"EVAL_BODY_FUNCTION", exports:[]}],
                            (scope) => Tree.ExpressionStatement(
                              Tree.PrimitiveExpression(456))))])))]))))),
    Lang.parseBlock(
      `{
        {
          let $_HeadClosureFrame_10_1, $$PARAM;
          $_HeadClosureFrame_10_1 = {__proto__:null};
          (
            #Reflect.getOwnPropertyDescriptor($_HeadClosureFrame_10_1, "HEAD_VAR") ?
            void 0 :
            #Object.defineProperty(
              $_HeadClosureFrame_10_1,
              "HEAD_VAR",
              {
                __proto__: null,
                ["value"]: void 0,
                ["writable"]: true,
                ["enumerable"]: true,
                ["configurable"]: false}));
          #Object.defineProperty(
            $_HeadClosureFrame_10_1,
            "HEAD_FUNCTION",
            {
              __proto__: null,
              value: #Symbol("function-placeholder"),
              writable: true,
              enumerable: true,
              configurable: false});
          $$PARAM = 123;
          {
            let $$EVAL_HEAD_VAR, $$EVAL_HEAD_FUNCTION;
            $$EVAL_HEAD_VAR = void 0;
            $$EVAL_HEAD_FUNCTION = void 0;
            456;}
          {
            let $_BodyClosureFrame_12_1, $$LET;
            $_BodyClosureFrame_12_1 = {__proto__:null};
            (
              #Reflect.getOwnPropertyDescriptor($_BodyClosureFrame_12_1, "BODY_VAR") ?
              void 0 :
              #Object.defineProperty(
                $_BodyClosureFrame_12_1,
                "BODY_VAR",
                {
                  __proto__: null,
                  ["value"]: void 0,
                  ["writable"]: true,
                  ["enumerable"]: true,
                  ["configurable"]: false}));
            #Object.defineProperty(
              $_BodyClosureFrame_12_1,
              "BODY_FUNCTION",
              {
                __proto__: null,
                value: #Symbol("function-placeholder"),
                writable: true,
                enumerable: true,
                configurable: false});
            $$LET = 456;
            (
              #Reflect.has($_BodyClosureFrame_12_1, "x") ?
              (
                #Reflect.deleteProperty($_BodyClosureFrame_12_1, "x") ?
                true :
                throw new #TypeError("Cannot delete object property")) :
              (
                #Reflect.has($_HeadClosureFrame_10_1, "x") ?
                (
                  #Reflect.deleteProperty($_HeadClosureFrame_10_1, "x") ?
                  true :
                  throw new #TypeError("Cannot delete object property")) :
                true));
            {
              let $$EVAL_BODY_VAR, $$EVAL_BODY_FUNCTION;
              $$EVAL_BODY_VAR = void 0;
              $$EVAL_BODY_FUNCTION = void 0;
              456;}}}}`),
    Assert);
  Lang._match(
    Scope.SCRIPT(
      Scope._make_root(),
      [],
      (scope) => Tree.BlockStatement(
        Scope.CLOSURE_HEAD(
          scope,
          "method",
          false,
          [
            {kind:"param", ghost:true, name:"PARAM", exports:[]},
            {kind:"var", ghot:false, name:"VAR", exports:[]},
            {kind:"function", ghost:false, name:"FUNCTION", exports:[]}],
          (scope) => Tree.BlockStatement(
            Scope.CLOSURE_BODY(
              scope,
              false,
              [
                {kind:"var", ghost:false, name:"VAR", exports:[]},
                {kind:"function", ghost:false, name:"FUNCTION", exports:[]},
                {kind:"let", ghost:true, name:"LET", exports:[]},
                {kind:"const", ghost:true, name:"CONST", exports:[]},
                {kind:"class", ghost:true, name:"CLASS", exports:[]}],
              (scope) => Tree.ExpressionStatement(
                Tree.PrimitiveExpression(123))))))),
    Lang.parseBlock(`{
      {
        let $$VAR, $$FUNCTION;
        $$VAR = void 0;
        $$FUNCTION = void 0;
        {
          let $$VAR, $$FUNCTION;
          $$VAR = void 0;
          $$FUNCTION = void 0;
          123; } } }`),
  Assert);
  Lang._match(
    Scope.SCRIPT(
      Scope._make_root(),
      [],
      (scope) => Tree.BlockStatement(
        Scope.CLOSURE_HEAD(
          scope,
          "method",
          true,
          [
            {kind:"param", ghost:false, name:"PARAM", exports:[]}],
          (scope) => Tree.BundleStatement(
            [
              Scope.Initialize(
                scope,
                "param",
                "PARAM",
                Tree.PrimitiveExpression(123)),
              Tree.BlockStatement(
                Scope.CLOSURE_BODY(
                  scope,
                  true,
                  [
                    {kind:"var", ghost:false, name:"VAR", exports:[]},
                    {kind:"function", ghost:false, name:"FUNCTION", exports:[]},
                    {kind:"let", ghost:false, name:"LET", exports:[]},
                    {kind:"const", ghost:true, name:"CONST", exports:[]},
                    {kind:"class", ghost:true, name:"CLASS", exports:[]}],
                  (scope) => Scope.Initialize(
                    scope,
                    "let",
                    "LET",
                    Tree.PrimitiveExpression(456))))])))),
    Lang.parseBlock(
      `
      {
        {
          let $_DynamicHeadClosureFrame_10_1, $$PARAM;
          $_DynamicHeadClosureFrame_10_1 = {__proto__:null};
          $$PARAM = 123;
          {
            let $_DynamicBodyClosureFrame_12_1, $$LET;
            $_DynamicBodyClosureFrame_12_1 = {__proto__:null};
            (
              #Reflect.getOwnPropertyDescriptor($_DynamicBodyClosureFrame_12_1, "VAR") ?
              void 0 :
              #Object.defineProperty(
                $_DynamicBodyClosureFrame_12_1,
                "VAR",
                {
                  __proto__: null,
                  ["value"]: void 0,
                  ["writable"]: true,
                  ["enumerable"]: true,
                  ["configurable"]: false}));
            #Object.defineProperty(
              $_DynamicBodyClosureFrame_12_1,
              "FUNCTION",
              {
                __proto__: null,
                value: #Symbol("function-placeholder"),
                writable: true,
                enumerable: true,
                configurable: false});
            $$LET = 456;}}}`),
    Assert);
  // eval //
  Assert.deepEqual(global.Reflect.ownKeys(state.scopes).length, 0);
  Lang._match(
    Scope.MODULE(
      Scope._make_root(
        {
          strict: true,
          sort: "constructor"}),
      [],
      (scope) => Tree.ExpressionStatement(
        Scope.eval(
          scope,
          Tree.PrimitiveExpression(123)))),
    Lang.parseBlock(
      `{ eval(123); }`),
    Assert);
  Assert.deepEqual(global.Reflect.ownKeys(state.scopes).length, 1);
  Assert.deepEqual(
    state.scopes[global.Reflect.ownKeys(state.scopes)[0]].context,
    {
      strict: true,
      sort: "constructor"});
  Assert.deepEqual(typeof state.scopes[global.Reflect.ownKeys(state.scopes)[0]].stringified, "string");
  // _is_available //
  Lang._match(
    Scope.SCRIPT(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [],
      (scope) => (
        Assert.deepEqual(
          Scope._is_available(scope, "var", "x"),
          null),
        Assert.deepEqual(
          Scope._is_available(scope, "let", "x"),
          null),
        Scope.Box(
          scope,
          false,
          "frame",
          Tree.PrimitiveExpression(123),
          (box) => Tree.BlockStatement(
            Scope.Block(
              Scope._extend_dynamic_with(scope, box),
              [],
              [],
              (scope) => (
                Assert.deepEqual(
                  Scope._is_available(scope, "var", "x"),
                  null),
                Assert.deepEqual(
                  Scope._is_available(scope, "let", "x"),
                  true),
                Tree.ExpressionStatement(
                  Tree.PrimitiveExpression(456)))))))),
    Lang.parseBlock(
      `
        {
          {
            456; } }`),
    Assert);
  // delete //
  Lang._match(
    Scope.MODULE(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"import", ghost:true, name:"z", source:"src", ImportExpression:"spc"}],
      (scope) => Tree.BundleStatement(
        [
          Tree.ExpressionStatement(
            Scope.delete(scope, "y")),
          Tree.ExpressionStatement(
            Scope.delete(scope, "x")),
          Tree.ExpressionStatement(
            Scope.delete(scope, "z"))])),
    Lang.parseBlock(
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
          false;
          false; }`),
    Assert);
  // typeof //
  Lang._match(
    Scope.MODULE(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"import", ghost:true, name:"z", source:"src", ImportExpression:"spc"},
        {kind:"let", ghost:true, name:"t", exports:[]}],
      (scope) => Tree.BundleStatement(
        [
          Tree.ExpressionStatement(
            Scope.typeof(scope, "y")),
          Tree.ExpressionStatement(
            Scope.typeof(scope, "x")),
          Tree.ExpressionStatement(
            Scope.typeof(scope, "z")),
          Tree.ExpressionStatement(
            Scope.typeof(scope, "t"))])),
    Lang.parseBlock(
      `
        {
          let $$x;
          $$x = void 0;
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "y") ?
            (
              (#Reflect.get(#aran.globalDeclarativeRecord, "y") === #aran.deadzoneMarker) ?
              throw new #ReferenceError("Cannot read type from non-initialized dynamic variable named y") :
              typeof #Reflect.get(#aran.globalDeclarativeRecord, "y")) :
            (
              #Reflect.has(#aran.globalObjectRecord, "y") ?
              typeof #Reflect.get(#aran.globalObjectRecord, "y") :
              "undefined"));
          typeof $$x;
          typeof import spc from "src";
          throw new #ReferenceError("Cannot read type from non-initialized static variable named t"); }`),
    Assert);
  // read //
  Lang._match(
    Scope.MODULE(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [
        {kind:"var", ghost:false, name:"x", exports:[]},
        {kind:"import", ghost:true, name:"z", source:"src", ImportExpression:"spc"},
        {kind:"let", ghost:true, name:"t", exports:[]}],
      (scope) => Tree.BundleStatement(
        [
          Tree.ExpressionStatement(
            Scope.read(scope, "y")),
          Tree.ExpressionStatement(
            Scope.read(scope, "x")),
          Tree.ExpressionStatement(
            Scope.read(scope, "z")),
          Tree.ExpressionStatement(
            Scope.read(scope, "t"))])),
    Lang.parseBlock(
      `
        {
          let $$x;
          $$x = void 0;
          (
            #Reflect.has(#aran.globalDeclarativeRecord, "y") ?
            (
              (#Reflect.get(#aran.globalDeclarativeRecord, "y") === #aran.deadzoneMarker) ?
              throw new #ReferenceError("Cannot read from non-initialized dynamic variable named y") :
              #Reflect.get(#aran.globalDeclarativeRecord, "y")) :
            (
              #Reflect.has(#aran.globalObjectRecord, "y") ?
              #Reflect.get(#aran.globalObjectRecord, "y") :
              throw new #ReferenceError("Cannot read from missing variable y")));
          $$x;
          import spc from "src";
          throw new #ReferenceError("Cannot read from non-initialized static variable named t"); }`),
    Assert);
  // optimistic write //
  Lang._match(
    Scope.MODULE(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [
        {kind:"var", ghost:false, name:"x", exports:["foo", "bar"]},
        {kind:"const", ghost:false, name:"y", exports:[]}],
      (scope) => Tree.BundleStatement(
        [
          Tree.ExpressionStatement(
            Scope.write(
              scope,
              "x",
              Tree.UnaryExpression(
                "!",
                Tree.PrimitiveExpression(123)))),
          Tree.ExpressionStatement(
            Scope.write(
              scope,
              "y",
              Tree.UnaryExpression(
                "!",
                Tree.PrimitiveExpression(456)))),
          Scope.Initialize(
            scope,
            "const",
            "y",
            Tree.PrimitiveExpression(789)),
          Tree.ExpressionStatement(
            Scope.write(
              scope,
              "y",
              Tree.UnaryExpression(
                "!",
                Tree.PrimitiveExpression(901))))])),
    Lang.parseBlock(
      `
        {
          let $$x, $$y;
          (
            (
              $$x = void 0,
              export foo $$x),
            export bar $$x);
          (
            (
              $$x = !123,
              export foo $$x),
            export bar $$x);
          (
            !456,
            throw new #ReferenceError("Cannot write to non-initialized static variable named y"));
          $$y = 789;
          (
            !901,
            throw new #TypeError("Cannot write to static constant variable named y")); }`),
    Assert);
  // pessimistic write strict //
  Lang._match(
    Scope.MODULE(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [
        {kind:"var", ghost:false, name:"x", exports:["foo", "bar"]},
        {kind:"const", ghost:false, name:"y", exports:[]},
        {kind:"const", ghost:true, name:"z", exports:[]}],
      (scope) => (
        scope = Scope._use_strict(scope),
        Tree.BundleStatement(
          [
            Scope.Initialize(
              scope,
              "const",
              "y",
              Tree.PrimitiveExpression(123)),
            Scope.Box(
              scope,
              false,
              "frame",
              Tree.PrimitiveExpression(456),
              (box) => Tree.BlockStatement(
                Scope.Block(
                  Scope._extend_dynamic_with(scope, box),
                  [],
                  [],
                  (scope) => Tree.BundleStatement(
                    [
                      Tree.ExpressionStatement(
                        Scope.write(
                          scope,
                          "x",
                          Tree.UnaryExpression(
                            "!",
                            Tree.PrimitiveExpression(789)))),
                      Tree.ExpressionStatement(
                        Scope.write(
                          scope,
                          "y",
                          Tree.UnaryExpression(
                            "!",
                            Tree.PrimitiveExpression(901)))),
                      Tree.ExpressionStatement(
                        Scope.write(
                          scope,
                          "z",
                          Tree.UnaryExpression(
                            "!",
                            Tree.PrimitiveExpression(234)))),
                      Tree.ExpressionStatement(
                        Scope.write(
                          scope,
                          "t",
                          Tree.UnaryExpression(
                            "!",
                            Tree.PrimitiveExpression(234))))]))))]))),
    Lang.parseBlock(
      `
      {
        let $$x, $$y;
        (
          (
            $$x = void 0,
            export foo $$x),
          export bar $$x);
        $$y = 123;
        {
          let $_right1, $_unscopables2, $_right2, $_unscopables4, $_right3, $_unscopables6, $_right4, $_unscopables7;
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
              (
                (
                  $$x = $_right1,
                  export foo $$x),
                export bar $$x)));
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
              throw new #TypeError("Cannot write to static constant variable named y")));
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
              throw new #ReferenceError("Cannot write to non-initialized static variable named z")));
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
                  throw new #ReferenceError("Cannot write to non-initialized dynamic variable named t") :
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
  Lang._match(
    Scope.SCRIPT(
      Scope._extend_dynamic_global(
        Scope._make_root()),
      [],
      (scope) => Tree.BlockStatement(
        Scope.Block(
          scope,
          [],
          [
            {kind:"let", ghost:false, name:"x", exports:[]},
            {kind:"const", ghost:false, name:"y", exports:[]},
            {kind:"const", ghost:true, name:"z", exports:[]}],
          (scope) => Tree.BundleStatement(
            [
              Scope.Initialize(
                scope,
                "let",
                "x",
                Tree.PrimitiveExpression(0)),
              Scope.Initialize(
                scope,
                "const",
                "y",
                Tree.PrimitiveExpression(123)),
              Scope.Box(
                scope,
                false,
                "frame",
                Tree.PrimitiveExpression(456),
                (box) => Tree.BlockStatement(
                  Scope.Block(
                    Scope._extend_dynamic_with(scope, box),
                    [],
                    [],
                    (scope) => Tree.BundleStatement(
                      [
                        Tree.ExpressionStatement(
                          Scope.write(
                            scope,
                            "x",
                            Tree.UnaryExpression(
                              "!",
                              Tree.PrimitiveExpression(789)))),
                        Tree.ExpressionStatement(
                          Scope.write(
                            scope,
                            "y",
                            Tree.UnaryExpression(
                              "!",
                              Tree.PrimitiveExpression(901)))),
                        Tree.ExpressionStatement(
                          Scope.write(
                            scope,
                            "z",
                            Tree.UnaryExpression(
                              "!",
                              Tree.PrimitiveExpression(234)))),
                        Tree.ExpressionStatement(
                          Scope.write(
                            scope,
                            "t",
                            Tree.UnaryExpression(
                              "!",
                              Tree.PrimitiveExpression(234))))]))))])))),
    Lang.parseBlock(
      `
        {
          {
            let $$x, $$y;
            $$x = 0;
            $$y = 123;
            {
              let $_RightHandSide_10_1, $_ScopeBaseUnscopables_10_2, $_RightHandSide_10_2, $_ScopeBaseUnscopables_10_4, $_RightHandSide_10_3, $_ScopeBaseUnscopables_10_6, $_RightHandSide_10_4, $_ScopeBaseUnscopables_10_7;
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
                  throw new #TypeError("Cannot write to static constant variable named y")));
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
                  throw new #ReferenceError("Cannot write to non-initialized static variable named z")));
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
                      throw new #ReferenceError("Cannot write to non-initialized dynamic variable named t") :
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
  // special_read //
  Assert.throws(
    () => Scope.read(Scope._make_root(), "this"),
    new global.Error(`Missing special variable named 'this'`));
  Lang._match(
    Scope.MODULE(
      Scope._make_root(
        {
          sort:"derived-constructor",
          enclave: true}),
      [
        {kind:"const", name:"this", ghost:false, exports:[]},
        {kind:"const", name:"new.target", ghost:false, exports:[]}],
      (scope) => (
        Assert.throws(
          () => Scope.read(scope, "this"),
          new global.Error(`Dead special variable named 'this'`)),
        Tree.BundleStatement(
          [
            Scope.Initialize(
              scope,
              "const",
              "this",
              Tree.PrimitiveExpression("THIS")),
            Scope.Initialize(
              scope,
              "const",
              "new.target",
              Tree.PrimitiveExpression("NEW_TARGET")),
            Tree.ExpressionStatement(
              Scope.read(scope, "this")),
            Tree.ExpressionStatement(
              Scope.read(scope, "new.target")),
            Tree.ExpressionStatement(
              Scope.read(scope, "import.meta"))]))),
    Lang.parseBlock(`{
      let $this, $0newtarget;
      $this = "THIS";
      $0newtarget = "NEW_TARGET";
      (
        $this ?
        $this :
        throw new #ReferenceError("Cannot read variable named 'this' before calling super constructor"));
      $0newtarget;
      enclave import.meta; }`),
    Assert);
  // Super >> derived-constructor //
  Lang._match(
    Scope.MODULE(
      Scope._make_root({sort:"derived-constructor"}),
      [{kind:"const", name:"super", ghost:false, exports:[]}],
      (scope) => Tree.BundleStatement(
        [
          Scope.Initialize(
            scope,
            "const",
            "super",
            Tree.PrimitiveExpression("SUPER")),
          (
            Assert.throws(
              () => Scope.super_member(
                scope,
                Tree.PrimitiveExpression("foo")),
              new global.Error("Missing special variable during super access")),
            Tree.ExpressionStatement(
              Tree.PrimitiveExpression(123)))])),
    Lang.parseBlock(`{
      let $super;
      $super = "SUPER";
      123; }`),
    Assert);
  Lang._match(
    Scope.MODULE(
      Scope._make_root({sort:"derived-constructor"}),
      [
        {kind:"const", name:"this", ghost:false, exports:[]},
        {kind:"const", name:"new.target", ghost:false, exports:[]},
        {kind:"const", name:"super", ghost:false, exports:[]}],
      (scope) => Tree.BundleStatement(
        [
          (
            Assert.throws(
              () => Scope.super_member(
                scope,
                Tree.PrimitiveExpression("foo")),
              new global.Error("Super identifier in deadzone (member)")),
            Assert.throws(
              () => Scope.super_call(
                scope,
                Tree.PrimitiveExpression("bar")),
              new global.Error("Super identifier in deadzone (call)")),
            Scope.Initialize(
              scope,
              "const",
              "super",
              Tree.PrimitiveExpression("SUPER"))),
          (
            Assert.throws(
              () => Scope.super_call(
                scope,
                Tree.PrimitiveExpression("bar")),
              new global.Error("Dead special variable during super access")),
            Scope.Initialize(
              scope,
              "const",
              "this",
              Tree.PrimitiveExpression("THIS"))),
          Scope.Initialize(
            scope,
            "const",
            "new.target",
            Tree.PrimitiveExpression("NEW_TARGET")),
          Tree.ExpressionStatement(
            Scope.super_member(
              scope,
              Tree.PrimitiveExpression("KEY1"))),
          Tree.ExpressionStatement(
            Scope.super_call(
              scope,
              Tree.PrimitiveExpression("ARGUMENTS2")))])),
    Lang.parseBlock(`{
      let $this, $super, $0newtarget;
      $super = "SUPER";
      $this = "THIS";
      $0newtarget = "NEW_TARGET";
      (
        $this ?
        #Reflect.get(
          #Reflect.getPrototypeOf(
            #Reflect.get($super, "prototype")),
          "KEY1") :
        throw new #ReferenceError("Cannot access super property before calling super constructor"));
      (
        $this ?
        throw new #ReferenceError("Super constructor may only be called once") :
        (
          $this = #Reflect.construct(
            #Reflect.get($super, "constructor"),
            "ARGUMENTS2",
            $0newtarget),
          $this)); }`),
    Assert);
  // super >> method //
  Lang._match(
    Scope.MODULE(
      Scope._make_root({sort:"method"}),
      [
        {kind:"const", name:"super", ghost:false, exports:[]}],
      (scope) => Tree.BundleStatement(
        [
          Scope.Initialize(
            scope,
            "const",
            "super",
            Tree.PrimitiveExpression("SUPER")),
          Tree.ExpressionStatement(
            Scope.super_member(
              scope,
              Tree.PrimitiveExpression("KEY1")))])),
    Lang.parseBlock(`{
      let $super;
      $super = "SUPER";
      #Reflect.get(
        #Reflect.getPrototypeOf(
          #Reflect.get($super, "prototype")),
        "KEY1"); }`),
    Assert);
    // Enclave //
    Lang._match(
      Scope.MODULE(
        Scope._make_root({enclave:true}),
        [],
        (scope) => (
          Assert.throws(
            () => Scope.delete(scope, "x1"),
            new Throw.EnclaveLimitationAranError(`Aran cannot delete any external identifier`)),
          Tree.BundleStatement(
            [
              Tree.ExpressionStatement(
                Scope.read(scope, "x2")),
              Tree.ExpressionStatement(
                Scope.typeof(scope, "x3")),
              Tree.ExpressionStatement(
                Scope.write(
                  scope,
                  "x4",
                  Tree.PrimitiveExpression(1))),
              Tree.ExpressionStatement(
                Scope.write(
                  Scope._extend_dynamic_with(
                    scope,
                    Scope._primitive_box(2)),
                  "x5",
                  Tree.UnaryExpression(
                    "!",
                    Tree.PrimitiveExpression(3)))),
              Tree.ExpressionStatement(
                Scope.super_member(
                  scope,
                  Tree.PrimitiveExpression(4))),
              Tree.ExpressionStatement(
                Scope.super_call(
                  scope,
                  Tree.PrimitiveExpression(5)))]))),
      Lang.parseBlock(
        `{
          let _right, _unscopables;
          enclave x2;
          enclave typeof x3;
          enclave x4 ?= 1;
          (
            _right = !3,
            (
              (
                #Reflect.has(2, "x5") ?
                (
                  _unscopables = #Reflect.get(2, #Symbol.unscopables),
                  (
                    (
                      (typeof _unscopables === "object") ?
                      _unscopables :
                      (typeof _unscopables === "function")) ?
                    !#Reflect.get(_unscopables, "x5") :
                    true)) :
                false) ?
              #Reflect.set(2, "x5", _right) :
              enclave x5 ?= _right));
          enclave super[4];
          enclave super(...5); }`),
      Assert);
}, []);

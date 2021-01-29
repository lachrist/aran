"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const ParseExternal = require("../../parse-external.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Completion = require("../completion.js");
const Query = require("../query");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit.initializeTest(
  [
    require("./other.js"),
    require("./pattern.js"),
    require("./closure.js"),
    require("./class.js"),
    require("./expression.js"),
    require("./hoisted-statement.js"),
    require("./statement.js"),
    {
      visitClosureBody: (scope, node, context) => Visit.visitBlock(scope, node, context),
      visitBlock: (scope, node, context, _nodes) => (
        context = global.Object.assign(
          {
            completion: Completion.Empty(),
            reset: false,
            with: null},
          context),
        _nodes = node.type === "BlockStatement" ? node.body : [node],
        Scope.makeNormalBlock(
          scope,
          ArrayLite.flatMap(_nodes, Query.getShallowHoisting),
          (scope) => Tree.ListStatement(
            [
              (
                (
                  context.reset &&
                  Completion.isLast(context.completion)) ?
                Tree.ExpressionStatement(
                  Scope.makeCloseCompletionExpression(
                    scope,
                    Tree.PrimitiveExpression(void 0))) :
                Tree.ListStatement([])),
              Tree.ListStatement(
                ArrayLite.map(
                  _nodes,
                  (node) => Visit.visitStatement(scope, node, {completion:context.completion}))),
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(void 0))]))),
      visitSwitch: (scope, node, context) => (
        context = global.Object.assign(
          {
            completion: Completion.Empty(),
            matched: global.undefined,
            discriminant: global.undefined},
          context),
        Assert.deepEqual(node.cases, []),
        Scope.makeNormalBlock(
          scope,
          [],
          () => Tree.CompletionStatement(
            Tree.PrimitiveExpression("switch-completion"))))}]);

State.runSession({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {

  const test = (scope, variables, code1, context) => Scope.makeModuleBlock(
    scope,
    variables,
    (scope) => Tree.ListStatement(
      [
        Visit.visitStatement(
          scope,
          (
            typeof code1 === "string" ?
            ParseExternal(code1, {source:Scope.isStrict(scope) ? "module" : "script"}).body[0] :
            code1),
          context),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(void 0))]));

  const success = (scope, variables, code1, context, code2) => Lang.match(
    test(scope, variables, code1, context),
    Lang.parseBlock(code2),
    Assert);

  const failure = (scope, variables, code1, context, message) => Assert.throws(
    () => test(scope, variables, code1, context),
    new global.Error(message));

  // EmptyStatement //
  success(
    Scope.RootScope(),
    [],
    `;`,
    null,
    `{
      completion void 0; }`);
  // DebuggerStatement
  success(
    Scope.RootScope(),
    [],
    `debugger;`,
    null,
    `{
      debugger;
      completion void 0; }`);
  // ExpressionStatement //
  success(
    Scope.RootScope(
      {
        completion: Scope.TestBox("_completion")}),
    [],
    `123;`,
    {
      completion: Completion.Full()},
    `{
      _completion = 123;
      completion void 0; }`);
  success(
    Scope.RootScope(
      {
        completion: Scope.TestBox("_completion")}),
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    `x++;`,
    {
      completion: Completion.Full()},
    `{
      let $x, _result;
      $x = void 0;
      _completion = (
        _result = $x,
        (
          $x = (
            _result +
            (
              (typeof _result === "bigint") ?
              1n :
              1)),
          _result));
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    `x++;`,
    null,
    `{
      let $x, _x;
      $x = void 0;
      (
        _x = $x,
        $x = (
          _x + 
          (
            (typeof _x === "bigint") ?
            1n :
            1)));
      completion void 0; }`);
  // BreakStatement //
  success(
    Scope.RootScope(),
    [],
    {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    null,
    `{
      break Bfoo;
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [],
    {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    {labels: ["foo"]},
    `{
      completion void 0; }`);
  success(
    Scope.RootScope({loop:"foo"}),
    [],
    {
      type: "BreakStatement",
      label: null},
    null,
    `{
      break bfoo;
      completion void 0; }`);
  // ContinueStatement //
  success(
    Scope.RootScope(),
    [],
    {
      type: "ContinueStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    null,
    `{
      break Cfoo;
      completion void 0; }`);
  failure(
    Scope.RootScope({loop:"foo"}),
    [],
    {
      type: "ContinueStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    {labels:["foo"]},
    "Break label used as continue label");
  success(
    Scope.RootScope({loop:"foo"}),
    [],
    {
      type: "ContinueStatement",
      label: null},
    null,
    `{
      break cfoo;
      completion void 0; }`);
  // ThrowStatement //
  success(
    Scope.RootScope(),
    [],
    `throw 123;`,
    null,
    `{
      throw 123;
      completion void 0; }`);
  // ImportDeclaration //
  success(
    Scope.RootScope({strict:true}),
    [],
    `import {imported as local} from "source";`,
    null,
    `{
      completion void 0; }`);
  // ExportAllDeclaration //
  success(
    Scope.RootScope({strict:true}),
    [],
    `export * from "source"`,
    null,
    `{
      completion void 0; }`);
  // ExportDefaultDeclaration //
  success(
    Scope.RootScope({strict:true}),
    [],
    `export default 123;`,
    null,
    `{
      export default 123;
      completion void 0; }`);
  success(
    Scope.RootScope({strict:true}),
    [
      {kind:"function", name:"f", ghost:false, exports:["default"]}],
    `export default function f () {};`,
    null,
    `{
      let $f;
      ($f = void 0, export default $f);
      completion void 0; }`);
  success(
    Scope.RootScope({strict:true}),
    [],
    `export default function () { 123 };`,
    null,
    `{
      let _prototype;
      export default (
        _prototype = {__proto__:#Object.prototype},
        ${Lang.generate(
          Visit.visitClosure(
            Scope.RootScope({strict:true}),
            ParseExternal(`(function () { 123 });`).body[0].expression,
            {
              prototype: Scope.TestBox("_prototype"),
              name: Scope.PrimitiveBox("default")}))});
      completion void 0; }`);
  success(
    Scope.RootScope({strict:true}),
    [
      {kind:"class", name:"c", ghost:false, exports:["default"]}],
    `export default class c {};`,
    null,
    `{
      let $c;
      (
        $c = ${Lang.generate(
          Visit.visitClass(
            Scope.RootScope({strict:true}),
            ParseExternal(`(class c {});`).body[0].expression,
            null))},
        export default $c);
      completion void 0; }`);
  success(
    Scope.RootScope({strict:true}),
    [],
    `export default class {};`,
    null,
    `{
      let _prototype, _super, _constructor;
      export default (
        _prototype = {__proto__: #Reflect.get(#Object, "prototype")},
        (
          _super = {
            __proto__: null,
            constructor: #Object,
            prototype: _prototype},
          (
            _constructor = #Reflect.get(
              #Object.defineProperty(
                _prototype,
                "constructor",
                {
                  __proto__: null,
                  value:  #Object.defineProperty(
                    #Object.defineProperty(
                      #Object.defineProperty(
                        constructor () {
                          completion (
                            #Reflect.get(input, "new.target") ?
                            #Reflect.construct(
                              #Object,
                              #Reflect.get(input, "arguments"),
                              #Reflect.get(input, "new.target")) :
                            throw new #TypeError("Generated closure must be invoked as a constructor")); },
                        "length",
                        {
                          __proto__: null,
                          value: 0,
                          writable: false,
                          enumerable: false,
                          configurable: true}),
                      "name",
                      {
                        __proto__: null,
                        value: "default",
                        writable: false,
                        enumerable: false,
                        configurable: true}),
                    "prototype",
                    {
                      __proto__: null,
                      value: _prototype,
                      writable: false,
                      enumerable: false,
                      configurable: false}),
                  writable: true,
                  enumerable: false,
                  configurable: true}),
              "constructor"),
            _constructor)));
      completion void 0; }`);
  // ExportNamedDeclaration (node.declaration !== null) //
  success(
    Scope.RootScope({strict:true}),
    [
      {kind: "let", name: "x", ghost:false, exports:["x"]},
      {kind: "let", name: "y", ghost:false, exports:["y"]}],
    `export let x = 123, y = 456;`,
    null,
    `{
      let $x, $y;
      (
        $x = 123,
        export x $x);
      (
        $y = 456,
        export y $y);
      completion void 0; }`);
  success(
    Scope.RootScope({strict:true}),
    [
      {kind: "function", name: "f", ghost:false, exports:["f"]}],
    `export function f () {}`,
    null,
    `{
      let $f;
      (
        $f = void 0,
        export f $f);
      completion void 0; }`);
  success(
    Scope.RootScope({strict:true}),
    [
      {kind:"class", name:"c", ghost:false, exports:["c"]}],
    `export class c {};`,
    null,
    `{
      let $c;
      (
        $c = ${Lang.generate(
          Visit.visitClass(
            Scope.RootScope({strict:true}),
            ParseExternal(`(class c {});`).body[0].expression,
            null))},
        export c $c);
      completion void 0; }`);
  // ExportNamedDeclaration //
  success(
    Scope.RootScope({strict:true}),
    [
      {kind: "var", name: "x", ghost:false, exports:["foo"]},
      {kind: "var", name: "y", ghost:false, exports:["bar"]}],
    {
      type: "ExportNamedDeclaration",
      declaration: null,
      source: null,
      exports: [
        {
          type: "ExportSpecifier",
          local: {
            type: "Identifier",
            name: "x" },
          exported: {
            type: "Identifier",
            name: "foo"}},
        {
          type: "ExportSpecifier",
          local: {
            type: "Identifier",
            name: "y" },
          exported: {
            type: "Identifier",
            name: "bar"}}]},
    null,
    `{
      let $x, $y;
      (
        $x = void 0,
        export foo $x);
      (
        $y = void 0,
        export bar $y);
      completion void 0; }`);
  success(
    Scope.RootScope({strict:true}),
    [],
    `export {x as foo, y as bar} from "source"`,
    null,
    `{
      completion void 0; }`);
  // VariableDeclaration //
  success(
    Scope.RootScope(),
    [
      {kind:"let", name:"x", ghost:false, exports:[]},
      {kind:"let", name:"y", ghost:false, exports:[]},
      {kind:"let", name:"z", ghost:false, exports:[]},
      {kind:"let", name:"t", ghost:false, exports:[]}],
    `let x = () => { 123; }, {y, z} = 456, t;`,
    null,
    `{
      let $x, $y, $z, $t, _right;
      $x = ${Lang.generate(
        Visit.visitClosure(
          Scope.RootScope({strict:true}),
          ParseExternal(`(() => { 123; });`).body[0].expression,
          {name: Scope.PrimitiveBox("x")}))};
      _right = (
        (
          (456 === null) ?
          true :
          (456 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        #Object(456));
      $y = #Reflect.get(_right, "y");
      $z = #Reflect.get(_right, "z");
      $t = void 0;
      completion void 0; }`);
  // Return (arrow) //
  success(
    Scope.RootScope({sort:"arrow"}),
    [],
    {
      type: "ReturnStatement",
      argument: null},
    null,
    `{
      return void 0;
      completion void 0; }`);
  success(
    Scope.RootScope({
      sort: "arrow"}),
    [],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    null,
    `{
      return 123;
      completion void 0; }`);
  // Return (function) //
  success(
    Scope.RootScope({sort:"function"}),
    [
      {kind:"var", name:"this", ghost:false, exports:[]},
      {kind:"var", name:"new.target", ghost:false, exports:[]}],
    {
      type: "ReturnStatement",
      argument: null},
    null,
    `{
      let $this, $0newtarget;
      $this = void 0;
      $0newtarget = void 0;
      return ($0newtarget ? $this : void 0);
      completion void 0; }`);
  success(
    Scope.RootScope({sort:"function"}),
    [
      {kind:"var", name:"this", ghost:false, exports:[]},
      {kind:"var", name:"new.target", ghost:false, exports:[]}],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    null,
    `{
      let $this, $0newtarget;
      $this = void 0;
      $0newtarget = void 0;
      return (
        $0newtarget ?
        (
          (
            (typeof 123 === "object") ?
            123 :
            (typeof 123 === "function")) ?
          123 :
          $this) :
        123);
      completion void 0; }`);
  // Return (constructor) //
  success(
    Scope.RootScope({sort:"constructor"}),
    [
      {kind:"var", name:"this", ghost:false, exports:[]}],
    {
      type: "ReturnStatement",
      argument: null},
    null,
    `{
      let $this;
      $this = void 0;
      return $this;
      completion void 0; }`);
  success(
    Scope.RootScope({sort:"constructor"}),
    [
      {kind:"var", name:"this", ghost:false, exports:[]}],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    null,
    `{
      let $this;
      $this = void 0;
      return (
        (
          (typeof 123 === "object") ?
          123 :
          (typeof 123 === "function")) ?
        123 :
        $this);
      completion void 0; }`);
  // Return (derived-constructor) //
  success(
    Scope.RootScope(
      {
        sort: "derived-constructor"}),
    [
      {kind:"var", name:"this", ghost:false, exports:[]}],
    {
      type: "ReturnStatement",
      argument: null},
    null,
    `{
      let $this;
      $this = void 0;
      return (
        $this ?
        $this :
        throw new #ReferenceError("Cannot read variable named 'this' before calling super constructor"));
      completion void 0; }`);
  success(
    Scope.RootScope(
      {
        sort: "derived-constructor"}),
    [
      {kind:"var", name:"this", ghost:false, exports:[]}],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 456}},
    null,
    `{
      let $this;
      $this = void 0;
      return (
        (
          (typeof 456 === "object") ?
          456 :
          (typeof 456 === "function")) ?
        456 :
        (
          (456 === void 0) ?
          (
            $this ?
            $this :
            throw new #ReferenceError("Cannot read variable named 'this' before calling super constructor")) :
          throw new #TypeError("Derived constructors may only return an object or undefined")));
      completion void 0; }`);
  // BlockStatement //
  success(
    Scope.RootScope({
      strict: true,
      completion: Scope.TestBox("_completion")}),
    [],
    `{
      123;
      456; }`,
    {
      completion: Completion.Full()},
    `{
      {
        _completion = 123;
        _completion = 456;
        completion void 0; }
      completion void 0; }`);
  // LabeledStatement //
  success(
    Scope.RootScope(),
    [],
    `foo : break foo;`,
    null,
    `{
      completion void 0;}`);
  success(
    Scope.RootScope(
      {
        completion:Scope.TestBox("_completion")}),
    [],
    `foo : {
      123;
      break foo;
      456; }`,
    {
      completion: Completion.Full()},
    `{
      $foo: {
        _completion = 123;
        break $foo;
        _completion = 456;
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [],
    `foo : function f () {}`,
    null,
    `{
      completion void 0; }`);
  // IfStatement //
  success(
    Scope.RootScope(),
    [],
    `if (123) { 456; } else { 789; }`,
    null,
    `{
      if (
        123)
        {
          456;
          completion void 0; } else
        {
          789;
          completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(
      {
        completion:Scope.TestBox("_completion")}),
    [],
    `if (123) { 456; }`,
    {
      completion: Completion.Full()},
    `{
      _completion = void 0;
      if (
        123)
        {
          _completion = 456;
          completion void 0; } else
        {
          completion void 0; }
      completion void 0; }`);
  // TryStatement //
  success(
    Scope.RootScope(
      {
        completion:Scope.TestBox("_completion")}),
    [],
    `try { 123; } catch { 456; } finally { 789; }`,
    {
      completion: Completion.Full()},
    `{
      _completion = void 0;
      try
        {
          _completion = 123;
          completion void 0; } catch
        {
          _completion = void 0;
          _completion = 456;
          completion void 0; } finally
        {
          789;
          completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(
      {
        completion:Scope.TestBox("_completion")}),
    [],
    `foo: try { 123; } finally { 789; break foo; }`,
    {
      completion: Completion.Full()},
    `{
      _completion = void 0;
      try
        Bfoo:
          {
            _completion = 123;
            completion void 0; } catch
        Bfoo:
          {
            completion throw #Reflect.get(input, "error"); } finally
        Bfoo:
          {
            789; // Block harness is too dumb
            break Bfoo;
            completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [],
    `try { 123; } catch (x) { 456; }`,
    null,
    `{
      try
        {
          123;
          completion void 0; } catch
        {
          let x;
          x = #Reflect.get(input, "error");
          {
            456;
            completion void 0; }
          completion void 0; } finally
        {
          completion void 0; }
      completion void 0; }`);
  // WithStatement //
  success(
    Scope.RootScope(),
    [
      {kind:"var", name:"y", ghost:false, exports:[]}],
    `with (123) { let x = 456; x; y;}`,
    null,
    `{
      let $y, _frame;
      $y = void 0;
      _frame = 123;
      _frame = (
        (
          (_frame === null) ?
          true :
          (_frame === void 0)) ?
        throw new #TypeError("Cannot convert undefined or null to object") :
        #Object(_frame));
      {
        let $x, _unscopables;
        $x = 456;
        $x;
        (
          (
            #Reflect.has(_frame, "y") ?
            (
              _unscopables = #Reflect.get(_frame, #Symbol.unscopables),
              (
                (
                  (typeof _unscopables === "object") ?
                  _unscopables :
                  (typeof _unscopables === "function")) ?
                !#Reflect.get(_unscopables, "y") :
                true)) :
            false) ?
          #Reflect.get(_frame, "y") :
          $y);
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(
      {
        completion: Scope.TestBox("_completion")}),
    [],
    `with (123) 456;`,
    {
      completion: Completion.Full()},
    `{
      let _frame;
      _completion = void 0;
      _frame = 123;
      _frame = (
        (
          (_frame === null) ?
          true :
          (_frame === void 0)) ?
        throw new #TypeError("Cannot convert undefined or null to object") :
        #Object(_frame));
      {
        _completion = 456;
        completion void 0; }
      completion void 0; }`);
  // WhileStatement //
  success(
    Scope.RootScope(
      {
        completion: Scope.TestBox("_completion")}),
    [],
    `while (123) { 456; }`,
    {
      completion: Completion.Full()},
    `{
      _completion = void 0;
      b0:
        {
          while (
            123)
            c0:
              {
                _completion = 456;
                completion void 0; }
          completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [],
    `while (123) 456;`,
    null,
    `{
      b0: {
        while (
          123)
          c0:
          {
            456;
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  // DoWhileStatement //
  success(
    Scope.RootScope(
      {
        completion: Scope.TestBox("_completion")}),
    [],
    `do { 123; } while (456)`,
    {
      completion: Completion.Full()},
    `{
      let _entrance;
      _completion = void 0;
      _entrance = true;
      b0: {
        while (
          (
            _entrance ?
            (
              _entrance = false,
              true) :
            456))
          c0: {
            _completion = 123;
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [],
    `do 123; while (456)`,
    null,
    `{
      let _entrance;
      _entrance = true;
      b0: {
        while (
          (
            _entrance ?
            (
              _entrance = false,
              true) :
            456))
          c0: {
            123;
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  // ForStatement //
  success(
    Scope.RootScope(
      {
        completion: Scope.TestBox("_completion")}),
    [],
    `for (let x = 123; 456; 789) { 0; }`,
    {
      completion: Completion.Full()},
    `{
      _completion = void 0;
      b0: {
        let $x;
        $x = 123;
        while (
          456)
          c0: {
            {
              _completion = 0;
              completion void 0; }
            completion 789; }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(
      {
        completion: Scope.TestBox("_completion")}),
    [],
    `for (;;) 123;`,
    null,
    `{
      b0: {
        while (
          true)
          c0: {
            123;
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [],
    `for (123;;) 456;`,
    null,
    `{
      b0: {
        123;
        while (
          true)
          c0: {
            456;
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    `for (var x = 123;;) 456;`,
    null,
    `{
      let $x;
      $x = void 0;
      b0: {
        $x = 123;
        while (
          true)
          c0: {
            456;
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  // ForInStatement //
  success(
    Scope.RootScope(
      {completion:Scope.TestBox("_completion")}),
    [],
    `for (let x in 123) { let x = 456; 789; }`,
    {
      completion: Completion.Full()},
    `{
      _completion = void 0;
      b0: {
        let _right, _keys, _index, _length;
        _right = 123;
        _keys = #Array.of();
        _right = (
          (
            (_right === null) ?
            true :
            (_right === void 0)) ?
          null :
          #Object(_right));
        while (
          _right)
          {
            _keys = #Array.prototype.concat(
              @#Array.of(),
              _keys,
              #Object.keys(_right));
            _right = #Reflect.getPrototypeOf(_right);
            completion void 0; }
        _index = 0;
        _length = #Reflect.get(_keys, "length");
        while (
          (_index < _length))
          c0: {
            let $x;
            $x = #Reflect.get(_keys, _index);
            {
              let $x;
              $x = 456;
              _completion = 789;
              completion void 0; }
            _index = (_index + 1);
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    `for (var x in 123) { 456; }`,
    null,
    `{
      let $x;
      $x = void 0;
      b0: {
        let _right, _keys, _index, _length;
        _right = 123;
        _keys = #Array.of();
        _right = (
          (
            (_right === null) ?
            true :
            (_right === void 0)) ?
          null :
          #Object(_right));
        while (
          _right)
          {
            _keys = #Array.prototype.concat(
              @#Array.of(),
              _keys,
              #Object.keys(_right));
            _right = #Reflect.getPrototypeOf(_right);
            completion void 0; }
        _index = 0;
        _length = #Reflect.get(_keys, "length");
        while (
          (_index < _length))
          c0: {
            $x = #Reflect.get(_keys, _index);
            {
              456;
              completion void 0; }
            _index = (_index + 1);
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    `for (x in 123) { 456; }`,
    null,
    `{
      let $x;
      $x = void 0;
      b0: {
        let _right, _keys, _index, _length;
        _right = 123;
        _keys = #Array.of();
        _right = (
          (
            (_right === null) ?
            true :
            (_right === void 0)) ?
          null :
          #Object(_right));
        while (
          _right)
          {
            _keys = #Array.prototype.concat(
              @#Array.of(),
              _keys,
              #Object.keys(_right));
            _right = #Reflect.getPrototypeOf(_right);
            completion void 0; }
        _index = 0;
        _length = #Reflect.get(_keys, "length");
        while (
          (_index < _length))
          c0: {
            $x = #Reflect.get(_keys, _index);
            {
              456;
              completion void 0; }
            _index = (_index + 1);
            completion void 0; }
        completion void 0; }
      completion void 0; }`);
  // ForOfStatement //
  success(
    Scope.RootScope(),
    [],
    {
      type: "ForOfStatement",
      await: true,
      left: {
        type: "VariableDeclaration",
        kind: "let",
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: "x"},
            init: null}]},
      right: {
        type: "Literal",
        value: 123},
      body: {
        type: "BlockStatement",
        body: []}},
    null,
    `{
      b0: {
        let _async_iterator, _iterator, _step;
        _iterator = (
          (
            _async_iterator = #Reflect.get(
              (
                (
                  (123 === null) ?
                  true :
                  (123 === void 0)) ?
                123 :
                #Object(123)),
              #Symbol.asyncIterator),
            (
              (
                (_async_iterator === null) ?
                true :
                (_async_iterator === void 0)) ?
              #Reflect.get(
                (
                  (
                    (123 === null) ?
                    true :
                    (123 === void 0)) ?
                  123 :
                  #Object(123)),
                #Symbol.iterator) :
              _async_iterator))
          (
            @123));
        _step = void 0;
        try {
          while (
            (
              _step = await #Reflect.get(_iterator, "next")(@_iterator),
              !#Reflect.get(_step, "done")))
            c0: {
              let $x;
              $x = #Reflect.get(_step, "value");
              {
                completion void 0; }
            completion void 0; }
          completion void 0; }
        catch {
          completion (
            _step = void 0,
            throw #Reflect.get(input, "error")); }
        finally {
          let _return;
          completion (
            _step ?
            (
              #Reflect.get(_step, "done") ?
              void 0:
              (
                _return = #Reflect.get(_iterator, "return"),
                (
                  (
                    (_return === null) ?
                    true :
                    (_return === void 0)) ?
                  void 0:
                  _return(@_iterator)))) :
            void 0); }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(
      {
        completion: Scope.TestBox("_completion")}),
    [],
    `for (let x of 123) { let x = 456; 789; }`,
    {
      completion: Completion.Full()},
    `{
      _completion = void 0;
      b0: {
        let _iterator, _step;
        _iterator = (
          #Reflect.get(
            (
              (
                (123 === null) ?
                true :
                (123 === void 0)) ?
              123 :
              #Object(123)),
            #Symbol.iterator)
          (
            @123));
        _step = void 0;
        try {
          while (
            (
              _step = #Reflect.get(_iterator, "next")(@_iterator),
              !#Reflect.get(_step, "done")))
            c0: {
              let $x;
              $x = #Reflect.get(_step, "value");
              {
                let $x;
                $x = 456;
                _completion = 789;
                completion void 0; }
            completion void 0; }
          completion void 0; }
        catch {
          completion (
            _step = void 0,
            throw #Reflect.get(input, "error")); }
        finally {
          let _return;
          completion (
            _step ?
            (
              #Reflect.get(_step, "done") ?
              void 0:
              (
                _return = #Reflect.get(_iterator, "return"),
                (
                  (
                    (_return === null) ?
                    true :
                    (_return === void 0)) ?
                  void 0:
                  _return(@_iterator)))) :
            void 0); }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope({strict:true}),
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    `for (var x of 123) { 456; }`,
    null,
    `{
      let $x;
      $x = void 0;
      b0: {
        let _iterator, _step;
        _iterator = (
          #Reflect.get(
            (
              (
                (123 === null) ?
                true :
                (123 === void 0)) ?
              123 :
              #Object(123)),
            #Symbol.iterator)
          (
            @123));
        _step = void 0;
        try {
          while (
            (
              _step = #Reflect.get(_iterator, "next")(@_iterator),
              !#Reflect.get(_step, "done")))
            c0: {
              $x = #Reflect.get(_step, "value");
              {
                456;
                completion void 0; }
              completion void 0; }
          completion void 0; }
        catch {
          completion (
            _step = void 0,
            throw #Reflect.get(input, "error")); }
        finally {
          let _return;
          completion (
            _step ?
            (
              #Reflect.get(_step, "done") ?
              void 0:
              (
                _return = #Reflect.get(_iterator, "return"),
                (
                  (
                    (_return === null) ?
                    true :
                    (_return === void 0)) ?
                  void 0:
                  _return(@_iterator)))) :
            void 0); }
        completion void 0; }
      completion void 0; }`);
  success(
    Scope.RootScope(),
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    `for (x of 123) 456;`,
    null,
    `{
      let $x;
      $x = void 0;
      b0: {
        let _iterator, _step;
        _iterator = (
          #Reflect.get(
            (
              (
                (123 === null) ?
                true :
                (123 === void 0)) ?
              123 :
              #Object(123)),
            #Symbol.iterator)
          (
            @123));
        _step = void 0;
        try {
          while (
            (
              _step = #Reflect.get(_iterator, "next")(@_iterator),
              !#Reflect.get(_step, "done")))
            c0: {
              $x = #Reflect.get(_step, "value");
              {
                456;
                completion void 0; }
              completion void 0; }
          completion void 0; }
        catch {
          completion (
            _step = void 0,
            throw #Reflect.get(input, "error")); }
        finally {
          let _return;
          completion (
            _step ?
            (
              #Reflect.get(_step, "done") ?
              void 0:
              (
                _return = #Reflect.get(_iterator, "return"),
                (
                  (
                    (_return === null) ?
                    true :
                    (_return === void 0)) ?
                  void 0:
                  _return(@_iterator)))) :
            void 0); }
        completion void 0; }
      completion void 0; }`);
  // SwitchStatement //
  success(
    Scope.RootScope(
      {
        completion:Scope.TestBox("_completion")}),
    [],
    `
      switch (!1) {}`,
    {
      completion: Completion.Full()},
    `{
      let _discriminant, _matched;
      _completion = void 0;
      _discriminant = !1;
      _matched = false;
      _switch_8: {
        completion "switch-completion"; }
      completion void 0; }`);
});

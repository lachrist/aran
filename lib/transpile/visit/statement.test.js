"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const ParseExternal = require("../../parse-external.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Completion = require("../completion.js");
const Query = require("../query");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit._test_init(
  [
    require("./other.js"),
    require("./pattern.js"),
    require("./closure.js"),
    require("./class.js"),
    require("./expression.js"),
    require("./hoisted-statement.js"),
    require("./statement.js"),
    {
      CLOSURE_BODY: (scope, node, context) => Visit.BLOCK(scope, node, context),
      BLOCK: (scope, node, context, _nodes) => (
        context = global.Object.assign(
          {
            completion: Completion._make_empty(),
            labels: [],
            with: null},
          context),
        _nodes = node.type === "BlockStatement" ? node.body : [node],
        Scope.BLOCK(
          scope,
          context.labels,
          ArrayLite.flatMap(_nodes, Query._get_shallow_hoisting),
          (scope) => Tree.Bundle(
            [
              (
                (
                  context.reset &&
                  Completion._is_last(context.completion)) ?
                Tree.Lift(
                  Scope.set_completion(
                    scope,
                    Tree.primitive(void 0))) :
                Tree.Bundle([])),
              Tree.Bundle(
                ArrayLite.map(
                  _nodes,
                  (node) => Visit.Statement(scope, node, {completion:context.completion})))]))),
      SWITCH: (scope, node, context) => (
        context = global.Object.assign(
          {
            completion: Completion._make_empty(),
            labels: [],
            matched: global.undefined,
            discriminant: global.undefined},
          context),
        Assert.deepEqual(node.cases, []),
        Scope.BLOCK(
          scope,
          context.labels,
          [],
          () => Tree.Bundle([])))}]);

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {

  const test = (scope, completion, variables, code1, context) => Scope.MODULE(
    scope,
    variables,
    (scope) => (
      (
        (closure) => (
          completion ?
          Scope.Box(
            scope,
            completion,
            "completion",
            Tree.primitive(void 0),
            (box) => closure(
              Scope._extend_completion(scope, box))) :
          closure(scope)))
      (
        (scope) => Visit.Statement(
          scope,
          (
            typeof code1 === "string" ?
            ParseExternal(code1, {source:Scope._is_strict(scope) ? "module" : "script"}).body[0] :
            code1),
          context))));

  const success = (scope, completion, variables, code1, context, code2) => Lang._match(
    test(scope, completion, variables, code1, context),
    Lang.PARSE_BLOCK(code2),
    Assert);

  const failure = (scope, completion, variables, code1, context, message) => Assert.throws(
    () => test(scope, completion, variables, code1, context),
    new global.Error(message));

  // EmptyStatement //
  success(
    Scope._make_root(),
    false,
    [],
    `;`,
    null,
    `{}`);
  // DebuggerStatement
  success(
    Scope._make_root(),
    false,
    [],
    `debugger;`,
    null,
    `{
      debugger;}`);
  // ExpressionStatement //
  success(
    Scope._make_root(),
    false,
    [],
    `123;`,
    {
      completion: Completion._make_full()},
    `{
      return 123; }`);
  success(
    Scope._make_root(),
    true,
    [
      {kind:"var", name:"x", ghost:false, exports:[]}],
    `x++;`,
    {
      completion: Completion._make_full()},
    `{
      let $x, _completion, _result;
      $x = void 0;
      _completion = void 0;
      _completion = (
        _result = $x,
        (
          $x = (
            _result +
            (
              (typeof _result === "bigint") ?
              1n :
              1)),
          _result)); }`);
  success(
    Scope._make_root(),
    false,
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
            1))); }`);
  // BreakStatement //
  success(
    Scope._make_root(),
    false,
    [],
    {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    null,
    `{
      break Bfoo; }`);
  success(
    Scope._make_root(),
    false,
    [],
    {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    {labels: ["foo"]},
    `{}`);
  success(
    Scope._make_root({loop:"foo"}),
    false,
    [],
    {
      type: "BreakStatement",
      label: null},
    null,
    `{ break bfoo; }`);
  // ContinueStatement //
  success(
    Scope._make_root(),
    false,
    [],
    {
      type: "ContinueStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    null,
    `{
      break Cfoo; }`);
  failure(
    Scope._make_root({loop:"foo"}),
    false,
    [],
    {
      type: "ContinueStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    {labels:["foo"]},
    "Break label used as continue label");
  success(
    Scope._make_root({loop:"foo"}),
    false,
    [],
    {
      type: "ContinueStatement",
      label: null},
    null,
    `{ break cfoo; }`);
  // ThrowStatement //
  success(
    Scope._make_root(),
    false,
    [],
    `throw 123;`,
    null,
    `{
      throw 123; }`);
  // ImportDeclaration //
  success(
    Scope._make_root({strict:true}),
    false,
    [],
    `import {imported as local} from "source";`,
    null,
    `{}`);
  // ExportAllDeclaration //
  success(
    Scope._make_root({strict:true}),
    false,
    [],
    `export * from "source"`,
    null,
    `{}`);
  // ExportDefaultDeclaration //
  success(
    Scope._make_root({strict:true}),
    false,
    [],
    `export default 123;`,
    null,
    `{
      export default 123; }`);
  success(
    Scope._make_root({strict:true}),
    false,
    [
      {kind:"function", name:"f", ghost:false, exports:["default"]}],
    `export default function f () {};`,
    null,
    `{
      let $f;
      ($f = void 0, export default $f); }`);
  success(
    Scope._make_root({strict:true}),
    false,
    [],
    `export default function () { 123 };`,
    null,
    `{
      let _prototype;
      export default (
        _prototype = {__proto__:#Object.prototype},
        ${Lang._generate(
          Visit.closure(
            Scope._make_root({strict:true}),
            ParseExternal(`(function () { 123 });`).body[0].expression,
            {
              prototype: Scope._test_box("_prototype"),
              name: Scope._primitive_box("default")}))}); }`);
  success(
    Scope._make_root({strict:true}),
    false,
    [
      {kind:"class", name:"c", ghost:false, exports:["default"]}],
    `export default class c {};`,
    null,
    `{
      let $c;
      (
        $c = ${Lang._generate(
          Visit.class(
            Scope._make_root({strict:true}),
            ParseExternal(`(class c {});`).body[0].expression,
            null))},
        export default $c); }`);
  success(
    Scope._make_root({strict:true}),
    false,
    [],
    `export default class {};`,
    null,
    `{
      let _prototype, _constructor, _super;
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
                          return (
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
            _constructor))); }`);
  // ExportNamedDeclaration (node.declaration !== null) //
  success(
    Scope._make_root({strict:true}),
    false,
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
        export y $y); }`);
  success(
    Scope._make_root({strict:true}),
    false,
    [
      {kind: "function", name: "f", ghost:false, exports:["f"]}],
    `export function f () {}`,
    null,
    `{
      let $f;
      (
        $f = void 0,
        export f $f); }`);
  success(
    Scope._make_root({strict:true}),
    false,
    [
      {kind:"class", name:"c", ghost:false, exports:["c"]}],
    `export class c {};`,
    null,
    `{
      let $c;
      (
        $c = ${Lang._generate(
          Visit.class(
            Scope._make_root({strict:true}),
            ParseExternal(`(class c {});`).body[0].expression,
            null))},
        export c $c); }`);
  // ExportNamedDeclaration //
  success(
    Scope._make_root({strict:true}),
    false,
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
        export bar $y); }`);
  success(
    Scope._make_root({strict:true}),
    false,
    [],
    `export {x as foo, y as bar} from "source"`,
    null,
    `{}`);
  // VariableDeclaration //
  success(
    Scope._make_root(),
    false,
    [
      {kind:"let", name:"x", ghost:false, exports:[]},
      {kind:"let", name:"y", ghost:false, exports:[]},
      {kind:"let", name:"z", ghost:false, exports:[]},
      {kind:"let", name:"t", ghost:false, exports:[]}],
    `let x = () => { 123; }, {y, z} = 456, t;`,
    null,
    `{
      let $x, $y, $z, $t, _right;
      $x = ${Lang._generate(
        Visit.closure(
          Scope._make_root({strict:true}),
          ParseExternal(`(() => { 123; });`).body[0].expression,
          {name: Scope._primitive_box("x")}))};
      _right = (
        (
          (456 === null) ?
          true :
          (456 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        #Object(456));
      void 0;
      $y = #Reflect.get(_right, "y");
      $z = #Reflect.get(_right, "z");
      $t = void 0; }`);
  // Return (arrow) //
  success(
    Scope._make_root({sort:"arrow"}),
    false,
    [],
    {
      type: "ReturnStatement",
      argument: null},
    null,
    `{
      return void 0; }`);
  success(
    Scope._make_root({
      sort: "arrow"}),
    false,
    [],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    null,
    `{
      return 123; }`);
  // Return (function) //
  success(
    Scope._make_root({sort:"function"}),
    false,
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
      return ($0newtarget ? $this : void 0); }`);
  success(
    Scope._make_root({sort:"function"}),
    false,
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
        123); }`);
  // Return (constructor) //
  success(
    Scope._make_root({sort:"constructor"}),
    false,
    [
      {kind:"var", name:"this", ghost:false, exports:[]}],
    {
      type: "ReturnStatement",
      argument: null},
    null,
    `{
      let $this;
      $this = void 0;
      return $this; }`);
  success(
    Scope._make_root({sort:"constructor"}),
    false,
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
        $this); }`);
  // Return (derived-constructor) //
  success(
    Scope._make_root(
      {
        sort: "derived-constructor"}),
    false,
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
        throw new #ReferenceError("Cannot read variable named 'this' before calling super constructor")); }`);
  success(
    Scope._make_root(
      {
        sort: "derived-constructor"}),
    false,
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
          throw new #TypeError("Derived constructors may only return an object or undefined"))); }`);
  // BlockStatement //
  success(
    Scope._make_root({strict:true}),
    true,
    [],
    `{
      123;
      456; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      {
        _completion = 123;
        _completion = 456; } }`);
  // LabeledStatement //
  success(
    Scope._make_root(),
    false,
    [],
    `foo : break foo;`,
    null,
    `{}`);
  success(
    Scope._make_root(),
    true,
    [],
    `foo : {
      123;
      break foo;
      456;}`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      $foo: {
        _completion = 123;
        break $foo;
        _completion = 456; } }`);
  success(
    Scope._make_root(),
    false,
    [],
    `foo : function f () {}`,
    null,
    `{}`);
  // IfStatement //
  success(
    Scope._make_root(),
    false,
    [],
    `if (123) { 456; } else { 789; }`,
    null,
    `{
      if (
        123)
      {
        456; }
      else {
        789; } }`);
  success(
    Scope._make_root(),
    true,
    [],
    `if (123) { 456; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      if (
        123)
      {
        _completion = 456; }
      else {} }`);
  // TryStatement //
  success(
    Scope._make_root(),
    true,
    [],
    `try { 123; } catch { 456; } finally { 789; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      try {
        _completion = 123; }
      catch {
        _completion = void 0;
        _completion = 456; }
      finally {
        789; } }`);
  success(
    Scope._make_root(),
    true,
    [],
    `foo: try { 123; } finally { 789; break foo; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      try Bfoo: {
        _completion = 123; }
      catch {
        throw #Reflect.get(input, "error"); }
      finally Bfoo: {
        789; // BLOCK harness is too dumb
        break Bfoo;} }`);
  success(
    Scope._make_root(),
    false,
    [],
    `try { 123; } catch (x) { 456; }`,
    null,
    `{
      try {
        123; }
      catch {
        let x;
        x = #Reflect.get(input, "error");
        { 456; }}
      finally {} }`);
  // WithStatement //
  success(
    Scope._make_root(),
    false,
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
          $y); } }`);
  success(
    Scope._make_root(),
    true,
    [],
    `with (123) 456;`,
    {
      completion: Completion._make_full()},
    `{
      let _completion, _frame;
      _completion = void 0;
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
        _completion = 456; } }`);
  // WhileStatement //
  success(
    Scope._make_root(),
    true,
    [],
    `while (123) { 456; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      b0: {
        while (
          123)
          c0: {
            _completion = 456; } } }`);
  success(
    Scope._make_root(),
    false,
    [],
    `while (123) 456;`,
    null,
    `{
      b0: {
        while (
          123)
        c0: {
          456;} } }`);
  // DoWhileStatement //
  success(
    Scope._make_root(),
    true,
    [],
    `do { 123; } while (456)`,
    {
      completion: Completion._make_full()},
    `{
      let _completion, _entrance;
      _completion = void 0;
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
            _completion = 123; } } }`);
  success(
    Scope._make_root(),
    false,
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
            123; } } }`);
  // ForStatement //
  success(
    Scope._make_root(),
    true,
    [],
    `for (let x = 123; 456; 789) { 0; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      b0: {
        let $x;
        $x = 123;
        while (
          456)
          {
            c0: {
              _completion = 0;}
            789; } } }`);
  success(
    Scope._make_root(),
    true,
    [],
    `for (;;) 123;`,
    null,
    `{
      let _completion;
      _completion = void 0;
      b0: {
        while (
          true)
          c0: {
            123; } } }`);
  success(
    Scope._make_root(),
    false,
    [],
    `for (123;;) 456;`,
    null,
    `{
      b0: {
        123;
        while (
          true)
          c0: {
            456; } } }`);
  success(
    Scope._make_root(),
    false,
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
            456; } } }`);
  // ForInStatement //
  success(
    Scope._make_root(),
    true,
    [],
    `for (let x in 123) { let x = 456; 789; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
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
          _right = #Reflect.getPrototypeOf(_right);}
        _index = 0;
        _length = #Reflect.get(_keys, "length");
        while (
          (_index < _length))
          {
            let $x;
            $x = #Reflect.get(_keys, _index);
            c0: {
              let $x;
              $x = 456;
              _completion = 789; }
            _index = (_index + 1); } } }`);
  success(
    Scope._make_root(),
    false,
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
          _right = #Reflect.getPrototypeOf(_right);}
        _index = 0;
        _length = #Reflect.get(_keys, "length");
        while (
          (_index < _length))
          {
            $x = #Reflect.get(_keys, _index);
            c0: {
              456; }
            _index = (_index + 1); } } }`);
  success(
    Scope._make_root(),
    false,
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
          _right = #Reflect.getPrototypeOf(_right);}
        _index = 0;
        _length = #Reflect.get(_keys, "length");
        while (
          (_index < _length))
          {
            $x = #Reflect.get(_keys, _index);
            c0: {
              456; }
            _index = (_index + 1); } } }`);
  // ForOfStatement //
  success(
    Scope._make_root(),
    false,
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
            {
              let $x;
              $x = #Reflect.get(_step, "value");
              c0: {} } }
        catch {
          _step = void 0;
          throw #Reflect.get(input, "error"); }
        finally {
          let _return;
          (
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
            void 0); } } }`);
  success(
    Scope._make_root(),
    true,
    [],
    `for (let x of 123) { let x = 456; 789; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
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
            {
              let $x;
              $x = #Reflect.get(_step, "value");
              c0: {
                let $x;
                $x = 456;
                _completion = 789; } } }
        catch {
          _step = void 0;
          throw #Reflect.get(input, "error"); }
        finally {
          let _return;
          (
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
            void 0); } } }`);
  success(
    Scope._make_root({strict:true}),
    false,
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
            {
              $x = #Reflect.get(_step, "value");
              c0: {
                456; } } }
        catch {
          _step = void 0;
          throw #Reflect.get(input, "error"); }
        finally {
          let _return;
          (
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
            void 0); } } }`);
  success(
    Scope._make_root(),
    false,
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
            {
              $x = #Reflect.get(_step, "value");
              c0: {
                456; } } }
        catch {
          _step = void 0;
          throw #Reflect.get(input, "error"); }
        finally {
          let _return;
          (
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
            void 0); } } }`);
  // SwitchStatement //
  success(
    Scope._make_root(),
    true,
    [],
    `
      switch (!1) {}`,
    {
      completion: Completion._make_full()},
    `{
      let _completion, _discriminant, _matched;
      _completion = void 0;
      _completion = void 0;
      _discriminant = !1;
      _matched = false;
      _switch_8: { } }`);
});

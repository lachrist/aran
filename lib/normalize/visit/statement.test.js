"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Parse = require("../../parse.js");
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
            with: null},
          context),
        _nodes = node.type === "BlockStatement" ? node.body : [node],
        Scope.BLOCK(
          scope,
          context.with,
          Query._get_block_hoisting(_nodes),
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
        Assert.deepEqual(node.cases, []),
        Scope.BLOCK(
          scope,
          null,
          [],
          () => Tree.Bundle([])))}]);

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {

  const test = (scope, completion, variables, code1, context) => Scope.MODULE(
    scope,
    completion,
    variables,
    (scope) => Visit.Statement(
      scope,
      (
        typeof code1 === "string" ?
        Parse[Scope._is_strict(scope) ? "module" : "script"](code1).body[0] :
        code1),
      context));

  const success = (scope, completion, variables, code1, context, code2) => Lang._match_block(
    test(scope, completion, variables, code1, context),
    Lang.PARSE_BLOCK(code2),
    Assert);

  const failure = (scope, completion, variables, code1, context, message) => Assert.throws(
    () => test(scope, completion, variables, code1, context),
    new global.Error(message));

  // EmptyStatement //
  success(
    Scope._make_test_root(),
    false,
    [],
    `;`,
    null,
    `{}`);
  // DebuggerStatement
  success(
    Scope._make_test_root(),
    false,
    [],
    `debugger;`,
    null,
    `{
      debugger;}`);
  // ExpressionStatement //
  success(
    Scope._make_test_root(),
    true,
    [
      {kind:"var", name:"x"}],
    `x++;`,
    {
      completion: Completion._make_full()},
    `{
      let $x, _completion, _result;
      _completion = void 0;
      $x = void 0;
      _completion = (
        _result = $x,
        (
          $x = (_result + 1),
          _result)); }`);
  success(
    Scope._make_test_root(),
    false,
    [
      {kind:"var", name:"x"}],
    `x++;`,
    null,
    `{
      let $x;
      $x = void 0;
      $x = ($x + 1); }`);
  // BreakStatement //
  success(
    Scope._make_test_root(),
    false,
    [],
    {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    null,
    `{
      break $foo; }`);
  success(
    Scope._make_test_root(),
    false,
    [],
    {
      type: "BreakStatement",
      label: null},
    {
      labels: [null]},
    `{}`);
  // ContinueStatement //
  success(
    Scope._make_test_root(),
    false,
    [],
    {
      type: "ContinueStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    null,
    `{
      continue $foo; }`);
  failure(
    Scope._make_test_root(),
    false,
    [],
    {
      type: "ContinueStatement",
      label: null},
    {
      labels: [null]},
    "Break label used as continue label");
  // ThrowStatement //
  success(
    Scope._make_test_root(),
    false,
    [],
    `throw 123;`,
    null,
    `{
      throw 123; }`);
  // ExportAllDeclaration //
  success(
    Scope._make_test_root({strict:true}),
    false,
    [],
    `export * from "source"`,
    null,
    `{
      export * from "source"; }`);
  // ExportDefaultDeclaration //
  success(
    Scope._make_test_root({strict:true}),
    false,
    [],
    `export default 123;`,
    null,
    `{
      export default 123; }`);
  success(
    Scope._make_test_root({strict:true}),
    false,
    [
      {kind:"function", name:"f"}],
    `export default function f () {};`,
    null,
    `{
      let $f;
      $f = void 0;
      export default $f; }`);
  success(
    Scope._make_test_root({strict:true}),
    false,
    [],
    `export default function () { 123 };`,
    null,
    `{
      let _prototype;
      export default (
        _prototype = {__proto__:#Object.prototype},
        ${Lang._generate_expression(
          Visit.closure(
            Scope._make_test_root({strict:true}),
            Parse.script(`(function () { 123 });`).body[0].expression,
            {
              prototype: Scope._test_box("_prototype"),
              name: Scope._primitive_box("default")}))}); }`);
  success(
    Scope._make_test_root({strict:true}),
    false,
    [
      {kind:"class", name:"c"}],
    `export default class c {};`,
    null,
    `{
      let $c;
      $c = ${Lang._generate_expression(
        Visit.class(
          Scope._make_test_root({strict:true}),
          Parse.script(`(class c {});`).body[0].expression,
          null))};
      export default $c; }`);
  success(
    Scope._make_test_root({strict:true}),
    false,
    [],
    `export default class {};`,
    null,
    `{
      let _prototype, _constructor;
      export default (
        _prototype = {__proto__:#Object.prototype},
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
                          new.target ?
                          {
                            __proto__: #Reflect.get(new.target, "prototype")} :
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
          _constructor)); }`);
  // ExportNamedDeclaration (node.declaration !== null) //
  success(
    Scope._make_test_root({strict:true}),
    false,
    [
      {kind: "let", name: "x"},
      {kind: "let", name: "y"}],
    `export let x = 123, y = 456;`,
    null,
    `{
      let $x, $y;
      $x = 123;
      $y = 456;
      export x $x;
      export y $y; }`);
  success(
    Scope._make_test_root({strict:true}),
    false,
    [
      {kind: "function", name: "f"}],
    `export function f () {}`,
    null,
    `{
      let $f;
      $f = void 0;
      export f $f; }`);
  success(
    Scope._make_test_root({strict:true}),
    false,
    [
      {kind:"class", name:"c"}],
    `export class c {};`,
    null,
    `{
      let $c;
      $c = ${Lang._generate_expression(
        Visit.class(
          Scope._make_test_root({strict:true}),
          Parse.script(`(class c {});`).body[0].expression,
          null))};
      export c $c; }`);
  // ExportNamedDeclaration //
  success(
    Scope._make_test_root({strict:true}),
    false,
    [
      {kind: "var", name: "x"},
      {kind: "var", name: "y"}],
    {
      type: "ExportNamedDeclaration",
      declaration: null,
      source: null,
      specifiers: [
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
      $x = void 0;
      $y = void 0;
      export foo $x;
      export bar $y; }`);
  success(
    Scope._make_test_root({strict:true}),
    false,
    [
      {kind: "import", name: "x"},
      {kind: "import", name: "y"}],
    `export {x as foo, y as bar} from "source"`,
    null,
    `{
      let _m, $x, $y;
      import * as _m from "source";
      export foo #Reflect.get(_m, "x");
      export bar #Reflect.get(_m, "y"); }`);
  // VariableDeclaration //
  success(
    Scope._make_test_root(),
    false,
    [
      {kind:"let", name:"x"},
      {kind:"let", name:"y"},
      {kind:"let", name:"z"},
      {kind:"let", name:"t"}],
    `let x = () => { 123; }, {y, z} = 456, t;`,
    null,
    `{
      let $x, $y, $z, $t;
      $x = ${Lang._generate_expression(
        Visit.closure(
          Scope._make_test_root({strict:true}),
          Parse.script(`(() => { 123; });`).body[0].expression,
          {name: Scope._primitive_box("x")}))};
      (
        (
          (456 === null) ?
          true :
          (456 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        (
          (
            void 0,
            $y = #Reflect.get(
              #Object(456),
              "y")),
          $z = #Reflect.get(
            #Object(456),
            "z")));
      $t = void 0; }`);
  // Return (arrow) //
  success(
    Scope._make_test_root({sort:"arrow"}),
    false,
    [],
    {
      type: "ReturnStatement",
      argument: null},
    null,
    `{
      return void 0; }`);
  success(
    Scope._make_test_root({
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
    Scope._make_test_root({sort:"function"}),
    false,
    [
      {kind:"var", name:"this"},
      {kind:"var", name:"new.target"}],
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
    Scope._make_test_root({sort:"function"}),
    false,
    [
      {kind:"var", name:"this"},
      {kind:"var", name:"new.target"}],
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
    Scope._make_test_root({sort:"constructor"}),
    false,
    [
      {kind:"var", name:"this"}],
    {
      type: "ReturnStatement",
      argument: null},
    null,
    `{
      let $this;
      $this = void 0;
      return $this; }`);
  success(
    Scope._make_test_root({sort:"constructor"}),
    false,
    [
      {kind:"var", name:"this"}],
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
    Scope._make_test_root(
      {
        sort: "constructor",
        super: Scope._primitive_box(123)}),
    false,
    [
      {kind:"var", name:"this"}],
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
        throw new #ReferenceError("Super constructor must be called before returning from closure")); }`);
  success(
    Scope._make_test_root(
      {
        sort: "constructor",
        super: Scope._primitive_box(123)}),
    false,
    [
      {kind:"var", name:"this"}],
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
            throw new #ReferenceError("Super constructor must be called before returning from closure")) :
          throw new #TypeError("Derived constructors may only return an object or undefined"))); }`);
  // BlockStatement //
  success(
    Scope._make_test_root({strict:true}),
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
    Scope._make_test_root(),
    false,
    [],
    `foo : break foo;`,
    null,
    `{}`);
  success(
    Scope._make_test_root(),
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
    Scope._make_test_root(),
    false,
    [],
    `foo : function f () {}`,
    null,
    `{}`);
  // IfStatement //
  success(
    Scope._make_test_root(),
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
    Scope._make_test_root(),
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
    Scope._make_test_root(),
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
    Scope._make_test_root(),
    true,
    [],
    `foo: try { 123; } finally { 789; break foo; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      $foo: try {
        _completion = 123; }
      catch {
        throw error; }
      finally {
        789; // BLOCK harness is too dumb
        break $foo;} }`);
  success(
    Scope._make_test_root(),
    false,
    [],
    `try { 123; } catch (x) { 456; }`,
    null,
    `{
      try {
        123; }
      catch {
        let x;
        x = error;
        { 456; }}
      finally {} }`);
  // WithStatement //
  success(
    Scope._make_test_root(),
    false,
    [
      {kind:"var", name:"y"}],
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
    Scope._make_test_root(),
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
    Scope._make_test_root(),
    true,
    [],
    `while (123) { 456; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      $: while (
        123)
      {
        _completion = 456; } }`);
  success(
    Scope._make_test_root(),
    false,
    [],
    `while (123) 456;`,
    null,
    `{
      $: while (
        123)
      {
        456;} }`);
  // DoWhileStatement //
  success(
    Scope._make_test_root(),
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
      $: while (
        (
          _entrance ?
          (
            _entrance = false,
            true) :
          456))
      {
        _completion = 123; } }`);
  success(
    Scope._make_test_root(),
    false,
    [],
    `do 123; while (456)`,
    null,
    `{
      let _entrance;
      _entrance = true;
      $: while (
        (
          _entrance ?
          (
            _entrance = false,
            true) :
          456))
      {
        123; } }`);
  // ForStatement //
  success(
    Scope._make_test_root(),
    true,
    [],
    `for (let x = 123; 456; 789) { 0; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      {
        let $x;
        $x = 123;
        $: while (
          456)
        {
          {
            _completion = 0;}
          789; } } }`);
  success(
    Scope._make_test_root(),
    true,
    [],
    `for (;;) 123;`,
    null,
    `{
      let _completion;
      _completion = void 0;
      $: while (
        true)
      {
        123; } }`);
  success(
    Scope._make_test_root(),
    false,
    [],
    `for (123;;) 456;`,
    null,
    `{
      123;
      $: while (
        true)
      {
        456; } }`);
  success(
    Scope._make_test_root(),
    false,
    [
      {kind:"var", name:"x"}],
    `for (var x = 123;;) 456;`,
    null,
    `{
      let $x;
      $x = void 0;
      $x = 123;
      $: while (
        true)
      {
        456; } }`);
  // ForInStatement //
  success(
    Scope._make_test_root(),
    true,
    [],
    `for (let x in 123) { let x = 456; 789; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      {
        let $x, _right, _keys, _index, _length;
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
        $: while (
          (_index < _length))
        {
          let $x;
          $x = #Reflect.get(_keys, _index);
          {
            let $x;
            $x = 456;
            _completion = 789; }
          _index = (_index + 1); } } }`);
  success(
    Scope._make_test_root(),
    false,
    [
      {kind:"var", name:"x"}],
    `for (var x in 123) { 456; }`,
    null,
    `{
      let $x, _right, _keys, _index, _length;
      $x = void 0;
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
      $: while (
        (_index < _length))
      {
        $x = #Reflect.get(_keys, _index);
        {
          456; }
        _index = (_index + 1); } }`);
  success(
    Scope._make_test_root(),
    false,
    [
      {kind:"var", name:"x"}],
    `for (x in 123) { 456; }`,
    null,
    `{
      let $x, _right, _keys, _index, _length;
      $x = void 0;
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
      $: while (
        (_index < _length))
      {
        $x = #Reflect.get(_keys, _index);
        {
          456; }
        _index = (_index + 1); } }`);
  // ForOfStatement //
  failure(
    Scope._make_test_root(),
    false,
    [],
    {
      type: "ForOfStatement",
      await: true,
      left: {
        type: "Identifier",
        name: "foo"},
      right: {
        type: "Literal",
        value: 123},
      body: {
        type: "BlockStatement",
        body: []}},
    null,
    "await for-of statement should never be reached");
  success(
    Scope._make_test_root(),
    true,
    [],
    `for (let x of 123) { let x = 456; 789; }`,
    {
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      {
        let $x, _iterator, _step;
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
        $: while (
          (
            _step = #Reflect.get(_iterator, "next")(@_iterator),
            !#Reflect.get(_step, "done")))
          {
            let $x;
            $x = #Reflect.get(_step, "value");
            {
              let $x;
              $x = 456;
              _completion = 789;} } } }`);
  success(
    Scope._make_test_root({strict:true}),
    false,
    [
      {kind:"var", name:"x"}],
    `for (var x of 123) { 456; }`,
    null,
    `{
      let $x, _iterator, _step;
      $x = void 0;
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
      $: while (
        (
          _step = #Reflect.get(_iterator, "next")(@_iterator),
          !#Reflect.get(_step, "done")))
        {
          $x = #Reflect.get(_step, "value");
          {
            456;} } }`);
  success(
    Scope._make_test_root(),
    false,
    [
      {kind:"var", name:"x"}],
    `for (x of 123) 456;`,
    null,
    `{
      let $x, _iterator, _step;
      $x = void 0;
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
      $: while (
        (
          _step = #Reflect.get(_iterator, "next")(@_iterator),
          !#Reflect.get(_step, "done")))
        {
          $x = #Reflect.get(_step, "value");
          {
            456;} } }`);
  // SwitchStatement //
  success(
    Scope._make_test_root(),
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
      $: { } }`);
});

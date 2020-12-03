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

  const test = (strict, completion, variables, code1, context) => Scope.MODULE(
    (
      strict ?
      Scope._use_strict(
        Scope._make_root()) :
      Scope._make_root()),
    completion,
    variables,
    (scope) => Visit.Statement(
      scope,
      (
        typeof code1 === "string" ?
        Parse[strict ? "module" : "script"](code1).body[0] :
        code1),
      context));

  const success = (strict, completion, variables, code1, context, code2) => Lang._match_block(
    test(strict, completion, variables, code1, context),
    Lang.PARSE_BLOCK(code2),
    Assert);

  const failure = (strict, completion, variables, code1, context, message) => Assert.throws(
    () => test(strict, completion, variables, code1, context),
    new global.Error(message));

  // EmptyStatement //
  success(
    false,
    false,
    [],
    `;`,
    null,
    `{}`);
  // DebuggerStatement
  success(
    false,
    false,
    [],
    `debugger;`,
    null,
    `{
      debugger;}`);
  // ExpressionStatement //
  success(
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
    false,
    [],
    `throw 123;`,
    null,
    `{
      throw 123; }`);
  // ExportAllDeclaration //
  success(
    true,
    false,
    [],
    `export * from "source"`,
    null,
    `{
      export * from "source"; }`);
  // ExportDefaultDeclaration //
  success(
    true,
    false,
    [],
    `export default 123;`,
    null,
    `{
      export default 123; }`);
  success(
    true,
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
    true,
    false,
    [],
    `export default function () { 123 };`,
    null,
    `{
      let _constructor;
      export default (
        _constructor = #Object.defineProperty(
          #Object.defineProperty(
            function () {
              let $0newtarget, $this, $arguments;
              $arguments = void 0;
              $0newtarget = new.target;
              $this = (
                new.target ?
                {__proto__:#Reflect.get(new.target, "prototype")} :
                this);
              $arguments = #Object.assign(
                #Object.defineProperty(
                  #Object.defineProperty(
                    #Object.defineProperty(
                      {__proto__:#Object.prototype},
                      "length",
                      {
                        __proto__: null,
                        value: #Reflect.get(arguments, "length"),
                        writable: true,
                        enumerable: false,
                        configurable: true}),
                    "callee",
                    {
                      __proto__: null,
                      get: #Function.prototype.arguments.__get__,
                      set: #Function.prototype.arguments.__set__,
                      enumerable: false,
                      configurable: false}),
                  #Symbol.iterator,
                  {
                    __proto__: null,
                    value: #Array.prototype.values,
                    writable: true,
                    enumerable: false,
                    configurable: true}),
                arguments);
              { 123; }
              return ($0newtarget ? $this : void 0); },
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
        #Object.defineProperty(
          _constructor,
          "prototype",
          {
            __proto__: null,
            value: #Object.defineProperty(
              {__proto__:#Object.prototype},
              "constructor",
              {
                __proto__: null,
                value: _constructor,
                writable: true,
                enumerable: false,
                configurable: true}),
            writable: true,
            enumerable: false,
            configurable: false})); }`);
  // VariableDeclaration //
  success(
    false,
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
      $x = #Object.defineProperty(
        #Object.defineProperty(
          () => {
            { 123; }
            return void 0; },
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
          value: "x",
          writable: false,
          enumerable: false,
          configurable: true});
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
    false,
    false,
    [],
    `(() => { return; return 123; });`,
    null,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            {
              return void 0;
              return 123; }
            return void 0; },
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
          value: "",
          writable: false,
          enumerable: false,
          configurable: true}); }`);
  // FunctionDeclaration && Return (function) //
  success(
    true,
    false,
    [],
    `(function () { return; return 123; });`,
    null,
    `{
      let _constructor;
      (
        _constructor = #Object.defineProperty(
          #Object.defineProperty(
            function () {
              let $0newtarget, $this, $arguments;
              $arguments = void 0;
              $0newtarget = new.target;
              $this = (
                new.target ?
                {__proto__:#Reflect.get(new.target, "prototype")} :
                this);
              $arguments = #Object.assign(
                #Object.defineProperty(
                  #Object.defineProperty(
                    #Object.defineProperty(
                      {__proto__:#Object.prototype},
                      "length",
                      {
                        __proto__: null,
                        value: #Reflect.get(arguments, "length"),
                        writable: true,
                        enumerable: false,
                        configurable: true}),
                    "callee",
                    {
                      __proto__: null,
                      get: #Function.prototype.arguments.__get__,
                      set: #Function.prototype.arguments.__set__,
                      enumerable: false,
                      configurable: false}),
                  #Symbol.iterator,
                  {
                    __proto__: null,
                    value: #Array.prototype.values,
                    writable: true,
                    enumerable: false,
                    configurable: true}),
                arguments);
              {
                return ($0newtarget ? $this : void 0);
                return (
                  $0newtarget ?
                  (
                    (
                      (typeof 123 === "object") ?
                      123 :
                      (typeof 123 === "function")) ?
                    123 :
                    $this) :
                  123); }
              return ($0newtarget ? $this : void 0); },
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
            value: "",
            writable: false,
            enumerable: false,
            configurable: true}),
        #Object.defineProperty(
          _constructor,
          "prototype",
          {
            __proto__: null,
            value: #Object.defineProperty(
              {__proto__:#Object.prototype},
              "constructor",
              {
                __proto__: null,
                value: _constructor,
                writable: true,
                enumerable: false,
                configurable: true}),
            writable: true,
            enumerable: false,
            configurable: false})); }`);
  // ClassDeclaration && Return (constructor) //
  success(
    false,
    false,
    [
      {kind:"class", name:"c"}],
    `class c { constructor () { return; return 123; } }`,
    null,
    `{
      let $c;
      $c = (
        (
          () => {
            let $c, _constructor, _prototype;
            return (
              $c = (
                _prototype = {__proto__:#Object.prototype},
                (
                  _constructor = #Object.defineProperty(
                    #Object.defineProperty(
                      constructor () {
                        let $0newtarget, $this, $arguments;
                        $arguments = void 0;
                        $0newtarget = (
                          new.target ?
                          new.target :
                          throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                        $this = {__proto__: #Reflect.get(new.target, "prototype")};
                        $arguments = #Object.assign(
                          #Object.defineProperty(
                            #Object.defineProperty(
                              #Object.defineProperty(
                                {__proto__:#Object.prototype},
                                "length",
                                {
                                  __proto__: null,
                                  value: #Reflect.get(arguments, "length"),
                                  writable: true,
                                  enumerable: false,
                                  configurable: true}),
                              "callee",
                              {
                                __proto__: null,
                                get: #Function.prototype.arguments.__get__,
                                set: #Function.prototype.arguments.__set__,
                                enumerable: false,
                                configurable: false}),
                            #Symbol.iterator,
                            {
                              __proto__: null,
                              value: #Array.prototype.values,
                              writable: true,
                              enumerable: false,
                              configurable: true}),
                          arguments);
                        {
                          return $this;
                          return (
                            (
                              (typeof 123 === "object") ?
                              123 :
                              (typeof 123 === "function")) ?
                            123 :
                            $this); }
                        return $this; },
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
                      value: "c",
                      writable: false,
                      enumerable: false,
                      configurable: true}),
                  (
                    (
                      #Reflect.defineProperty(
                        _prototype,
                        "constructor",
                        {
                          __proto__: null,
                          value: _constructor,
                          writable: true,
                          enumerable: false,
                          configurable: true}),
                      #Reflect.defineProperty(
                        _constructor,
                        "prototype",
                        {
                          __proto__: null,
                          value: _prototype,
                          writable: false,
                          enumerable: false,
                          configurable: false})),
                    _constructor))),
              $c); })
        ()); }`);
  // ClassDeclaration && Return (constructor) //
  success(
    false,
    false,
    [
      {kind:"class", name:"c"}],
    `class c extends 123 { constructor () { return; return 456; } }`,
    null,
    `{
      let $c;
      $c = (
        (
          (123 === null) ?
          void 0 :
          #Reflect.construct(
            #Object,
            {
              __proto__: null,
              length: 0},
            123)),
        (
          (
            () => {
              let $c, _constructor, _prototype;
              return (
                $c = (
                  _prototype = {
                    __proto__: #Reflect.get(123, "prototype")},
                  (
                    _constructor = #Object.defineProperty(
                      #Object.defineProperty(
                        constructor () {
                          let $0newtarget, $this, $arguments;
                          $arguments = void 0;
                          $0newtarget = (
                            new.target ?
                            new.target :
                            throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                          $this = null;
                          $arguments = #Object.assign(
                            #Object.defineProperty(
                              #Object.defineProperty(
                                #Object.defineProperty(
                                  {__proto__:#Object.prototype},
                                  "length",
                                  {
                                    __proto__: null,
                                    value: #Reflect.get(arguments, "length"),
                                    writable: true,
                                    enumerable: false,
                                    configurable: true}),
                                "callee",
                                {
                                  __proto__: null,
                                  get: #Function.prototype.arguments.__get__,
                                  set: #Function.prototype.arguments.__set__,
                                  enumerable: false,
                                  configurable: false}),
                              #Symbol.iterator,
                              {
                                __proto__: null,
                                value: #Array.prototype.values,
                                writable: true,
                                enumerable: false,
                                configurable: true}),
                            arguments);
                          {
                            return (
                              $this ?
                              $this :
                              throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"));
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
                                  throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
                                throw new #TypeError("Derived constructors may only return object or undefined"))); }
                          return (
                            $this ?
                            $this :
                            throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")); },
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
                        value: "c",
                        writable: false,
                        enumerable: false,
                        configurable: true}),
                    (
                      (
                        #Reflect.defineProperty(
                          _prototype,
                          "constructor",
                          {
                            __proto__: null,
                            value: _constructor,
                            writable: true,
                            enumerable: false,
                            configurable: true}),
                        #Reflect.defineProperty(
                          _constructor,
                          "prototype",
                          {
                            __proto__: null,
                            value: _prototype,
                            writable: false,
                            enumerable: false,
                            configurable: false})),
                      _constructor))),
                $c); })
          ())); }`);
  // BlockStatement //
  success(
    true,
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
    false,
    false,
    [],
    `foo : break foo;`,
    null,
    `{}`);
  success(
    false,
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
    false,
    false,
    [],
    `foo : function f () {}`,
    null,
    `{}`);
  // IfStatement //
  success(
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    false,
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
    true,
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
    false,
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
    true,
    true,
    [
      {kind:"function", name: "f"}],
    `
      switch (!1) {}`,
    {
      completion: Completion._make_full()},
    `{
      let $f, _completion, _discriminant, _matched;
      _completion = void 0;
      $f = void 0;
      _completion = void 0;
      _discriminant = !1;
      _matched = false;
      $: { } }`);
});

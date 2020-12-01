"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const ScopeMeta = require("../scope/layer-3-meta.js");
const Completion = require("../completion.js");
const Statement = require("./statement.js");
const ArrayLite = require("array-lite");

require("./common")._resolve_circular_dependencies(
  require("./expression.js"),
  require("./statement.js"));

const parse = (code) => (
  typeof code === "string" ?
  Acorn.parse(
    code,
    {
      __proto__: null,
      ecmaVersion: 2020}) :
  code);

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {

  const test = (strict, completion, variables, code1, context) => Scope.MODULE(
    completion,
    variables,
    (scope) => Statement.Visit(
      (
        strict ?
        Scope._use_strict(scope) :
        scope),
      (
        typeof code1 === "string" ?
        parse(code1).body[0] :
        code1),
      context));

  const success = (strict, completion, variables, code1, context, code2) => Lang._match_block(
    test(strict, completion, variables, code1, context),
    Lang.PARSE_BLOCK(code2),
    Assert);

  const failure = (strict, completion, variables, code1, context, message) => Assert.throws(
    () => test(strict, completion, variables, code1, context),
    new global.Error(message));

  // const test = (identifiers, closure) => Scope.EXTEND_STATIC(
  //   Scope._make_global(),
  //   ArrayLite.reduce(
  //     global.Reflect.ownKeys(identifiers),
  //     (hoisting, identifier) => (
  //       hoisting[identifier] = true,
  //       hoisting),
  //     {__proto__:null}),
  //   (scope) => Tree.Bundle(
  //     [
  //       Tree.Bundle(
  //         ArrayLite.map(
  //           ArrayLite.filter(
  //             global.Reflect.ownKeys(identifiers),
  //             (identifier) => identifiers[identifier]),
  //           (identifier) => Tree.Lift(
  //             Scope.initialize(
  //               scope,
  //               identifier,
  //               Tree.primitive(null))))),
  //       closure(scope)]));
  //
  // const success = (identifiers1, closure, identifiers2, code2) => Lang._match_block(
  //   test(identifiers1, closure),
  //   Lang.PARSE_BLOCK(`{
  //     ${(
  //       (global.Reflect.ownKeys(identifiers2).length > 0) ?
  //       `let ${ArrayLite.join(global.Reflect.ownKeys(identifiers2), ", ")};` :
  //       ``)}
  //     ${ArrayLite.join(
  //       ArrayLite.map(
  //         ArrayLite.filter(
  //           global.Reflect.ownKeys(identifiers2),
  //           (identifier) => identifiers2[identifier]),
  //         (identifier) => `${identifier} = null;`),
  //       "\n")}
  //     ${code2}}`),
  //   Assert);
  //
  // const failure = (identifiers, closure, message) => Assert.throws(
  //   () => test(identifiers, closure),
  //   new Error(message));
  //
  // const extend_strict = (scope, strict) => (
  //   strict ?
  //   Scope._extend_use_strict(scope) :
  //   scope);
  //
  // const extend_super = (scope, value) => (
  //   value !== void 0 ?
  //   Scope._extend_binding_super(scope, value) :
  //   scope);
  //
  // const extend_tag = (scope, value) => (
  //   value !== void 0 ?
  //   Scope._extend_binding_tag(scope, value) :
  //   scope);
  //
  // const helper = (code, options) => (
  //   options = Object.assign(
  //     {
  //       last: false,
  //       strict: false,
  //       labels: [],
  //       completion: Completion._make_empty(),
  //       tag: void 0,
  //       super: void 0},
  //     options),
  //   (scope) => (
  //     options.last ?
  //     Scope.Box(
  //       scope,
  //       "completion",
  //       true,
  //       Tree.primitive(void 0),
  //       (box) => Statement.Visit(
  //         Scope._extend_binding_last(
  //           extend_super(
  //             extend_tag(
  //               extend_strict(scope, options.strict),
  //               options.tag),
  //             options.super),
  //           box),
  //         parse(code),
  //         {
  //           __proto__: Statement._default_context,
  //           labels: options.labels,
  //           completion: options.completion},
  //         options.context)) :
  //     Statement.Visit(
  //       extend_super(
  //         extend_tag(
  //           extend_strict(scope, options.strict),
  //           options.tag),
  //         options.super),
  //       parse(code),
  //       {
  //         __proto__: Statement._default_context,
  //         labels: options.labels,
  //         completion: options.completion})));

  // const helper = (code, context) => (scope) => Statement.Visit(
  //   scope,
  //   (
  //     typeof code === "string" ?
  //     parse(code).body[0] :
  //     code),
  //   context || Statement._default_context);

  // EmptyStatement //
  success(
    false,
    false,
    [],
    `;`,
    Statement._default_context,
    `{}`);
  // DebuggerStatement
  success(
    false,
    false,
    [],
    `debugger;`,
    Statement._default_context,
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
      __proto__: Statement._default_context,
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
    Statement._default_context,
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
    Statement._default_context,
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
      __proto__: Statement._default_context,
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
    Statement._default_context,
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
      __proto__: Statement._default_context,
      labels: [null]},
    "Break label used as continue label");
  // ThrowStatement //
  success(
    false,
    false,
    [],
    `throw 123;`,
    Statement._default_context,
    `{
      throw 123; }`);
  // ReturnStatement >> Completion._program //
  // failure(
  //   false,
  //   false,
  //   [],
  //   {
  //     type: "ReturnStatement",
  //     argument: null},
  //   Statement._default_context,
  //   "Unexpected empty closure tag");
  // // ReturnStatement >> Completion._arrow && Completion._method //
  // success(
  //   {},
  //   helper(
  //     {
  //       type: "ReturnStatement",
  //       argument: null},
  //     {
  //       tag: "method"}),
  //   {},
  //   `return void 0;`);
  // success(
  //   {},
  //   (scope) => Statement.Visit(
  //     Scope._extend_binding_tag(scope, "method"),
  //     {
  //       type: "ReturnStatement",
  //       argument: {
  //         type: "Literal",
  //         value: 123}},
  //     Statement._default_context),
  //   {},
  //   `return 123;`);
  // // ReturnStatement >> Completion._function
  // success(
  //   {"new.target":true, "this":true},
  //   helper(
  //     {
  //       type: "ReturnStatement",
  //       argument: null},
  //     {
  //       tag: "function"}),
  //   {"$newtarget":true, "$this":true},
  //   `return ($newtarget ? $this : void 0);`);
  // success(
  //   {"new.target":true, "this":true},
  //   helper(
  //     {
  //       type: "ReturnStatement",
  //       argument: {
  //         type: "Literal",
  //         value: 123}},
  //     {
  //       tag: "function"}),
  //   {"$newtarget":true, "$this":true},
  //   `return (
  //     $newtarget ?
  //     (
  //       (
  //         (typeof 123 === "object") ?
  //         123 :
  //         (typeof 123 === "function")) ?
  //       123 :
  //       $this) :
  //     123);`);
  // // ReturnStatement >> Completion._constructor
  // success(
  //   {"this":true},
  //   helper(
  //     {
  //       type: "ReturnStatement",
  //       argument: null},
  //     {
  //       tag: "constructor",
  //       super: null}),
  //   {"$this":true},
  //   `return $this;`);
  // success(
  //   {"this":true},
  //   helper(
  //     {
  //       type: "ReturnStatement",
  //       argument: {
  //         type: "Literal",
  //         value: 123}},
  //     {
  //       tag: "constructor",
  //       super: null}),
  //   {"$this":true},
  //   `return (
  //     (
  //       (typeof 123 === "object") ?
  //       123 :
  //       (typeof 123 === "function")) ?
  //     123 :
  //     $this);`);
  // // ReturnStatement >> Completion._derived_constructor
  // success(
  //   {"this":true},
  //   helper(
  //     {
  //       type: "ReturnStatement",
  //       argument: null},
  //     {
  //       tag: "constructor",
  //       super: ScopeMeta._primitive_box("yo")}),
  //   {"$this":true},
  //   `return (
  //     $this ?
  //     $this :
  //     throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"));`);
  // success(
  //   {"this":true},
  //   helper(
  //     {
  //       type: "ReturnStatement",
  //       argument: {
  //         type: "Literal",
  //         value: 123}},
  //     {
  //       tag: "constructor",
  //       super: ScopeMeta._primitive_box("yo")}),
  //   {"$this":true},
  //   `return (
  //     (
  //       (typeof 123 === "object") ?
  //       123 :
  //       (typeof 123 === "function")) ?
  //     123 :
  //     (
  //       (123 === void 0) ?
  //       (
  //         $this ?
  //         $this :
  //         throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
  //       throw new #TypeError("Derived constructors may only return object or undefined")));`);
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
    Statement._default_context,
    `{
      let $x, $y, $z, $t;
      $x = #Object.defineProperty(
        #Object.defineProperty(
          () => {
            { 123;
              return void 0; } },
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
    Statement._default_context,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            {
              return void 0;
              return 123;
              return void 0; } },
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
    [
      {kind: "function", name:"f"}],
    `function f () { return; return 123; }`,
    Statement._default_context,
    `{
      let $f, _constructor;
      $f = void 0;
      $f = (
        _constructor = #Object.defineProperty(
          #Object.defineProperty(
            function () {
              let $f, $0newtarget, $this, $arguments;
              $f = void 0;
              $arguments = void 0;
              $f = callee;
              $0newtarget = new.target;
              $this = (
                new.target ?
                {__proto__:#Reflect.get(new.target, "prototype")} :
                this);
              $arguments = #Object.assign(
                #Object.create(
                  #Object.prototype,
                  {
                    __proto__: null,
                    length: {
                      __proto__: null,
                      value: #Reflect.get(arguments, "length"),
                      writable: true,
                      enumerable: false,
                      configurable: true},
                    callee: {
                      __proto__: null,
                      get: #Function.prototype.arguments.__get__,
                      set: #Function.prototype.arguments.__set__,
                      enumerable: false,
                      configurable: false},
                    [#Symbol.iterator]: {
                      __proto__: null,
                      value: #Array.prototype.values,
                      writable: true,
                      enumerable: false,
                      configurable: true}}),
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
                  123);
                return ($0newtarget ? $this : void 0); } },
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
            value: "f",
            writable: false,
            enumerable: false,
            configurable: true}),
        #Object.defineProperty(
          _constructor,
          "prototype",
          {
            __proto__: null,
            value: #Object.create(
              #Object.prototype,
              {
                __proto__: null,
                constructor: {
                  __proto__: null,
                  value: _constructor,
                  writable: true,
                  enumerable: false,
                  configurable: true}}),
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
    Statement._default_context,
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
                          #Object.create(
                            #Object.prototype,
                            {
                              __proto__: null,
                              length: {
                                __proto__: null,
                                value: #Reflect.get(arguments, "length"),
                                writable: true,
                                enumerable: false,
                                configurable: true},
                              callee: {
                                __proto__: null,
                                get: #Function.prototype.arguments.__get__,
                                set: #Function.prototype.arguments.__set__,
                                enumerable: false,
                                configurable: false},
                              [#Symbol.iterator]: {
                                __proto__: null,
                                value: #Array.prototype.values,
                                writable: true,
                                enumerable: false,
                                configurable: true}}),
                          arguments);
                        {
                          return $this;
                          return (
                            (
                              (typeof 123 === "object") ?
                              123 :
                              (typeof 123 === "function")) ?
                            123 :
                            $this);
                          return $this; } },
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
              $c);
            {} })
        ()); }`);
  // ClassDeclaration && Return (constructor) //
  success(
    false,
    false,
    [
      {kind:"class", name:"c"}],
    `class c extends 123 { constructor () { return; return 456; } }`,
    Statement._default_context,
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
                            #Object.create(
                              #Object.prototype,
                              {
                                __proto__: null,
                                length: {
                                  __proto__: null,
                                  value: #Reflect.get(arguments, "length"),
                                  writable: true,
                                  enumerable: false,
                                  configurable: true},
                                callee: {
                                  __proto__: null,
                                  get: #Function.prototype.arguments.__get__,
                                  set: #Function.prototype.arguments.__set__,
                                  enumerable: false,
                                  configurable: false},
                                [#Symbol.iterator]: {
                                  __proto__: null,
                                  value: #Array.prototype.values,
                                  writable: true,
                                  enumerable: false,
                                  configurable: true}}),
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
                                throw new #TypeError("Derived constructors may only return object or undefined")));
                            return (
                              $this ?
                              $this :
                              throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")); } },
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
                $c);
              {} })
          ())); }`);
  // BlockStatement //
  success(
    true,
    true,
    [
      {kind:"function", name:"f"}],
    `{
      123;
      let x = 456;
      function f () { 789; }}`,
    {
      __proto__: Statement._default_context,
      completion: Completion._make_full()},
    `{
      let _completion, $f;
      _completion = void 0;
      $f = void 0;
      {
        let $x, _constructor;
        $f = (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              function () {
                let $f, $newtarget, $arguments, $this;
                $f = void 0;
                $arguments = void 0;
                $f = callee;
                $newtarget = new.target;
                $this = (
                  new.target ?
                  {__proto__:#Reflect.get(new.target, "prototype")} :
                  this);
                $arguments = #Object.assign(
                  #Object.create(
                    #Object.prototype,
                    {
                      __proto__: null,
                      length: {
                        __proto__: null,
                        value: #Reflect.get(arguments, "length"),
                        writable: true,
                        enumerable: false,
                        configurable: true},
                      callee: {
                        __proto__: null,
                        get: #Function.prototype.arguments.__get__,
                        set: #Function.prototype.arguments.__set__,
                        enumerable: false,
                        configurable: false},
                      [#Symbol.iterator]: {
                        __proto__: null,
                        value: #Array.prototype.values,
                        writable: true,
                        enumerable: false,
                        configurable: true}}),
                  arguments);
                {
                  789;
                  return ($newtarget ? $this : void 0); } },
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
              value: "f",
              writable: false,
              enumerable: false,
              configurable: true}),
          #Object.defineProperty(
            _constructor,
            "prototype",
            {
              __proto__: null,
              value: #Object.create(
                #Object.prototype,
                {
                  __proto__: null,
                  constructor: {
                    __proto__: null,
                    value: _constructor,
                    writable: true,
                    enumerable: false,
                    configurable: true}}),
              writable: true,
              enumerable: false,
              configurable: false}));
        _completion = 123;
        $x = 456; } }`);
  // LabeledStatement //
  success(
    false,
    false,
    [],
    `foo : break foo;`,
    Statement._default_context,
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
      __proto__: Statement._default_context,
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      $foo: {
        _completion = 123;
        break $foo;
        _completion = 456; } }`);
  // IfStatement //
  success(
    false,
    false,
    [],
    `if (123) { 456; } else { 789; }`,
    Statement._default_context,
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
      __proto__: Statement._default_context,
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
      __proto__: Statement._default_context,
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      try {
        _completion = 123; }
      catch {
        _completion = void 0;
        {
          _completion = 456; }}
      finally {
        789; } }`);
  success(
    false,
    true,
    [],
    `foo: try { 123; } finally { 789; break foo; }`,
    {
      __proto__: Statement._default_context,
      completion: Completion._make_full()},
    `{
      let _completion;
      _completion = void 0;
      _completion = void 0;
      $foo: try {
        _completion = 123; }
      catch {
        throw error;
        {} }
      finally {
        _completion = 789;
        break $foo;} }`);
  success(
    false,
    false,
    [],
    `try { 123; } catch (x) { 456; }`,
    Statement._default_context,
    `{
      try {
        123; }
      catch {
        let x;
        x = error;
        {
          456; }}
      finally {} }`);
  // WithStatement //
  success(
    false,
    false,
    [
      {kind:"var", name:"y"}],
    `with (123) { let x = 456; x; y;}`,
    Statement._default_context,
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
      __proto__: Statement._default_context,
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
      __proto__: Statement._default_context,
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
    Statement._default_context,
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
      __proto__: Statement._default_context,
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
    Statement._default_context,
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
      __proto__: Statement._default_context,
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
    Statement._default_context,
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
    Statement._default_context,
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
    Statement._default_context,
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
      __proto__: Statement._default_context,
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
    Statement._default_context,
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
    Statement._default_context,
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
    Statement._default_context,
    "Unfortunately, Aran does not yet support asynchronous closures and await for-of statements.");
  success(
    false,
    true,
    [],
    `for (let x of 123) { let x = 456; 789; }`,
    {
      __proto__: Statement._default_context,
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
    Statement._default_context,
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
    Statement._default_context,
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
      switch (!1) {
        case 2:
          3;
          let x = 4;
          function f () { 5; }
        default:
          x;
          6; }`,
    {
      __proto__: Statement._default_context,
      completion: Completion._make_full()},
    `{
      let $f, _completion, _discriminant, _matched;
      _completion = void 0;
      $f = void 0;
      _completion = void 0;
      _discriminant = !1;
      _matched = false;
      $: {
        let $x, _x, _constructor;
        _x = false;
        $f = (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              function () {
                let $f, $newtarget, $this, $arguments;
                $f = void 0;
                $arguments = void 0;
                $f = callee;
                $newtarget = new.target;
                $this = (
                  new.target ?
                  {__proto__:#Reflect.get(new.target, "prototype")} :
                  this);
                $arguments = #Object.assign(
                  #Object.create(
                    #Object.prototype,
                    {
                      __proto__: null,
                      length: {
                        __proto__: null,
                        value: #Reflect.get(arguments, "length"),
                        writable: true,
                        enumerable: false,
                        configurable: true},
                      callee: {
                        __proto__: null,
                        get: #Function.prototype.arguments.__get__,
                        set: #Function.prototype.arguments.__set__,
                        enumerable: false,
                        configurable: false},
                      [#Symbol.iterator]: {
                        __proto__: null,
                        value: #Array.prototype.values,
                        writable: true,
                        enumerable: false,
                        configurable: true}}),
                  arguments);
                {
                  5;
                  return ($newtarget ? $this : void 0); } },
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
              value: "f",
              writable: false,
              enumerable: false,
              configurable: true}),
          #Object.defineProperty(
            _constructor,
            "prototype",
            {
              __proto__: null,
              value: #Object.create(
                #Object.prototype,
                {
                  __proto__: null,
                  constructor: {
                    __proto__: null,
                    value: _constructor,
                    writable: true,
                    enumerable: false,
                    configurable: true}}),
              writable: true,
              enumerable: false,
              configurable: false}));
        if (
          (
            _matched ?
            true :
            (
              (_discriminant === 2) ?
              (
                _matched = true,
                true) :
              false)))
        {
          3;
          ($x = 4, _x = true); }
        else {}
        _matched = true;
        {
          (
            _x ?
            $x :
            throw new #ReferenceError("Cannot read from deadzone variable x"));
          _completion = 6; } } }`);
});

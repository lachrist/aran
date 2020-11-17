"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const Assign = require("./assign.js");
const Closure = require("./closure.js");
const Lang = require("../../../lang/index.js");
const State = require("../../state.js");
const Scope = require("../../scope/index.js");
const Tree = require("../../tree.js");

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

const Statement = {
  Visit: (scope, statement) => {
    if (statement.type === "ExpressionStatement") {
      return Tree.Lift(Expression.visit(scope, statement.expression));
    }
    if (statement.type === "VariableDeclaration") {
      if (statement.declarations.length !== 1) {
        Assert.fail("Unexpected declarations length");
      }
      if (statement.declarations[0].id.type !== "Identifier") {
        Assert.fail("Unexpected pattern");
      }
      if (statement.declarations[0].init === null) {
        Assert.fail("Missing initializer");
      }
      return Tree.Lift(
        Scope.write(
          scope,
          statement.declarations[0].id.name,
          Expression.visit(scope, statement.declarations[0].init)));
    }
    Assert.fail("Unexpected statement type");
  }
};

const Expression = {
  visit: (scope, expression) => {
    if (expression.type === "Literal") {
      return Tree.primitive(expression.value);
    }
    if (expression.type === "Identifier") {
      return Scope.read(scope, expression.name);
    }
    if (expression.type === "CallExpression") {
      Assert.deepEqual(expression.callee.type, "Identifier");
      Assert.deepEqual(expression.callee.name, "eval");
      Assert.deepEqual(expression.arguments.length, 1);
      return Scope.eval(scope, Expression.visit(scope, expression.arguments[0]));
    }
    Assert.fail("Unexpected expression type");
  }
};

Assign._resolve_circular_dependencies(Expression);
Closure._resolve_circular_dependencies(Expression, Statement);

const failure = (tag, code, message) => Assert.throws(
  () => Closure.closure(
    Scope._make_global(),
    parse(code).body[0].expression,
    {
      __proto__: null,
      tag: tag,
      accessor: null,
      super: null,
      self: null,
      name: null}),
  new Error(message));

const success = (strict, context, code1, code2) => Lang._match_block(
  Scope.EXTEND_STATIC(
    (
      strict ?
      Scope._extend_use_strict(
        Scope._make_global()) :
      Scope._make_global()),
    {__proto__:null},
    (scope) => Scope.Box(
      scope,
      "name",
      false,
      Tree.primitive(context.name),
      (name_box) => Scope.Box(
        scope,
        "super",
        false,
        Tree.primitive(context.super),
        (super_box) => Scope.Box(
          scope,
          "self",
          false,
          Tree.primitive(context.self),
          (self_box) => Tree.Lift(
            Closure.closure(
              scope,
              parse(code1).body[0].expression,
              {
                __proto__: null,
                tag: context.tag,
                accessor: "accessor" in context ? context.accessor : null,
                name: "name" in  context ? name_box : null,
                super: "super" in context ? super_box : null,
                self: "self" in context ? self_box : null})))))),
  Lang.PARSE_BLOCK(code2),
  Assert);

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  // Normal asynchronous Function //
  failure(
    "function",
    `(async function () {});`,
    "Unfortunately, Aran does not yet support asynchronous closures.");
  // Normal generator Function //
  failure(
    "function",
    `(function* () {});`,
    "Unfortunately, Aran does not yet support generator closures.");
  // Strict arrow without name nor super //
  success(
    true,
    {
      __proto__: null,
      tag: null,
      accessor: "get"},
    `(() => { 123; });`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            { 123; }
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 0,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: ("get " + ""),
          configurable: true});}`);
  // Normal arrow with use strict //
  success(
    false,
    {
      __proto__: null,
      tag: "arrow",
      name: "foo",
      super: "bar",
      self: "qux"},
    `(() => { "use strict"; eval("qux"); });`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            {
              "use strict";
              eval("qux"); }
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 0,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          configurable: true});}`);
  // Strict arrow with var declaration //
  success(
    true,
    {
      __proto__: null,
      tag: "arrow",
      name: "foo",
      super: "bar",
      self: "qux"},
    `(() => { var x = 123; });`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            {
              let x;
              x = void 0;
              x = 123;}
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 0,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          configurable: true});}`);
  // Strict arrow with rest parameters  //
  success(
    true,
    {
      __proto__: null,
      tag: "arrow",
      name: "foo",
      super: "bar",
      self: "qux"},
    `((x1, x2, ...xs) => { 123; });`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            let x1, x2, xs;
            x1 = #Reflect.get(arguments, 0);
            x2 = #Reflect.get(arguments, 1);
            xs = #Array.prototype.slice(@arguments, 2);
            { 123; }
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 2,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          configurable: true});}`);
  // Strict arrow with expression //
  success(
    true,
    {
      __proto__: null,
      tag: "arrow",
      name: "foo",
      super: "bar",
      self: "qux"},
    `(() => 123);`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
           () => {
            return 123;
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 0,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          configurable: true});}`);
  // Strict arrow with expression //
  success(
    true,
    {
      __proto__: null,
      tag: "arrow",
      name: "foo",
      super: "bar",
      self: "qux"},
    `(function qux () { 123 });`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            let qux;
            qux = callee;
            { 123; }
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 0,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "qux",
          configurable: true});}`);
  // Normal arrow with eval //
  success(
    false,
    {
      __proto__: null,
      tag: "arrow",
      name: "foo",
      super: "bar",
      self: "qux"},
    `(() => { eval("qux"); x; })`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            let _frame;
            _frame = {__proto__: null};
            {
              eval("qux");
              (
                #Reflect.has(_frame, "x") ?
                #Reflect.get(_frame, "x") :
                (
                  #Reflect.has(#global, "x") ?
                  #Reflect.get(#global, "x") :
                  throw new #ReferenceError("x is not defined")));}
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 0,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          configurable: true});}`);

  // Strict method with duplicate parameters //
  success(
    true,
    {
      __proto__: null,
      tag: "method",
      name: "foo",
      super: "bar",
      self: "qux"},
    `(function (x, x) { 123; });`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          method () {
            let $x, _new_target, _arguments, _this;
            _new_target = void 0;
            _this = this;
            $x = #Reflect.get(arguments, 0);
            $x = #Reflect.get(arguments, 1);
            _arguments = #Object.assign(
              #Object.create(
                #Object.prototype,
                {
                  __proto__: null,
                  length: {
                    __proto__: null,
                    value: #Reflect.get(arguments, "length"),
                    writable: true,
                    configurable: true},
                  callee: {
                    __proto__: null,
                    get: #Function.prototype.arguments.__get__,
                    set: #Function.prototype.arguments.__set__},
                  [#Symbol.iterator]: {
                    __proto__: null,
                    value: #Array.prototype.values,
                    writable: true,
                    configurable: true}}),
              arguments);
            {
              123;}
            return void 0;},
          "length",
          {
            __proto__: null,
            value: 2,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          configurable: true});}`);
  // Strict Constructor //
  success(
    true,
    {
      __proto__: null,
      tag: "constructor",
      name: "foo",
      self: "qux"},
    `(function () { 123; });`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          constructor () {
            let _new_target, _arguments, _this;
            _new_target = (
              new.target ?
              new.target :
              throw new #TypeError("Class constructor cannot be invoked without 'new'"));
            _this = {__proto__:#Reflect.get(new.target, "prototype")};
            _arguments = #Object.assign(
              #Object.create(
                #Object.prototype,
                {
                  __proto__: null,
                  length: {
                    __proto__: null,
                    value: #Reflect.get(arguments, "length"),
                    writable: true,
                    configurable: true},
                  callee: {
                    __proto__: null,
                    get: #Function.prototype.arguments.__get__,
                    set: #Function.prototype.arguments.__set__},
                  [#Symbol.iterator]: {
                    __proto__: null,
                    value: #Array.prototype.values,
                    writable: true,
                    configurable: true}}),
              arguments);
            {
              123;}
            return _this;},
          "length",
          {
            __proto__: null,
            value: 0,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          configurable: true});}`);
  // Strict Derived Constructor //
  success(
    true,
    {
      __proto__: null,
      tag: "constructor",
      name: "foo",
      super: "bar",
      self: "qux"},
    `(function () { 123; });`,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
          constructor () {
            let _new_target, _arguments, _this;
            _new_target = (
              new.target ?
              new.target :
              throw new #TypeError("Class constructor cannot be invoked without 'new'"));
            _this = null;
            _arguments = #Object.assign(
              #Object.create(
                #Object.prototype,
                {
                  __proto__: null,
                  length: {
                    __proto__: null,
                    value: #Reflect.get(arguments, "length"),
                    writable: true,
                    configurable: true},
                  callee: {
                    __proto__: null,
                    get: #Function.prototype.arguments.__get__,
                    set: #Function.prototype.arguments.__set__},
                  [#Symbol.iterator]: {
                    __proto__: null,
                    value: #Array.prototype.values,
                    writable: true,
                    configurable: true}}),
              arguments);
            {
              123;}
            return (
              _this ?
              _this :
              throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"));},
          "length",
          {
            __proto__: null,
            value: 0,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          configurable: true});}`);
  // Normal function //
  success(
    false,
    {
      __proto__: null,
      tag: null,
      name: "foo",
      super: "bar",
      self: "qux"},
    `(function (x) { 123; });`,
    `{
      let _constructor;
      (
        _constructor = #Object.defineProperty(
          #Object.defineProperty(
            #Object.defineProperty(
              #Object.defineProperty(
                function () {
                  let marker, x, _new_target, _arguments, _this;
                  _new_target = new.target;
                  _this = (
                    new.target  ?
                    {__proto__: #Reflect.get(new.target, "prototype")} :
                    (
                      (
                        (this === null) ?
                        true :
                        (this === void 0)) ?
                      #global :
                      #Object(this)));
                  x = #Reflect.get(arguments, 0);
                  _arguments = (
                    marker = {__proto__:null},
                    new #Proxy(
                      #Array.prototype.fill(
                        @#Object.assign(
                          #Object.create(
                            #Object.prototype,
                            {
                              __proto__: null,
                              length: {
                                __proto__: null,
                                value: #Reflect.get(arguments, "length"),
                                writable: true,
                                configurable: true},
                              callee: {
                                __proto__: null,
                                value: callee,
                                writable: true,
                                configurable: true},
                              [#Symbol.iterator]: {
                                __proto__: null,
                                value: #Array.prototype.values,
                                writable: true,
                                configurable: true}}),
                          arguments),
                        marker,
                        0,
                        (
                          (#Reflect.get(arguments, "length") < 1) ?
                          #Reflect.get(arguments, "length") :
                          1)),
                      {
                        __proto__: null,
                        defineProperty: () => {
                          let target, key, descriptor;
                          target = #Reflect.get(arguments, 0);
                          key = #Reflect.get(arguments, 1);
                          descriptor = #Reflect.get(arguments, 2);
                          return (
                            (
                              (
                                #Reflect.get(
                                  #Reflect.getOwnPropertyDescriptor(target, key),
                                  "value") ===
                                marker) ?
                              (
                                #Reflect.getOwnPropertyDescriptor(descriptor, "value") ?
                                (
                                  #Reflect.get(descriptor, "writable") ?
                                  #Reflect.get(descriptor, "configurable") :
                                  false) :
                                false) :
                              false) ?
                            (
                              (
                                (key === "0") ?
                                x = #Reflect.get(descriptor, "value") :
                                throw "This should never happen, please contact the dev"),
                              true) :
                            #Reflect.defineProperty(target, key, descriptor));},
                        getOwnPropertyDescriptor: () => {
                          let target, key, descriptor;
                          target = #Reflect.get(arguments, 0);
                          key = #Reflect.get(arguments, 1);
                          descriptor = #Reflect.getOwnPropertyDescriptor(target, key);
                          (
                            (
                              #Reflect.getOwnPropertyDescriptor(descriptor, "value") ?
                              (
                                #Reflect.get(descriptor, "value") ===
                                marker) :
                              false) ?
                            #Reflect.set(
                              descriptor,
                              "value",
                              (
                                (key === "0") ?
                                x :
                                throw "This should never happen, please contact the dev")) :
                            void 0);
                          return descriptor;},
                        get: () => {
                          let target, key, receiver, value;
                          target = #Reflect.get(arguments, 0);
                          key = #Reflect.get(arguments, 1);
                          receiver = #Reflect.get(arguments, 2);
                          value = #Reflect.get(target, key, receiver);
                          return (
                            (value === marker) ?
                            (
                              (key === "0") ?
                              x :
                              throw "This should never happen, please contact the dev") :
                            value);}}));
                  {
                    123;}
                  return (_new_target ? _this : void 0);},
                "length",
                {
                  __proto__: null,
                  value: 1,
                  configurable: true}),
              "name",
              {
                __proto__: null,
                value: "foo",
                configurable: true}),
            "arguments",
            {
              __proto__: null,
              value: null}),
          "caller",
          {
            __proto__: null,
            value: null}),
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
                  configurable: true}}),
            writable: true}));}`);

});
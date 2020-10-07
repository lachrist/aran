"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

const Tree = require("../../tree.js");
const Lang = require("../../../lang/index.js");
const State = require("../../state.js");
const Scope = require("../../scope/index.js");
const Completion = require("../../completion.js");
const Assign = require("./assign.js");
const Closure = require("./closure.js");
const Class = require("./class.js");

const Statement = {
  Visit: (scope, statement) => {
    if (statement.type === "ExpressionStatement") {
      return Tree.Lift(Expression.visit(scope, statement.expression));
    }
    Assert.fail("Unexpected statement type");
  }
};

const Expression = {
  visit: (scope, expression, context) => {
    if (expression.type === "Literal") {
      return Tree.primitive(expression.value);
    }
    if (expression.type === "FunctionExpression") {
      if (context === null) {
        throw new Error("Unexpected empty context");
      }
      return Closure.closure(scope, expression, context.completion, context.name, context.super);
    }
    Assert.fail("Unexpected expression type");
  }
};

Assign._resolve_circular_dependencies(Expression);
Closure._resolve_circular_dependencies(Expression, Statement);
Class._resolve_circular_dependencies(Expression);

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  const test = (name, code1, code2) => Lang._match_block(
    Scope.EXTEND_STATIC(
      Scope._make_root(),
      {__proto__:null},
      (scope) => Scope.Box(
        scope,
        "name",
        false,
        Tree.primitive(name),
        (name_box) => Tree.Lift(
          Class.class(
            scope,
            parse(code1).body[0].expression,
            name === null ? null : name_box)))),
    Lang.PARSE_BLOCK(code2),
    Assert);
  test(
    "qux",
    `(class extends 123 { get foo () { 456; } set bar (x) { 789; } static ["qux"] () { 0; } });`,
    `{
      let _constructor;
      (
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
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              function () {
                return (
                  NEW_TARGET ?
                  #Reflect.construct(123, ARGUMENTS, NEW_TARGET) :
                  throw new #TypeError("Class constructor cannot be invoked without 'new'"));},
              "length",
              {
                __proto__: null,
                value: 0,
                configurable: true}),
            "name",
            {
              __proto__: null,
              value: "qux",
              configurable: true}),
          #Object.defineProperty(
            #Object.defineProperty(
              _constructor,
              "prototype",
              {
                __proto__: null,
                value: #Object.create(
                  (
                    (123 === null) ?
                    null :
                    #Reflect.get(123, "prototype")),
                  {
                    __proto__: null,
                    constructor: {
                      __proto__: null,
                      value: _constructor,
                      writable: true,
                      configurable: true},
                    foo: {
                      __proto__: null,
                      get: #Object.defineProperty(
                        #Object.defineProperty(
                          method () {
                            let _new_target, _arguments, _this, _super;
                            _super = 123;
                            _new_target = void 0;
                            _this = THIS;
                            _arguments = #Object.assign(
                              #Object.create(
                                #Object.prototype,
                                {
                                  __proto__: null,
                                  length: {
                                    __proto__: null,
                                    value: #Reflect.get(ARGUMENTS, "length"),
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
                              ARGUMENTS);
                            {
                              456;}
                            return void 0;},
                          "length",
                          {
                            __proto__: null,
                            value: 0,
                            configurable: true}),
                        "name",
                        {
                          __proto__: null,
                          value: "foo",
                          configurable: true}),
                      configurable: true},
                    bar: {
                      __proto__: null,
                      set: #Object.defineProperty(
                        #Object.defineProperty(
                          method () {
                            let x, _new_target, _arguments, _this, _super;
                            _super = 123;
                            _new_target = void 0;
                            _this = THIS;
                            x = #Reflect.get(ARGUMENTS, 0);
                            _arguments = #Object.assign(
                              #Object.create(
                                #Object.prototype,
                                {
                                  __proto__: null,
                                  length: {
                                    __proto__: null,
                                    value: #Reflect.get(ARGUMENTS, "length"),
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
                              ARGUMENTS);
                            {
                              789;}
                            return void 0;},
                          "length",
                          {
                            __proto__: null,
                            value: 1,
                            configurable: true}),
                        "name",
                        {
                          __proto__: null,
                          value: "bar",
                          configurable: true}),
                      configurable: true}}),
                writable: true}),
            "qux",
            {
              __proto__: null,
              value: #Object.defineProperty(
                #Object.defineProperty(
                  method () {
                    let _new_target, _arguments, _this, _super;
                    _super = 123;
                    _new_target = void 0;
                    _this = THIS;
                    _arguments = #Object.assign(
                      #Object.create(
                        #Object.prototype,
                        {
                          __proto__: null,
                          length: {
                            __proto__: null,
                            value: #Reflect.get(ARGUMENTS, "length"),
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
                      ARGUMENTS);
                    {
                      0;}
                    return void 0;},
                  "length",
                  {
                    __proto__: null,
                    value: 0,
                    configurable: true}),
                "name",
                {
                  __proto__: null,
                  value: "qux",
                  configurable: true}),
              writable: true,
              configurable: true})));}`);
  // Named Class //
  test(
    null,
    `(class foo { constructor () { 123; }});`,
    `{
      (
        (
          () => {
            let foo, _constructor;
            foo = (
              _constructor = #Object.defineProperty(
                #Object.defineProperty(
                  function () {
                    let _new_target, _arguments, _this, _super;
                    _super = #Object;
                    _new_target = (
                      NEW_TARGET ?
                      NEW_TARGET :
                      throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                    _this = #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET);
                    _arguments = #Object.assign(
                      #Object.create(
                        #Object.prototype,
                        {
                          __proto__: null,
                          length: {
                            __proto__: null,
                            value: #Reflect.get(ARGUMENTS, "length"),
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
                      ARGUMENTS);
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
                        configurable: true}}),
                  writable: true}));
            return foo; })
        ());}`);
  // Present && Derived Constructor //
  test(
    null,
    `(class extends 123 { constructor () { 456; }});`,
    `{
      let _constructor;
      (
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
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              function () {
                let _new_target, _arguments, _this, _super;
                _super = 123;
                _new_target = (
                  NEW_TARGET ?
                  NEW_TARGET :
                  throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                _this = null;
                _arguments = #Object.assign(
                  #Object.create(
                    #Object.prototype,
                    {
                      __proto__: null,
                      length: {
                        __proto__: null,
                        value: #Reflect.get(ARGUMENTS, "length"),
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
                  ARGUMENTS);
                {
                  456;}
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
              value: "",
              configurable: true}),
          #Object.defineProperty(
            _constructor,
            "prototype",
            {
              __proto__: null,
              value: #Object.create(
                (
                  (123 === null) ?
                  null :
                  #Reflect.get(123, "prototype")),
                {
                  __proto__: null,
                  constructor: {
                    __proto__: null,
                    value: _constructor,
                    writable: true,
                    configurable: true}}),
              writable: true})));}`);
  // Absent && Non Dervived Constructor //
  test(
    null,
    `(class {});`,
    `{
      let _constructor;
      (
        _constructor = #Object.defineProperty(
          #Object.defineProperty(
            function () {
              return (
                NEW_TARGET ?
                #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET) :
                throw new #TypeError("Class constructor cannot be invoked without 'new'"));},
            "length",
            {
              __proto__: null,
              value: 0,
              configurable: true}),
          "name",
          {
            __proto__: null,
            value: "",
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
                  configurable: true}}),
            writable: true}));}`);
});

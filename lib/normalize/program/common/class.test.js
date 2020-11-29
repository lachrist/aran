"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../../tree.js")._toggle_debug_mode();

const Parse = require("../../../parse.js");
const Tree = require("../../tree.js");
const Lang = require("../../../lang/index.js");
const State = require("../../state.js");
const Scope = require("../../scope/index.js");
const Completion = require("../../completion.js");
const Assign = require("./assign.js");
const Closure = require("./closure.js");
const Class = require("./class.js");

const Statement = {
  _hoisted_context: {foobar:"hoisted-statement-default-context"},
  _default_context: {foobar:"statement-default-context"},
  Visit: (scope, statement, context) => {
    if (context.foobar === Statement._hoisted_context.foobar) {
      return Tree.Bundle([]);
    }
    Assert.deepEqual(context.foobar, Statement._default_context.foobar);
    if (statement.type === "ExpressionStatement") {
      return Tree.Lift(Expression.visit(scope, statement.expression, Expression._default_context));
    }
    Assert.fail("Unexpected statement type");
  }
};

const Expression = {
  _default_context: {foobar:"expression-default-context"},
  visit: (scope, expression, context) => {
    Assert.deepEqual(context.foobar, Expression._default_context.foobar);
    if (expression.type === "Literal") {
      return Tree.primitive(expression.value);
    }
    if (expression.type === "FunctionExpression") {
      if (context === null) {
        throw new Error("Unexpected empty context");
      }
      return Closure.closure(scope, expression, context);
    }
    Assert.fail("Unexpected expression type");
  }
};

Body._resolve_circular_dependencies(Statement);
Assign._resolve_circular_dependencies(Expression);
Closure._resolve_circular_dependencies(Expression);
Class._resolve_circular_dependencies(Expression);

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, [], () => {
  const test = (name, code1, code2) => Lang._match_block(
    Scope.MODULE(
      false,
      [],
      (scope) => Scope.Box(
        scope,
        false,
        "name",
        Tree.primitive(name),
        (name_box) => Tree.Lift(
          Class.class(
            scope,
            Parse.script(code1).body[0].expression,
            {
              __proto__: Expression._default_context,
              name: name === null ? null : name_box})))),
    Lang.PARSE_BLOCK(code2),
    Assert);
  // Absent Constructor && Empty Name //
  test(
    null,
    `(class {});`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              constructor () {
                return (
                  new.target ?
                  {__proto__:#Reflect.get(new.target, "prototype")} :
                  throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                {}},
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
            _constructor)));}`);
  // Absent Derived Constructor //
  test(
    "qux",
    `(class extends 123 {});`,
    `{
      let _constructor, _prototype;
      (
        (
          (123 === null) ?
          void 0 :
          #Reflect.construct(
            #Object,
            {__proto__:null, length:0},
            123)),
        (
          _prototype = {__proto__:#Reflect.get(123, "prototype")},
          (
            _constructor = #Object.defineProperty(
              #Object.defineProperty(
                constructor () {
                  return (
                    new.target ?
                    #Reflect.construct(123, arguments, new.target) :
                    throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                  {}},
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
                value: "qux",
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
              _constructor))));}`);
  // Present Constructor //
  test(
    "qux",
    `(class { constructor () { 123; }});`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              constructor () {
                let $$0newtarget, $$arguments, $$this;
                $$arguments = void 0;
                $$0newtarget = (
                  new.target ?
                  new.target :
                  throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                $$this = {
                  __proto__: #Reflect.get(new.target, "prototype")};
                $$arguments = #Object.assign(
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
                  123;
                  return $$this; } },
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
              value: "qux",
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
            _constructor)));}`);
  // Method //
  test(
    "qux",
    `(class { foo () { 123; } });`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              constructor () {
                return (
                  new.target ?
                  {__proto__:#Reflect.get(new.target, "prototype")} :
                  throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                {}},
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
              value: "qux",
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
            (
              #Object.defineProperty(
                _prototype,
                "foo",
                {
                  __proto__: null,
                  value: #Object.defineProperty(
                    #Object.defineProperty(
                      method () {
                        let $$0newtarget, $$arguments, $$this;
                        $$arguments = void 0;
                        $$0newtarget = void 0;
                        $$this = this;
                        $$arguments = #Object.assign(
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
                          123;
                          return void 0;} },
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
                      value: "foo",
                      writable: false,
                      enumerable: false,
                      configurable: true}),
                  writable: true,
                  enumerable: false,
                  configurable: true}),
              _constructor))));}`);
  // Static Method && Computed Key //
  test(
    "qux",
    `(class { static ["foo"] () { 123; } });`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              constructor () {
                return (
                  new.target ?
                  {__proto__:#Reflect.get(new.target, "prototype")} :
                  throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                {}},
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
              value: "qux",
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
            (
              #Object.defineProperty(
                _constructor,
                "foo",
                {
                  __proto__: null,
                  value: #Object.defineProperty(
                    #Object.defineProperty(
                      method () {
                        let $$0newtarget, $$arguments, $$this;
                        $$arguments = void 0;
                        $$0newtarget = void 0;
                        $$this = this;
                        $$arguments = #Object.assign(
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
                          123;
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
                      value: "foo",
                      writable: false,
                      enumerable: false,
                      configurable: true}),
                  writable: true,
                  enumerable: false,
                  configurable: true}),
              _constructor))));}`);
  // Accessor Method //
  test(
    "qux",
    `(class { get foo () { 123; } });`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              constructor () {
                return (
                  new.target ?
                  {__proto__:#Reflect.get(new.target, "prototype")} :
                  throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                {} },
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
              value: "qux",
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
            (
              #Object.defineProperty(
                _prototype,
                "foo",
                {
                  __proto__: null,
                  get: #Object.defineProperty(
                    #Object.defineProperty(
                      method () {
                        let $$0newtarget, $$arguments, $$this;
                        $$arguments = void 0;
                        $$0newtarget = void 0;
                        $$this = this;
                        $$arguments = #Object.assign(
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
                          123;
                          return void 0;} },
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
                      value: ("get " + "foo"),
                      writable: false,
                      enumerable: false,
                      configurable: true}),
                  enumerable: false,
                  configurable: true}),
              _constructor))));}`);
  // Named Class //
  test(
    "qux",
    `(class foo {});`,
    `{
      (
        (
          () => {
            let $foo, _constructor, _prototype;
            return (
              $foo = (
                _prototype = {__proto__:#Object.prototype},
                (
                  _constructor = #Object.defineProperty(
                    #Object.defineProperty(
                      constructor () {
                        return (
                          new.target ?
                          {__proto__:#Reflect.get(new.target, "prototype")} :
                          throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                        {} },
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
                      value: "foo",
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
              $foo);
            {} })
        ());}`);
});

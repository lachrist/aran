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
      return Closure.closure(scope, expression, context);
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
      Scope._make_global(),
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
            {
              __proto__: null,
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
          (
            (
              #Reflect.defineProperty(
                _prototype,
                "constructor",
                {
                  __proto__: null,
                  value: _constructor,
                  writable: true,
                  configurable: true}),
              #Reflect.defineProperty(
                _constructor,
                "prototype",
                {
                  __proto__: null,
                  value: _prototype})),
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
            (
              (
                #Reflect.defineProperty(
                  _prototype,
                  "constructor",
                  {
                    __proto__: null,
                    value: _constructor,
                    writable: true,
                    configurable: true}),
                #Reflect.defineProperty(
                  _constructor,
                  "prototype",
                  {
                    __proto__: null,
                    value: _prototype})),
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
                let _new_target, _arguments, _this;
                _new_target = (
                  new.target ?
                  new.target :
                  throw new #TypeError("Class constructor cannot be invoked without 'new'"));
                _this = {
                  __proto__: #Reflect.get(new.target, "prototype")};
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
              value: "qux",
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
                  configurable: true}),
              #Reflect.defineProperty(
                _constructor,
                "prototype",
                {
                  __proto__: null,
                  value: _prototype})),
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
          (
            (
              #Reflect.defineProperty(
                _prototype,
                "constructor",
                {
                  __proto__: null,
                  value: _constructor,
                  writable: true,
                  configurable: true}),
              #Reflect.defineProperty(
                _constructor,
                "prototype",
                {
                  __proto__: null,
                  value: _prototype})),
            (
              #Object.defineProperty(
                _prototype,
                "foo",
                {
                  __proto__: null,
                  value: #Object.defineProperty(
                    #Object.defineProperty(
                      method () {
                        let _new_target, _arguments, _this;
                        _new_target = void 0;
                        _this = this;
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
                        value: 0,
                        configurable: true}),
                    "name",
                    {
                      __proto__: null,
                      value: "foo",
                      configurable: true}),
                  writable: true,
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
          (
            (
              #Reflect.defineProperty(
                _prototype,
                "constructor",
                {
                  __proto__: null,
                  value: _constructor,
                  writable: true,
                  configurable: true}),
              #Reflect.defineProperty(
                _constructor,
                "prototype",
                {
                  __proto__: null,
                  value: _prototype})),
            (
              #Object.defineProperty(
                _constructor,
                "foo",
                {
                  __proto__: null,
                  value: #Object.defineProperty(
                    #Object.defineProperty(
                      method () {
                        let _new_target, _arguments, _this;
                        _new_target = void 0;
                        _this = this;
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
                        value: 0,
                        configurable: true}),
                    "name",
                    {
                      __proto__: null,
                      value: "foo",
                      configurable: true}),
                  writable: true,
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
          (
            (
              #Reflect.defineProperty(
                _prototype,
                "constructor",
                {
                  __proto__: null,
                  value: _constructor,
                  writable: true,
                  configurable: true}),
              #Reflect.defineProperty(
                _constructor,
                "prototype",
                {
                  __proto__: null,
                  value: _prototype})),
            (
              #Object.defineProperty(
                _prototype,
                "foo",
                {
                  __proto__: null,
                  get: #Object.defineProperty(
                    #Object.defineProperty(
                      method () {
                        let _new_target, _arguments, _this;
                        _new_target = void 0;
                        _this = this;
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
                        value: 0,
                        configurable: true}),
                    "name",
                    {
                      __proto__: null,
                      value: ("get " + "foo"),
                      configurable: true}),
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
                          throw new #TypeError("Class constructor cannot be invoked without 'new'"));},
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
                  (
                    (
                      #Reflect.defineProperty(
                        _prototype,
                        "constructor",
                        {
                          __proto__: null,
                          value: _constructor,
                          writable: true,
                          configurable: true}),
                      #Reflect.defineProperty(
                        _constructor,
                        "prototype",
                        {
                          __proto__: null,
                          value: _prototype})),
                    _constructor))),
              $foo);})
        ());}`);
});

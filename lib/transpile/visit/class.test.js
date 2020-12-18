"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const ParseExternal = require("../../parse-external.js");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit._test_init([
  require("./other.js"),
  require("./pattern.js"),
  require("./closure.js"),
  require("./class.js"),
  {
    expression: (scope, expression, context) => {
      Assert.deepEqual(context, null);
      if (expression.type === "Literal") {
        return Tree.primitive(expression.value);
      }
      // if (expression.type === "FunctionExpression") {
      //   if (context === null) {
      //     throw new Error("Unexpected empty context");
      //   }
      //   return Visit.closure(scope, expression, context);
      // }
      Assert.fail("Unexpected expression type");
    },
    CLOSURE_BODY: (scope, node, context) => Scope.CLOSURE_BODY(scope, false, [], (scope) => {
      Assert.deepEqual(context, {bindings:[]});
      if (node.type === "BlockStatement") {
        return Tree.Bundle(ArrayLite.map(node.body, (node) => {
          Assert.deepEqual(node.type, "ExpressionStatement");
          return Tree.Lift(Visit.expression(scope, node.expression, null));
        }));
      }
      return Tree.Return(Tree.Lift(Visit.expression(scope, node, null)));
    })
  }
]);

const generated_constructor = (identifier, name) => `
  #Reflect.get(
    #Object.defineProperty(
      ${identifier},
      "constructor",
      {
        __proto__: null,
        value: #Object.defineProperty(
          #Object.defineProperty(
            #Object.defineProperty(
              constructor () {
                return (
                  #Reflect.get(input, "new.target") ?
                  {__proto__:#Reflect.get(#Reflect.get(input, "new.target"), "prototype")} :
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
              value: ${global.JSON.stringify(name)},
              writable: false,
              enumerable: false,
              configurable: true}),
          "prototype",
          {
            __proto__: null,
            value: ${identifier},
            writable: false,
            enumerable: false,
            configurable: false}),
        writable: true,
        enumerable: false,
        configurable: true}),
    "constructor")`;

const generated_derived_constructor = (identifier, name) => `
  #Reflect.get(
    #Object.defineProperty(
      ${identifier},
      "constructor",
      {
        __proto__: null,
        value: #Object.defineProperty(
          #Object.defineProperty(
            #Object.defineProperty(
              constructor () {
                return (
                  #Reflect.get(input, "new.target") ?
                  #Reflect.construct(123, #Reflect.get(input, "arguments"), #Reflect.get(input, "new.target")) :
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
              value: ${global.JSON.stringify(name)},
              writable: false,
              enumerable: false,
              configurable: true}),
          "prototype",
          {
            __proto__: null,
            value: ${identifier},
            writable: false,
            enumerable: false,
            configurable: false}),
        writable: true,
        enumerable: false,
        configurable: true}),
    "constructor")`;

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {
  const test = (context, code1, code2) => Lang._match(
    Scope.MODULE(
      Scope._make_root(),
      [],
      (scope) => Tree.Lift(
        Visit.class(
          scope,
          ParseExternal(code1).body[0].expression,
          context))),
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
          _constructor = ${generated_constructor("_prototype", "")},
          _constructor)); }`);
  // Absent Derived Constructor //
  test(
    {name:Scope._primitive_box("qux")},
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
            _constructor = ${generated_derived_constructor("_prototype", "qux")},
            _constructor))); }`);
  // Present Constructor //
  test(
    {name:Scope._primitive_box("qux")},
    `(class { constructor () { 123; }});`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = ${Lang._generate(
            Visit.closure(
              Scope._use_strict(
                Scope._make_root()),
              ParseExternal(`(function () { 123; });`).body[0].expression,
              {
                sort: "constructor",
                name: Scope._primitive_box("qux"),
                prototype: Scope._test_box("_prototype"),
                self: Scope._test_box("_prototype")}))},
          _constructor));}`);
  // Method //
  test(
    {name:Scope._primitive_box("qux")},
    `(class { foo () { 123; } });`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = ${generated_constructor("_prototype", "qux")},
          (
            #Object.defineProperty(
              _prototype,
              "foo",
              {
                __proto__: null,
                value: ${Lang._generate(
                  Visit.closure(
                    Scope._use_strict(
                      Scope._make_root()),
                    ParseExternal(`(function () { 123; });`).body[0].expression,
                    {
                      sort: "method",
                      name: Scope._primitive_box("foo"),
                      prototype: Scope._test_box("_prototype"),
                      self: Scope._test_box("_prototype")}))},
                writable: true,
                enumerable: false,
                configurable: true}),
            _constructor)));}`);
  // Static Method && Computed Key //
  test(
    {name:Scope._primitive_box("qux")},
    `(class { static ["foo"] () { 123; } });`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = ${generated_constructor("_prototype", "qux")},
          (
            #Object.defineProperty(
              _constructor,
              "foo",
              {
                __proto__: null,
                value: ${Lang._generate(
                  Visit.closure(
                    Scope._use_strict(
                      Scope._make_root()),
                    ParseExternal(`(function () { 123; });`).body[0].expression,
                    {
                      sort: "method",
                      name: Scope._primitive_box("foo"),
                      prototype: Scope._test_box("_prototype"),
                      self: Scope._test_box("_prototype")}))},
                writable: true,
                enumerable: false,
                configurable: true}),
            _constructor)));}`);
  // Accessor Method //
  test(
    {name:Scope._primitive_box("qux")},
    `(class { get foo () { 123; } });`,
    `{
      let _constructor, _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        (
          _constructor = ${generated_constructor("_prototype", "qux")},
          (
            #Object.defineProperty(
              _prototype,
              "foo",
              {
                __proto__: null,
                get: ${Lang._generate(
                  Visit.closure(
                    Scope._use_strict(
                      Scope._make_root()),
                    ParseExternal(`(function () { 123; });`).body[0].expression,
                    {
                      sort: "method",
                      name: Scope._primitive_box("foo"),
                      prototype: Scope._test_box("_prototype"),
                      accessor: "get",
                      self: Scope._test_box("_prototype")}))},
                enumerable: false,
                configurable: true}),
            _constructor)));}`);
  // Named Class //
  test(
    {name:Scope._primitive_box("qux")},
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
                  _constructor = ${generated_constructor("_prototype", "foo")},
                  _constructor)),
              $foo); })
        ());}`);
});

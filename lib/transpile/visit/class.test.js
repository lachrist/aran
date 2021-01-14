"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const ParseExternal = require("../../parse-external.js");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit.initializeTest([
  require("./other.js"),
  require("./pattern.js"),
  require("./closure.js"),
  require("./class.js"),
  {
    visitExpression: (scope, expression, context) => {
      Assert.deepEqual(context, null);
      if (expression.type === "Literal") {
        return Tree.PrimitiveExpression(expression.value);
      }
      // if (expression.type === "FunctionExpression") {
      //   if (context === null) {
      //     throw new Error("Unexpected empty context");
      //   }
      //   return Visit.visitClosure(scope, expression, context);
      // }
      Assert.fail("Unexpected expression type");
    },
    visitClosureBody: (scope, node, context) => Scope.makeBodyClosureBlock(scope, false, [], (scope) => {
      Assert.deepEqual(context, {bindings:[]});
      if (node.type === "BlockStatement") {
        return Tree.ListStatement(ArrayLite.concat(ArrayLite.map(node.body, (node) => {
          Assert.deepEqual(node.type, "ExpressionStatement");
          return Tree.ExpressionStatement(Visit.visitExpression(scope, node.expression, null));
        }), [Tree.CompletionStatement(Tree.PrimitiveExpression(void 0))]));
      }
      return Tree.CompletionStatement(Tree.ExpressionStatement(Visit.visitExpression(scope, node, null)));
    })
  }
]);

const generated_constructor = (prototype, super_constructor, name) => `
  #Reflect.get(
    #Object.defineProperty(
      ${prototype},
      "constructor",
      {
        __proto__: null,
        value: #Object.defineProperty(
          #Object.defineProperty(
            #Object.defineProperty(
              constructor () {
                completion (
                  #Reflect.get(input, "new.target") ?
                  #Reflect.construct(${super_constructor}, #Reflect.get(input, "arguments"), #Reflect.get(input, "new.target")) :
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
            value: ${prototype},
            writable: false,
            enumerable: false,
            configurable: false}),
        writable: true,
        enumerable: false,
        configurable: true}),
    "constructor")`;

State.runSession({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {

  const test = (context, code1, code2) => Lang.match(
    Scope.makeModuleBlock(
      Scope.RootScope(),
      [],
      (scope) => Tree.CompletionStatement(
        Visit.visitClass(
          scope,
          ParseExternal(code1).body[0].expression,
          context))),
    Lang.parseBlock(code2),
    Assert);
  // Absent Constructor && Empty Name //
  test(
    null,
    `(class {});`,
    `{
      let _constructor, _prototype, _super;
      completion (
        _prototype = {__proto__:#Reflect.get(#Object, "prototype")},
        (
          _super = {
            __proto__: null,
            constructor: #Object,
            prototype: _prototype},
          (
            _constructor = ${generated_constructor("_prototype", "#Object", "")},
            _constructor))); }`);
  // Absent Derived Constructor //
  test(
    {name:Scope.PrimitiveBox("qux")},
    `(class extends 123 {});`,
    `{
      let _constructor, _prototype, _super;
      completion (
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
            _super = {
              __proto__: null,
              constructor: 123,
              prototype: _prototype},
            (
              _constructor = ${generated_constructor("_prototype", "123", "qux")},
              #Object.setPrototypeOf(_constructor, 123))))); }`);
  // Present Constructor //
  test(
    {name:Scope.PrimitiveBox("qux")},
    `(class { constructor () { 123; }});`,
    `{
      let _constructor, _prototype, _super;
      completion (
        _prototype = {__proto__:#Reflect.get(#Object, "prototype")},
        (
          _super = {
            __proto__: null,
            constructor: #Object,
            prototype: _prototype},
          (
            _constructor = ${Lang.generate(
              Visit.visitClosure(
                Scope.StrictBindingScope(
                  Scope.RootScope()),
                ParseExternal(`(function () { 123; });`).body[0].expression,
                {
                  sort: "constructor",
                  super: Scope.TestBox("_super"),
                  name: Scope.PrimitiveBox("qux"),
                  prototype: Scope.TestBox("_prototype")}))},
            _constructor))); }`);
  // Method //
  test(
    {name:Scope.PrimitiveBox("qux")},
    `(class { foo () { 123; } });`,
    `{
      let _constructor, _prototype, _super;
      completion (
        _prototype = {__proto__:#Reflect.get(#Object, "prototype")},
        (
          _super = {
            __proto__: null,
            constructor: #Object,
            prototype: _prototype},
          (
            _constructor = ${generated_constructor("_prototype", "#Object", "qux")},
            (
              #Object.defineProperty(
                _prototype,
                "foo",
                {
                  __proto__: null,
                  value: ${Lang.generate(
                    Visit.visitClosure(
                      Scope.StrictBindingScope(
                        Scope.RootScope()),
                      ParseExternal(`(function () { 123; });`).body[0].expression,
                      {
                        sort: "method",
                        name: Scope.PrimitiveBox("foo"),
                        prototype: Scope.TestBox("_prototype"),
                        super: Scope.TestBox("_super")}))},
                  writable: true,
                  enumerable: false,
                  configurable: true}),
              _constructor)))); }`);
  // Static Method && Computed Key //
  test(
    {name:Scope.PrimitiveBox("qux")},
    `(class { static ["foo"] () { 123; } });`,
    `{
      let _constructor, _prototype, _super;
      completion (
        _prototype = {__proto__:#Reflect.get(#Object, "prototype")},
        (
          _super = {
            __proto__: null,
            constructor: #Object,
            prototype: _prototype},
          (
            _constructor = ${generated_constructor("_prototype", "#Object", "qux")},
            (
              #Object.defineProperty(
                _constructor,
                "foo",
                {
                  __proto__: null,
                  value: ${Lang.generate(
                    Visit.visitClosure(
                      Scope.StrictBindingScope(
                        Scope.RootScope()),
                      ParseExternal(`(function () { 123; });`).body[0].expression,
                      {
                        sort: "method",
                        name: Scope.PrimitiveBox("foo"),
                        prototype: Scope.TestBox("_prototype"),
                        super: Scope.TestBox("_super")}))},
                  writable: true,
                  enumerable: false,
                  configurable: true}),
              _constructor)))); }`);
  // Accessor Method //
  test(
    {name:Scope.PrimitiveBox("qux")},
    `(class { get foo () { 123; } });`,
    `{
      let _constructor, _prototype, _super;
      completion (
        _prototype = {__proto__:#Reflect.get(#Object, "prototype")},
        (
          _super = {
            __proto__: null,
            constructor: #Object,
            prototype: _prototype},
          (
            _constructor = ${generated_constructor("_prototype", "#Object", "qux")},
            (
              #Object.defineProperty(
                _prototype,
                "foo",
                {
                  __proto__: null,
                  get: ${Lang.generate(
                    Visit.visitClosure(
                      Scope.StrictBindingScope(
                        Scope.RootScope()),
                      ParseExternal(`(function () { 123; });`).body[0].expression,
                      {
                        sort: "method",
                        name: Scope.PrimitiveBox("foo"),
                        prototype: Scope.TestBox("_prototype"),
                        accessor: "get",
                        super: Scope.TestBox("_super")}))},
                  enumerable: false,
                  configurable: true}),
              _constructor)))); }`);
  // Named Class //
  test(
    {name:Scope.PrimitiveBox("qux")},
    `(class foo {});`,
    `{
      completion (
        (
          arrow () {
            let $foo, _constructor, _prototype, _super;
            $foo = (
              _prototype = {__proto__:#Reflect.get(#Object, "prototype")},
              (
                _super = {
                  __proto__: null,
                  constructor: #Object,
                  prototype: _prototype},
                (
                  _constructor = ${generated_constructor("_prototype", "#Object", "foo")},
                  _constructor)));
            completion $foo; })
        ()); }`);
});

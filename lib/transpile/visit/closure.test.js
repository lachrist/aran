"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const ParseExternal = require("../../parse-external.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Tree = require("../tree.js");
const Query = require("../query");
const ScopeMeta = require("../scope/layer-3-meta.js");
const Scope = require("../scope/index.js");
const Visit = require("./index.js");

Visit._test_init([
  require("./other.js"),
  require("./pattern.js"),
  require("./closure.js"),
  {
    expression: (scope, node, context) => {
      Assert.deepEqual(context, null);
      if (node.type === "Literal") {
        return Tree.PrimitiveExpression(node.value);
      }
      if (node.type === "Identifier") {
        return Scope.makeReadExpression(scope, node.name);
      }
      if (node.type === "CallExpression") {
        Assert.deepEqual(node.callee.type, "Identifier");
        Assert.deepEqual(node.callee.name, "eval");
        Assert.deepEqual(node.arguments.length, 1);
        return Scope.makeEvalExpression(scope, Visit.expression(scope, node.arguments[0], null));
      }
      Assert.fail("Unexpected expression");
    },
    CLOSURE_BODY: (scope, node, context) => (
      Assert.ok(global.Array.isArray(context.bindings)),
      (
        node.type === "BlockStatement" ?
        Scope.makeBodyClosureBlock(
          scope,
          (
            !Scope.isStrict(scope) &&
            ArrayLite.some(node.body, Query._has_direct_eval_call)),
          ArrayLite.flatMap(node.body, Query._get_deep_hoisting),
          (scope) => Tree.BundleStatement(
            [
              Tree.BundleStatement(
                ArrayLite.map(
                  context.bindings,
                  (binding) => Tree.ExpressionStatement(
                    Scope.makeWriteExpression(
                      scope,
                      binding.identifier,
                      Scope.makeOpenExpression(scope, binding.box))))),
              Tree.BundleStatement(
                ArrayLite.map(
                  node.body,
                  (node) => (
                    node.type === "ExpressionStatement" ?
                    Tree.ExpressionStatement(
                      Visit.expression(scope, node.expression, null)) :
                    (
                      (
                        node.type === "VariableDeclaration" &&
                        node.declarations.length === 1 &&
                        node.declarations[0].id.init !== null) ?
                      Visit._pattern(
                        scope,
                        node.declarations[0].id,
                        {
                          kind: node.kind,
                          expression: Visit.expression(scope, node.declarations[0].init, null)}) :
                      Assert.fail(`Unexpected statement node`)))))])) :
        Scope.makeBodyClosureBlock(
          scope,
          (
            !Scope.isStrict(scope) &&
            Query._has_direct_eval_call(node)),
          [],
          (scope) => Tree.ReturnStatement(
            Visit.expression(scope, node, null)))))}]);

const failure = (strict, context, code, error) => Assert.throws(
  () => Visit.closure(
    (
      strict ?
      Scope.StrictBindingScope(
        Scope.RootScope()) :
      Scope.RootScope()),
    ParseExternal(code).body[0].expression,
    context),
  error);

const success = (strict, context, code1, code2) => Lang.match(
  Visit.closure(
    (
      strict ?
      Scope.StrictBindingScope(
        Scope.RootScope()) :
      Scope.RootScope()),
    ParseExternal(code1).body[0].expression,
    context),
  Lang.parseExpression(code2),
  Assert);

const success_block = (strict, context, code1, code2) => Lang.match(
  Scope.makeModuleBlock(
    (
      strict ?
      Scope.StrictBindingScope(
        Scope.RootScope()) :
      Scope.RootScope()),
    [],
    (scope) => Tree.ExpressionStatement(
      Visit.closure(
        scope,
        ParseExternal(code1).body[0].expression,
        context))),
  Lang.parseBlock(code2),
  Assert);

State._run_session({nodes:[], serials:new Map(), scopes:{__proto__:null}}, () => {
  // Other //
  failure(
    false,
    null,
    `123;`,
    new global.Error(`Invalid closure node`));
  // Missmatch //
  failure(
    false,
    {
      sort: "arrow"},
    `(function () {});`,
    new global.Error(`context.sort and node.type missmatch`));
  // Normal asynchronous Function //
  // failure(
  //   false,
  //   null,
  //   `(async function () {});`,
  //   new Throw.AsynchronousClosureAranError(
  //     `Unfortunately, Aran does not yet support asynchronous closures`));
  // Normal generator Function //
  // failure(
  //   false,
  //   null,
  //   `(function* () {});`,
  //   new Throw.GeneratorClosureAranError(
  //     `Unfortunately, Aran does not yet support generator closures`));
  // Normal arrow without name nor super //
  success(
    false,
    {
      sort: null,
      accessor: "get"},
    `(() => 123);`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          arrow () {
            {
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
          value: ("get " + #String("")),
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Normal arrow with use strict //
  success(
    false,
    {
      sort: "arrow",
      name: Scope.PrimitiveBox("NAME")},
    `(() => { "use strict"; eval("qux"); });`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          arrow () {
            {
              "use strict";
              eval("qux"); }
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
          value: "NAME",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Strict arrow with var declaration //
  success(
    true,
    {
      sort: "arrow",
      name: Scope.PrimitiveBox("NAME")},
    `(() => { var x = 123; });`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          arrow () {
            {
              let $$x;
              $$x = void 0;
              $$x = 123; }
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
          value: "NAME",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Strict arrow with rest parameters  //
  success(
    true,
    {
      sort: "arrow",
      name: Scope.PrimitiveBox("NAME")},
    `((x1, x2, ...xs) => { 123; });`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          arrow () {
            let x1, x2, xs;
            x1 = #Reflect.get(#Reflect.get(input, "arguments"), 0);
            x2 = #Reflect.get(#Reflect.get(input, "arguments"), 1);
            xs = #Array.prototype.slice(@#Reflect.get(input, "arguments"), 2);
            {
              123; }
            return void 0;  },
          "length",
          {
            __proto__: null,
            value: 2,
            writable: false,
            enumerable: false,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "NAME",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Strict arrow with expression //
  success(
    true,
    {
      sort: "arrow",
      name: Scope.PrimitiveBox("NAME")},
    `(() => 123);`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
           arrow () {
            {
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
          value: "NAME",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Normal arrow with head eval and body eval //
  success(
    false,
    {
      sort: "arrow",
      name: Scope.PrimitiveBox("NAME")},
    `((x = eval("yolo")) => { eval("swag"); })`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          arrow () {
            let $_head_frame, $$x, $_assignment;
            $_head_frame = {__proto__: null};
            $_assignment = #Reflect.get(#Reflect.get(input, "arguments"), 0);
            $$x = (
              ($_assignment === void 0) ?
              eval("yolo") :
              $_assignment);
            {
              let $_body_frame;
              $_body_frame = {__proto__:null};
              eval("swag"); }
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 1,
            writable: false,
            enumerable: false,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "NAME",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Strict Constructor //
  success(
    true,
    {
      sort: "constructor",
      name: Scope.PrimitiveBox("NAME"),
      super: Scope.PrimitiveBox("SUPER"),
      prototype: Scope.PrimitiveBox("PROTOTYPE")},
    `(function () { 123; });`,
    `
      #Reflect.get(
        #Object.defineProperty(
          "PROTOTYPE",
          "constructor",
          {
            __proto__: null,
            value: #Object.defineProperty(
              #Object.defineProperty(
                #Object.defineProperty(
                  constructor () {
                    let $$super, $$0newtarget, $$arguments, $$this;
                    $$super = "SUPER";
                    $$0newtarget = (
                      #Reflect.get(input, "new.target") ?
                      #Reflect.get(input, "new.target") :
                      throw new #TypeError("Closure must be invoked as a constructor"));
                    $$this = {__proto__:#Reflect.get(#Reflect.get(input, "new.target"), "prototype")};
                    $$arguments = #Object.defineProperty(
                      #Object.defineProperty(
                        #Object.defineProperty(
                          #Object.setPrototypeOf(
                            #Object.assign(
                              {__proto__:null},
                              #Reflect.get(input, "arguments")),
                            #Object.prototype),
                          "length",
                          {
                            __proto__: null,
                            value: #Reflect.get(#Reflect.get(input, "arguments"), "length"),
                            writable: true,
                            enumerable: false,
                            configurable: true}),
                        "callee",
                        {
                          __proto__: null,
                          get: #"Function.prototype.arguments@get",
                          set: #"Function.prototype.arguments@set",
                          enumerable: false,
                          configurable: false}),
                      #Symbol.iterator,
                      {
                        __proto__: null,
                        value: #Array.prototype.values,
                        writable: true,
                        enumerable: false,
                        configurable: true});
                    {
                      123; }
                    return $$this;  },
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
                  value: "NAME",
                  writable: false,
                  enumerable: false,
                  configurable: true}),
              "prototype",
              {
                __proto__: null,
                value: "PROTOTYPE",
                writable: false,
                enumerable: false,
                configurable: false}),
            writable: true,
            enumerable: false,
            configurable: true}),
        "constructor")`);
  // Strict Derived Constructor //
  success(
    true,
    {
      sort: "derived-constructor",
      prototype: Scope.PrimitiveBox("PROTOTYPE"),
      name: Scope.PrimitiveBox("NAME"),
      super: Scope.PrimitiveBox("SUPER")},
    `(function () { 123; });`,
    `#Reflect.get(
      #Object.defineProperty(
        "PROTOTYPE",
        "constructor",
        {
          __proto__: null,
          value: #Object.defineProperty(
            #Object.defineProperty(
              #Object.defineProperty(
                constructor () {
                  let $$super, $$0newtarget,  $$arguments, $$this;
                  $$super = "SUPER";
                  $$0newtarget = (
                    #Reflect.get(input, "new.target") ?
                    #Reflect.get(input, "new.target") :
                    throw new #TypeError("Closure must be invoked as a constructor"));
                  $$this = null;
                  $$arguments = #Object.defineProperty(
                    #Object.defineProperty(
                      #Object.defineProperty(
                        #Object.setPrototypeOf(
                          #Object.assign(
                            {__proto__:null},
                            #Reflect.get(input, "arguments")),
                          #Object.prototype),
                        "length",
                        {
                          __proto__: null,
                          value: #Reflect.get(#Reflect.get(input, "arguments"), "length"),
                          writable: true,
                          enumerable: false,
                          configurable: true}),
                      "callee",
                      {
                        __proto__: null,
                        get: #"Function.prototype.arguments@get",
                        set: #"Function.prototype.arguments@set",
                        enumerable: false,
                        configurable: false}),
                    #Symbol.iterator,
                    {
                      __proto__: null,
                      value: #Array.prototype.values,
                      writable: true,
                      enumerable: false,
                      configurable: true});
                  {
                    123; }
                  return (
                    $$this ?
                    $$this :
                    throw new #ReferenceError("Cannot read variable named 'this' before calling super constructor")); },
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
                value: "NAME",
                writable: false,
                enumerable: false,
                configurable: true}),
            "prototype",
            {
              __proto__: null,
              value: "PROTOTYPE",
              writable: false,
              enumerable: false,
              configurable: false}),
          writable: true,
          enumerable: false,
          configurable: true}),
      "constructor")`);
  // Strict (asynchronous) Generator Function //
  for (const asynchronous of [true, false]) {
    success(
      true,
      {
        sort: "function",
        name: Scope.PrimitiveBox("NAME"),
        super: Scope.PrimitiveBox("SUPER")},
      `(${asynchronous ? "async " : ""}function* () { 123; });`,
      `#Object.defineProperty(
        #Object.defineProperty(
          #Object.defineProperty(
            ${asynchronous ? "async " : ""} function* () {
              let $$0newtarget,  $$arguments, $$this;
              $$0newtarget = #Reflect.get(input, "new.target");
              $$this = (
                #Reflect.get(input, "new.target") ?
                {__proto__: #Reflect.get(
                    #Reflect.get(input, "new.target"),
                    "prototype")} :
                #Reflect.get(input, "this"));
              $$arguments = #Object.defineProperty(
                #Object.defineProperty(
                  #Object.defineProperty(
                    #Object.setPrototypeOf(
                      #Object.assign(
                        {__proto__:null},
                        #Reflect.get(input, "arguments")),
                      #Object.prototype),
                    "length",
                    {
                      __proto__: null,
                      value: #Reflect.get(#Reflect.get(input, "arguments"), "length"),
                      writable: true,
                      enumerable: false,
                      configurable: true}),
                  "callee",
                  {
                    __proto__: null,
                    get: #"Function.prototype.arguments@get",
                    set: #"Function.prototype.arguments@set",
                    enumerable: false,
                    configurable: false}),
                #Symbol.iterator,
                {
                  __proto__: null,
                  value: #Array.prototype.values,
                  writable: true,
                  enumerable: false,
                  configurable: true});
              {
                123; }
              return ($$0newtarget ? $$this : void 0); },
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
            value: "NAME",
            writable: false,
            enumerable: false,
            configurable: true}),
        "prototype",
        {
          __proto__: null,
          value: ${(
            asynchronous ?
            `{__proto__:#aran.asynchronousGeneratorPrototype}` :
            `{__proto__:#aran.generatorPrototype}`)},
          writable: true,
          enumerable: false,
          configurable: false})`); }
  // Strict method with variable initialization and name //
  success(
    true,
    {
      sort: "method",
      super: Scope.PrimitiveBox("SUPER")},
    `(function f (x) { var arguments = 123; var x = 456; 789; });`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          method () {
            let $$super, $$f, $$0newtarget,  $$arguments, $$this, $$x, $_binding_1, $_binding_2;
            $$f = void 0;
            $$super = "SUPER";
            $$0newtarget = void 0;
            $$this = #Reflect.get(input, "this");
            $$f = #Reflect.get(input, "callee");
            $$arguments = #Object.defineProperty(
              #Object.defineProperty(
                #Object.defineProperty(
                  #Object.setPrototypeOf(
                    #Object.assign(
                      {__proto__:null},
                      #Reflect.get(input, "arguments")),
                    #Object.prototype),
                  "length",
                  {
                    __proto__: null,
                    value: #Reflect.get(#Reflect.get(input, "arguments"), "length"),
                    writable: true,
                    enumerable: false,
                    configurable: true}),
                "callee",
                {
                  __proto__: null,
                  get: #"Function.prototype.arguments@get",
                  set: #"Function.prototype.arguments@set",
                  enumerable: false,
                  configurable: false}),
              #Symbol.iterator,
              {
                __proto__: null,
                value: #Array.prototype.values,
                writable: true,
                enumerable: false,
                configurable: true});
            $$x = #Reflect.get(#Reflect.get(input, "arguments"), 0);
            $_binding_1 = $$arguments;
            $_binding_2 = $$x;
            {
              let $$arguments, $$x;
              $$arguments = void 0;
              $$x = void 0;
              $$arguments = $_binding_1;
              $$x = $_binding_2;
              $$arguments = 123;
              $$x = 456;
              789; }
            return void 0; },
          "length",
          {
            __proto__: null,
            value: 1,
            writable: false,
            enumerable: false,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "f",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Non-strict function with duplicate parameters named 'arguments' and without prototype
  success_block(
    false,
    {
      name: Scope.PrimitiveBox("NAME")},
    `(function (arguments, arguments) { 123; });`,
    `{
      let _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        #Reflect.get(
          #Object.defineProperty(
            _prototype,
            "constructor",
            {
              __proto__: null,
              value: #Object.defineProperty(
                #Object.defineProperty(
                  #Object.defineProperty(
                    #Object.defineProperty(
                      #Object.defineProperty(
                        function () {
                          let $$0newtarget, $$this, $$arguments;
                          $$0newtarget = #Reflect.get(input, "new.target");
                          $$this = (
                            #Reflect.get(input, "new.target")  ?
                            {__proto__: #Reflect.get(#Reflect.get(input, "new.target"), "prototype")} :
                            (
                              (
                                (#Reflect.get(input, "this") === null) ?
                                true :
                                (#Reflect.get(input, "this") === void 0)) ?
                              #aran.globalObjectRecord :
                              #Object(#Reflect.get(input, "this"))));
                          $$arguments = #Reflect.get(#Reflect.get(input, "arguments"), 1);
                          {
                            123; }
                          return ($$0newtarget ? $$this : void 0); },
                        "length",
                        {
                          __proto__: null,
                          value: 2,
                          writable: false,
                          enumerable: false,
                          configurable: true}),
                      "name",
                      {
                        __proto__: null,
                        value: "NAME",
                        writable: false,
                        enumerable: false,
                        configurable: true}),
                    "arguments",
                    {
                      __proto__: null,
                      value: null,
                      writable: false,
                      enumerable: false,
                      configurable: false}),
                  "caller",
                  {
                    __proto__: null,
                    value: null,
                    writable: false,
                    enumerable: false,
                    configurable: false}),
                "prototype",
                {
                  __proto__: null,
                  value: _prototype,
                  writable: true,
                  enumerable: false,
                  configurable: false}),
              writable: true,
              enumerable: false,
              configurable: true}),
          "constructor")); }`);
  // Non-strict function //
  success(
    false,
    {
      sort: null,
      prototype: Scope.PrimitiveBox("PROTOTYPE"),
      name: Scope.PrimitiveBox("NAME")},
    `(function (x, x) { 123; });`,
    `
      #Reflect.get(
        #Object.defineProperty(
          "PROTOTYPE",
          "constructor",
          {
            __proto__: null,
            value: #Object.defineProperty(
              #Object.defineProperty(
                #Object.defineProperty(
                  #Object.defineProperty(
                    #Object.defineProperty(
                      function () {
                        let $_marker, $$x, $$0newtarget, $$this, $$arguments, $_length;
                        $$0newtarget = #Reflect.get(input, "new.target");
                        $$this = (
                          #Reflect.get(input, "new.target")  ?
                          {__proto__: #Reflect.get(#Reflect.get(input, "new.target"), "prototype")} :
                          (
                            (
                              (#Reflect.get(input, "this") === null) ?
                              true :
                              (#Reflect.get(input, "this") === void 0)) ?
                            #aran.globalObjectRecord :
                            #Object(#Reflect.get(input, "this"))));
                        $$arguments = #Object.defineProperty(
                          #Object.defineProperty(
                            #Object.defineProperty(
                              #Object.setPrototypeOf(
                                #Object.assign(
                                  {__proto__:null},
                                  #Reflect.get(input, "arguments")),
                                #Object.prototype),
                              "length",
                              {
                                __proto__: null,
                                value: #Reflect.get(#Reflect.get(input, "arguments"), "length"),
                                writable: true,
                                enumerable: false,
                                configurable: true}),
                            "callee",
                            {
                              __proto__: null,
                              value: #Reflect.get(input, "callee"),
                              writable: true,
                              enumerable: false,
                              configurable: true}),
                          #Symbol.iterator,
                          {
                            __proto__: null,
                            value: #Array.prototype.values,
                            writable: true,
                            enumerable: false,
                            configurable: true});
                        $$x = #Reflect.get(#Reflect.get(input, "arguments"), 1);
                        $_marker = {__proto__:null};
                        $_length = #Reflect.get($$arguments, "length");
                        (
                          (1 < $_length) ?
                          #Reflect.set($$arguments, 1, $_marker) :
                          void 0);
                        $$arguments = new #Proxy(
                          $$arguments,
                          {
                            __proto__: null,
                            defineProperty: arrow () {
                              let target, key, new_descriptor, old_descriptor;
                              target = #Reflect.get(#Reflect.get(input, "arguments"), 0);
                              key = #Reflect.get(#Reflect.get(input, "arguments"), 1);
                              new_descriptor = #Reflect.get(#Reflect.get(input, "arguments"), 2);
                              old_descriptor = #Reflect.getOwnPropertyDescriptor(target, key);
                              return #Reflect.defineProperty(
                                target,
                                key,
                                (
                                  (old_descriptor === void 0) ?
                                  new_descriptor :
                                  (
                                    !#Reflect.getOwnPropertyDescriptor(old_descriptor, "value") ?
                                    new_descriptor :
                                    (
                                      (#Reflect.get(old_descriptor, "value") !== $_marker) ?
                                      new_descriptor :
                                      (
                                        #Reflect.getOwnPropertyDescriptor(new_descriptor, "get") ?
                                        new_descriptor :
                                        (
                                          #Reflect.getOwnPropertyDescriptor(new_descriptor, "set") ?
                                          new_descriptor :
                                          (
                                            #Reflect.getOwnPropertyDescriptor(new_descriptor, "value") ?
                                            (
                                              (
                                                (key === "1") ?
                                                $$x = #Reflect.get(new_descriptor, "value") :
                                                (
                                                  (key === "0") ?
                                                  $$x = #Reflect.get(new_descriptor, "value") :
                                                  throw "Arguments link marker out of bounds (defineProperty-write), this should never happen please consider submitting a bug report")),
                                              (
                                                (
                                                  #Reflect.getOwnPropertyDescriptor(new_descriptor, "writable") ?
                                                  #Reflect.get(new_descriptor, "writable") :
                                                  true) ?
                                                {
                                                  __proto__: new_descriptor,
                                                  value: $_marker} :
                                                new_descriptor)) :
                                            (
                                              (
                                                #Reflect.getOwnPropertyDescriptor(new_descriptor, "writable") ?
                                                #Reflect.get(new_descriptor, "writable") :
                                                true) ?
                                              new_descriptor :
                                              {
                                                __proto__: new_descriptor,
                                                value: (
                                                  (key === "1") ?
                                                  $$x :
                                                  (
                                                    (key === "0") ?
                                                    $$x :
                                                    throw "Arguments link marker out of bounds (defineProperty-read), this should never happen please consider submitting a bug report"))})))))))); },
                            getOwnPropertyDescriptor: arrow () {
                              let target, key, descriptor;
                              target = #Reflect.get(#Reflect.get(input, "arguments"), 0);
                              key = #Reflect.get(#Reflect.get(input, "arguments"), 1);
                              descriptor = #Reflect.getOwnPropertyDescriptor(target, key);
                              (
                                (descriptor !== void 0) ?
                                (
                                  #Reflect.getOwnPropertyDescriptor(descriptor, "value") ?
                                  (
                                    (#Reflect.get(descriptor, "value") === $_marker) ?
                                    #Reflect.set(
                                      descriptor,
                                      "value",
                                      (
                                        (key === "1") ?
                                        $$x :
                                        (
                                          (key === "0") ?
                                          $$x :
                                          throw "Arguments link marker out of bounds (getOwnPropertyDescriptor), this should never happen please consider submitting a bug report"))) :
                                    void 0) :
                                  void 0) :
                                void 0);
                              return descriptor; },
                            get: arrow () {
                              let target, key, receiver, value;
                              target = #Reflect.get(#Reflect.get(input, "arguments"), 0);
                              key = #Reflect.get(#Reflect.get(input, "arguments"), 1);
                              receiver = #Reflect.get(#Reflect.get(input, "arguments"), 2);
                              value = #Reflect.get(target, key, receiver);
                              return (
                                (value === $_marker) ?
                                (
                                  (key === "1") ?
                                  $$x :
                                  (
                                    (key === "0") ?
                                    $$x :
                                    throw "Arguments link marker out of bounds (get), this should never happen please consider submitting a bug report")) :
                                value); }});
                        {
                          123; }
                        return ($$0newtarget ? $$this : void 0); },
                      "length",
                      {
                        __proto__: null,
                        value: 2,
                        writable: false,
                        enumerable: false,
                        configurable: true}),
                    "name",
                    {
                      __proto__: null,
                      value: "NAME",
                      writable: false,
                      enumerable: false,
                      configurable: true}),
                  "arguments",
                  {
                    __proto__: null,
                    value: null,
                    writable: false,
                    enumerable: false,
                    configurable: false}),
                "caller",
                {
                  __proto__: null,
                  value: null,
                  writable: false,
                  enumerable: false,
                  configurable: false}),
              "prototype",
              {
                __proto__: null,
                value: "PROTOTYPE",
                writable: true,
                enumerable: false,
                configurable: false}),
            writable: true,
            enumerable: false,
            configurable: true}),
        "constructor")`);

});

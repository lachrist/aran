"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Throw = require("../../throw.js");
const Parse = require("../../parse.js");
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
        return Tree.primitive(node.value);
      }
      if (node.type === "Identifier") {
        return Scope.read(scope, node.name);
      }
      if (node.type === "CallExpression") {
        Assert.deepEqual(node.callee.type, "Identifier");
        Assert.deepEqual(node.callee.name, "eval");
        Assert.deepEqual(node.arguments.length, 1);
        return Scope.eval(scope, Visit.expression(scope, node.arguments[0], null));
      }
      Assert.fail("Unexpected expression");
    },
    CLOSURE_BODY: (scope, node, context) => (
      Assert.ok(global.Array.isArray(context.bindings)),
      (
        node.type === "BlockStatement" ?
        Scope.CLOSURE_BODY(
          scope,
          (
            !Scope._is_strict(scope) &&
            Query._has_direct_eval_call(node.body)),
          Query._get_deep_hoisting(node),
          (scope) => Tree.Bundle(
            [
              Tree.Bundle(
                ArrayLite.map(
                  context.bindings,
                  (binding) => Tree.Lift(
                    Scope.write(
                      scope,
                      binding.identifier,
                      Scope.get(scope, binding.box))))),
              Tree.Bundle(
                ArrayLite.map(
                  node.body,
                  (node) => (
                    node.type === "ExpressionStatement" ?
                    Tree.Lift(
                      Visit.expression(scope, node.expression, null)) :
                    (
                      (
                        node.type === "VariableDeclaration" &&
                        node.declarations.length === 1 &&
                        node.declarations[0].id.init !== null) ?
                      Tree.Lift(
                        Visit.pattern(
                          scope,
                          node.declarations[0].id,
                          {
                            kind: node.kind,
                            expression: Visit.expression(scope, node.declarations[0].init, null)})) :
                      Assert.fail(`Unexpected statement node`)))))])) :
        Scope.CLOSURE_BODY(
          scope,
          (
            !Scope._is_strict(scope) &&
            Query._has_direct_eval_call([node])),
          [],
          (scope) => Tree.Return(
            Visit.expression(scope, node, null)))))}]);

const failure = (strict, context, code, error) => Assert.throws(
  () => Visit.closure(
    (
      strict ?
      Scope._use_strict(
        Scope._make_root()) :
      Scope._make_root()),
    Parse.script(code).body[0].expression,
    context),
  error);

const success = (strict, context, code1, code2) => Lang._match_expression(
  Visit.closure(
    (
      strict ?
      Scope._use_strict(
        Scope._make_root()) :
      Scope._make_root()),
    Parse.script(code1).body[0].expression,
    context),
  Lang.parse_expression(code2),
  Assert);

const success_block = (strict, context, code1, code2) => Lang._match_block(
  Scope.MODULE(
    (
      strict ?
      Scope._use_strict(
        Scope._make_root()) :
      Scope._make_root()),
    [],
    (scope) => Tree.Lift(
      Visit.closure(
        scope,
        Parse.script(code1).body[0].expression,
        context))),
  Lang.PARSE_BLOCK(code2),
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
  failure(
    false,
    null,
    `(async function () {});`,
    new Throw.MissingFeatureAranError(
      `Unfortunately, Aran does not yet support asynchronous closures`,
      "asynchronous-closure"));
  // Normal generator Function //
  failure(
    false,
    null,
    `(function* () {});`,
    new Throw.MissingFeatureAranError(
      `Unfortunately, Aran does not yet support generator closures`,
      "generator-closure"));
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
          () => {
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
          value: ("get " + ""),
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Normal arrow with use strict //
  success(
    false,
    {
      sort: "arrow",
      name: Scope._primitive_box("foo"),
      super: Scope._primitive_box("bar"),
      self: Scope._primitive_box("qux")},
    `(() => { "use strict"; eval("qux"); });`,
    `
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
            writable: false,
            enumerable: false,
            configurable: true}),
        "name",
        {
          __proto__: null,
          value: "foo",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Strict arrow with var declaration //
  success(
    true,
    {
      sort: "arrow",
      name: Scope._primitive_box("foo"),
      super: Scope._primitive_box("bar"),
      self: Scope._primitive_box("qux")},
    `(() => { var x = 123; });`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
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
          value: "foo",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Strict arrow with rest parameters  //
  success(
    true,
    {
      sort: "arrow",
      name: Scope._primitive_box("foo"),
      super: Scope._primitive_box("bar"),
      self: Scope._primitive_box("qux")},
    `((x1, x2, ...xs) => { 123; });`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            let x1, x2, xs;
            x1 = #Reflect.get(arguments, 0);
            x2 = #Reflect.get(arguments, 1);
            xs = #Array.prototype.slice(@arguments, 2);
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
          value: "foo",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Strict arrow with expression //
  success(
    true,
    {
      sort: "arrow",
      name: Scope._primitive_box("foo"),
      super: Scope._primitive_box("bar"),
      self: Scope._primitive_box("qux")},
    `(() => 123);`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
           () => {
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
          value: "foo",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Normal arrow with head eval and body eval //
  success(
    false,
    {
      sort: "arrow",
      name: Scope._primitive_box("foo"),
      super: Scope._primitive_box("bar"),
      self: Scope._primitive_box("qux")},
    `((x = eval("yolo")) => { eval("swag"); })`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          () => {
            let $_head_frame, $$x, $_assignment;
            $_head_frame = {__proto__: null};
            (
              $_assignment = #Reflect.get(arguments, 0),
              $$x = (
                ($_assignment === void 0) ?
                eval("yolo") :
                $_assignment));
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
          value: "foo",
          writable: false,
          enumerable: false,
          configurable: true})`);
  // Strict Constructor //
  success(
    true,
    {
      sort: "constructor",
      name: Scope._primitive_box("foo"),
      self: Scope._primitive_box("qux"),
      prototype: Scope._primitive_box("taz")},
    `(function () { 123; });`,
    `
      #Reflect.get(
        #Object.defineProperty(
          "taz",
          "constructor",
          {
            __proto__: null,
            value: #Object.defineProperty(
              #Object.defineProperty(
                #Object.defineProperty(
                  constructor () {
                    let $$0newtarget, $$arguments, $$this;
                    $$arguments = void 0;
                    $$0newtarget = (
                      new.target ?
                      new.target :
                      throw new #TypeError("Closure must be invoked as a constructor"));
                    $$this = {__proto__:#Reflect.get(new.target, "prototype")};
                    $$arguments = #Object.assign(
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
                  value: "foo",
                  writable: false,
                  enumerable: false,
                  configurable: true}),
              "prototype",
              {
                __proto__: null,
                value: "taz",
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
      sort: "constructor",
      prototype: Scope._primitive_box("taz"),
      name: Scope._primitive_box("foo"),
      super: Scope._primitive_box("bar"),
      self: Scope._primitive_box("qux")},
    `(function () { 123; });`,
    `#Reflect.get(
      #Object.defineProperty(
        "taz",
        "constructor",
        {
          __proto__: null,
          value: #Object.defineProperty(
            #Object.defineProperty(
              #Object.defineProperty(
                constructor () {
                  let $$0newtarget,  $$arguments, $$this;
                  $$arguments = void 0;
                  $$0newtarget = (
                    new.target ?
                    new.target :
                    throw new #TypeError("Closure must be invoked as a constructor"));
                  $$this = null;
                  $$arguments = #Object.assign(
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
                    123; }
                  return (
                    $$this ?
                    $$this :
                    throw new #ReferenceError("Super constructor must be called before returning from closure")); },
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
            "prototype",
            {
              __proto__: null,
              value: "taz",
              writable: false,
              enumerable: false,
              configurable: false}),
          writable: true,
          enumerable: false,
          configurable: true}),
      "constructor")`);
  // Strict method with variable initialization and name //
  success(
    true,
    {
      sort: "method"},
    `(function f (x) { var arguments = 123; var x = 456; 789; });`,
    `
      #Object.defineProperty(
        #Object.defineProperty(
          method () {
            let $$f, $$0newtarget,  $$arguments, $$this, $$x, $_binding_1, $_binding_2;
            $$f = void 0;
            $$arguments = void 0;
            $$f = callee;
            $$0newtarget = void 0;
            $$this = this;
            $$arguments = #Object.assign(
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
            $$x = #Reflect.get(arguments, 0);
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
      name: Scope._primitive_box("foo"),
      super: Scope._primitive_box("bar"),
      self: Scope._primitive_box("qux")},
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
                          $$0newtarget = new.target;
                          $$this = (
                            new.target  ?
                            {__proto__: #Reflect.get(new.target, "prototype")} :
                            (
                              (
                                (this === null) ?
                                true :
                                (this === void 0)) ?
                              #aran.globalObjectRecord :
                              #Object(this)));
                          $$arguments = #Reflect.get(arguments, 1);
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
                        value: "foo",
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
      prototype: Scope._primitive_box("taz"),
      name: Scope._primitive_box("foo"),
      super: Scope._primitive_box("bar"),
      self: Scope._primitive_box("qux")},
    `(function (x) { 123; });`,
    `
      #Reflect.get(
        #Object.defineProperty(
          "taz",
          "constructor",
          {
            __proto__: null,
            value: #Object.defineProperty(
              #Object.defineProperty(
                #Object.defineProperty(
                  #Object.defineProperty(
                    #Object.defineProperty(
                      function () {
                        let $_marker, $$x, $$0newtarget, $$this, $$arguments;
                        $$arguments = void 0;
                        $$0newtarget = new.target;
                        $$this = (
                          new.target  ?
                          {__proto__: #Reflect.get(new.target, "prototype")} :
                          (
                            (
                              (this === null) ?
                              true :
                              (this === void 0)) ?
                            #aran.globalObjectRecord :
                            #Object(this)));
                        $$arguments = #Object.assign(
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
                                value: callee,
                                writable: true,
                                enumerable: false,
                                configurable: true}),
                            #Symbol.iterator,
                            {
                              __proto__: null,
                              value: #Array.prototype.values,
                              writable: true,
                              enumerable: false,
                              configurable: true}),
                          arguments);
                        $$x = #Reflect.get(arguments, 0);
                        $$arguments = (
                          $_marker = {__proto__:null},
                          new #Proxy(
                            #Array.prototype.fill(
                              @$$arguments,
                              $_marker,
                              0,
                              #Reflect.get(arguments, "length")),
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
                                      $_marker) ?
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
                                      $$x = #Reflect.get(descriptor, "value") :
                                      throw "This should never happen, please contact the dev"),
                                    true) :
                                  #Reflect.defineProperty(target, key, descriptor)); },
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
                                      $_marker) :
                                    false) ?
                                  #Reflect.set(
                                    descriptor,
                                    "value",
                                    (
                                      (key === "0") ?
                                      $$x :
                                      throw "This should never happen, please contact the dev")) :
                                  void 0);
                                return descriptor; },
                              get: () => {
                                let target, key, receiver, value;
                                target = #Reflect.get(arguments, 0);
                                key = #Reflect.get(arguments, 1);
                                receiver = #Reflect.get(arguments, 2);
                                value = #Reflect.get(target, key, receiver);
                                return (
                                  (value === $_marker) ?
                                  (
                                    (key === "0") ?
                                    $$x :
                                    throw "This should never happen, please contact the dev") :
                                  value); }}));
                        {
                          123; }
                        return ($$0newtarget ? $$this : void 0); },
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
                      value: "foo",
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
                value: "taz",
                writable: true,
                enumerable: false,
                configurable: false}),
            writable: true,
            enumerable: false,
            configurable: true}),
        "constructor")`);

});

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

require("../tree.js")._toggle_debug_mode();
const Acorn = require("acorn");
const Closure = require("./closure.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Completion = require("../completion.js");
const Tree = require("../tree.js");

const Block = {
  CLOSURE: (scope, statements, completion) => Scope.EXTEND_STATIC(
    scope,
    {
      __proto__: null},
    (scope) => Tree.Bundle(
      statements.map(
        (statement) => Statement.Visit(scope, statement))))};

const Statement = {
  Visit: (scope, statement) => {
    if (statement.type === "ExpressionStatement") {
      return Tree.Lift(Expression.visit(scope, statement.expression));
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
    if (expression.type === "ThisExpression") {
      return Scope.read(scope, "this");
    }
    if (expression.type === "MetaProperty") {
      return Scope.read(scope, "new.target");
    }
    if (expression.type === "SequenceExpression") {
      Assert.deepEqual(expression.expressions.length, 2);
      return Tree.sequence(
        Expression.visit(scope, expression.expressions[0]),
        Expression.visit(scope, expression.expressions[1]));
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

Closure._resolve_circular_dependencies(Expression, Block);

const failure = (key, code, message) => Assert.throws(
  () => Closure[key](
    Scope._make_root(),
    Acorn.parse(code).body[0].expression,
    null),
  new Error(message));

const success = (kind, strict, name, code1, code2) => Lang._match_block(
  Scope.EXTEND_STATIC(
    (
      strict ?
      Scope._extend_use_strict(
        Scope._make_root()) :
      Scope._make_root()),
    {__proto__:null},
    (scope) => (
      name === null ?
      Tree.Lift(
        Closure[kind](
          scope,
          Acorn.parse(code1).body[0].expression,
          null)) :
      Scope.Box(
        scope,
        "name",
        false,
        Tree.primitive(name),
        (box) => Tree.Lift(
          Closure[kind](
            scope,
            Acorn.parse(code1).body[0].expression,
            box))))),
  Lang.PARSE_BLOCK(code2),
  Assert);

const define_name = (code, name) => `#Object.defineProperty(
  ${code},
  "name",
  {
    __proto__: null,
    value: ${JSON.stringify(name)},
    configurable: true})`;

const define_length = (code, length) => `#Object.defineProperty(
  ${code},
  "length",
  {
    __proto__: null,
    value: ${String(length)},
    configurable: true})`;

const define_arguments = (code) => `#Object.defineProperty(
  ${code},
  "arguments",
  {
    __proto__: null,
    value: null})`

const define_caller = (code) => `#Object.defineProperty(
  ${code},
  "caller",
  {
    __proto__: null,
    value: null})`;

State._run_session({nodes:[], serials:new Map(), evals:{__proto__:null}}, [], () => {
  // Arrow //
  {
    const finalize = (code) => `{${code};}`;
    // Asynchronous //
    failure(
      "arrow",
      `(async () => {});`,
      "Unfortunately, Aran does not yet support asynchronous arrows.");
    // Regular //
    success(
      "arrow",
      false,
      "foo",
      `((x1, x2) => { 123; });`,
      finalize(
        define_name(
          define_length(
            `() => {
              let x1, x2;
              x1 = #Reflect.get(ARGUMENTS, 0);
              x2 = #Reflect.get(ARGUMENTS, 1);
              { 123; }
              return void 0; }`,
            2),
          "foo")));
    // RestElement + ExpressionBody //
    success(
      "arrow",
      false,
      "foo",
      `((x1, x2, ...xs) => 123);`,
      finalize(
        define_name(
          define_length(
            `() => {
              let x1, x2, xs;
              x1 = #Reflect.get(ARGUMENTS, 0);
              x2 = #Reflect.get(ARGUMENTS, 1);
              xs = #Array.prototype.slice(@ARGUMENTS, 2);
              return 123;}`,
            2),
          "foo")));
    // Anonymous //
    success(
      "arrow",
      false,
      null,
      `(() => 123);`,
      finalize(
        define_name(
          define_length(
            `() => {
              return 123; }`,
            0),
          "")));
    // Eval Normal //
    success(
      "arrow",
      false,
      "foo",
      `(() => (eval("var x = 123;"), x));`,
      finalize(
        define_name(
          define_length(
            `() => {
              let _frame;
              _frame = {__proto__:null};
              return (
                eval(§_frame, "var x = 123;"),
                (
                  #Reflect.has(_frame, "x") ?
                  #Reflect.get(_frame, "x") :
                  (
                    #Reflect.has(#global, "x") ?
                    #Reflect.get(#global, "x") :
                    throw new #ReferenceError("x is not defined"))));}`,
            0),
          "foo")));
    // Eval Strict //
    success(
      "arrow",
      true,
      "foo",
      `(() => eval("bar"));`,
      finalize(
        define_name(
          define_length(
            `() => {
              return eval("bar");}`,
            0),
          "foo")));
    // Eval Use Strict //
    success(
      "arrow",
      false,
      "foo",
      `(() => { "use strict"; eval("bar"); });`,
      finalize(
        define_name(
          define_length(
            `() => {
              {
                "use strict";
                eval("bar");}
              return void 0;}`,
            0),
          "foo")));
  }
  // Function //
  {
    const finalize = (code, name = "f") => `{
      let ${name};
      (
        ${name} = null,
        (
          ${name} = ${code},
          (
            #Reflect.set(
              ${name},
              "prototype",
              #Object.defineProperty(
                {
                  __proto__: #Object.prototype},
                "constructor",
                {
                  __proto__: null,
                  value: ${name},
                  writable: true,
                  configurable: true})),
            ${name})));}`;
    // Asynchronous //
    failure(
      "function",
      `(async function () {});`,
      "Unfortunately, Aran does not yet support asynchronous functions.");
    // Generator //
    failure(
      "function",
      `(function* () {});`,
      "Unfortunately, Aran does not yet support generator functions.");
    // Regular Strict //
    success(
      "function",
      true,
      "foo",
      `(function () { 123; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              {
                123;}
              return (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                void 0);}`,
            0),
        "foo")));
    // Regular Use Strict //
    success(
      "function",
      false,
      "foo",
      `(function () { "use strict"; 123; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              {
                "use strict";
                123;}
              return (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                void 0);}`,
            0),
        "foo")));
    // Regular Normal //
    success(
      "function",
      false,
      "foo",
      `(function () { 123; });`,
      finalize(
        define_caller(
          define_arguments(
            define_name(
              define_length(
                `function () {
                  {
                    123;}
                  return (
                    NEW_TARGET ?
                    {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                    void 0);}`,
                0),
            "foo")))));
    // Named //
    success(
      "function",
      true,
      "foo",
      `(function bar () { 123; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              {
                123;}
              return (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                void 0);}`,
          0),
        "bar")));
    // Anonymous //
    success(
      "function",
      true,
      null,
      `(function () { 123; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              {
                123;}
              return (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                void 0);}`,
          0),
        "")));
    // Rest //
    success(
      "function",
      true,
      "foo",
      `(function (x1, x2, ...xs) { 123; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              let x1, x2, xs;
              x1 = #Reflect.get(ARGUMENTS, 0);
              x2 = #Reflect.get(ARGUMENTS, 1);
              xs = #Array.prototype.slice(@ARGUMENTS, 2);
              {
                123;}
              return (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                void 0);}`,
          2),
        "foo")));
    // NewTarget //
    success(
      "function",
      true,
      "foo",
      `(function () { new.target; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              let new_target;
              new_target = NEW_TARGET;
              {
                new_target;}
              return (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                void 0);}`,
            0),
          "foo")));
    // Callee //
    success(
      "function",
      true,
      "foo",
      `(function bar () { bar; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              let bar;
              bar = f;
              {
                bar;}
              return (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                void 0);}`,
            0),
          "bar"),
        "f"));
    // This Strict //
    success(
      "function",
      true,
      "foo",
      `(function () { this; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              let _this;
              _this = (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                THIS);
              {
                _this;}
              return (
                NEW_TARGET ?
                _this :
                void 0);}`,
            0),
          "foo")));
    // This Normal //
    success(
      "function",
      false,
      "foo",
      `(function () { this; });`,
      finalize(
        define_caller(
          define_arguments(
            define_name(
              define_length(
                `function () {
                  let _this;
                  _this = (
                    NEW_TARGET ?
                    {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                    (
                      (THIS === null) ?
                      #global :
                      (
                        (THIS === void 0) ?
                        #global :
                        #Object(THIS))));
                  {
                    _this;}
                  return (
                    NEW_TARGET ?
                    _this :
                    void 0);}`,
                0),
              "foo")))));
    // Arguments Strict //
    success(
      "function",
      true,
      "foo",
      `(function () { arguments; });`,
      finalize(
        define_name(
          define_length(
            `function () {
              let _arguments;
              _arguments = #Object.defineProperty(
                #Object.defineProperty(
                  #Object.defineProperty(
                    #Object.assign({__proto__:#Object.prototype}, ARGUMENTS),
                    "length",
                    {
                      __proto__: null,
                      value: #Reflect.get(ARGUMENTS, "length"),
                      writable: true,
                      configurable: true}),
                  "callee",
                  {
                    __proto__: null,
                    get: #Function.prototype.arguments.__get__,
                    set: #Function.prototype.arguments.__set__}),
                #Symbol.iterator,
                {
                  __proto__: null,
                  value: #Array.prototype.values,
                  writable: true,
                  configurable: true});
              {
                _arguments;}
              return (
                NEW_TARGET ?
                {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                void 0);}`,
            0),
          "foo")));
    // Arguments Normal & Non Id Param //
    success(
      "function",
      false,
      "foo",
      `(function (...xs) { arguments; });`,
      finalize(
        define_caller(
          define_arguments(
            define_name(
              define_length(
                `function () {
                  let xs, _arguments;
                  xs = #Array.prototype.slice(@ARGUMENTS, 0);
                  _arguments = #Object.defineProperty(
                    #Object.defineProperty(
                      #Object.defineProperty(
                        #Object.assign(
                          {__proto__:#Object.prototype},
                          ARGUMENTS),
                        "length",
                        {
                          __proto__: null,
                          value: #Reflect.get(ARGUMENTS, "length"),
                          writable: true,
                          configurable: true}),
                      "callee",
                      {
                        __proto__: null,
                        value: f,
                        writable: true,
                        configurable: true}),
                    #Symbol.iterator,
                    {
                      __proto__: null,
                      value: #Array.prototype.values,
                      writable: true,
                      configurable: true});
                  {
                    _arguments;}
                  return (
                    NEW_TARGET ?
                    {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                    void 0);}`,
                0),
              "foo")))));
    // Arguments Normal & Id Param //
    success(
      "function",
      false,
      "foo",
      `(function (x) { arguments; });`,
      finalize(
        define_caller(
          define_arguments(
          define_name(
            define_length(
              `function () {
                let marker, _arguments, x;
                x = #Reflect.get(ARGUMENTS, 0);
                _arguments = (
                  marker = {__proto__:null},
                  new #Proxy(
                    #Array.prototype.fill(
                      @#Object.defineProperty(
                        #Object.defineProperty(
                          #Object.defineProperty(
                            #Object.assign(
                              {__proto__:#Object.prototype},
                              ARGUMENTS),
                            "length",
                            {
                              __proto__: null,
                              value: #Reflect.get(ARGUMENTS, "length"),
                              writable: true,
                              configurable: true}),
                          "callee",
                          {
                            __proto__: null,
                            value: f,
                            writable: true,
                            configurable: true}),
                        #Symbol.iterator,
                        {
                          __proto__: null,
                          value: #Array.prototype.values,
                          writable: true,
                          configurable: true}),
                      marker),
                    {
                      __proto__: null,
                      defineProperty: () => {
                        let target, key, descriptor;
                        target = #Reflect.get(ARGUMENTS, 0);
                        key = #Reflect.get(ARGUMENTS, 1);
                        descriptor = #Reflect.get(ARGUMENTS, 2);
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
                        target = #Reflect.get(ARGUMENTS, 0);
                        key = #Reflect.get(ARGUMENTS, 1);
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
                        target = #Reflect.get(ARGUMENTS, 0);
                        key = #Reflect.get(ARGUMENTS, 1);
                        receiver = #Reflect.get(ARGUMENTS, 2);
                        value = #Reflect.get(target, key, receiver);
                        return (
                          (value === marker) ?
                          (
                            (key === "0") ?
                            x :
                            throw "This should never happen, please contact the dev") :
                          value);}}));
                {
                  _arguments;}
                return (
                  NEW_TARGET ?
                  {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                  void 0);}`,
              1),
            "foo")))));
    // Eval Normal //
    success(
      "function",
      false,
      "foo",
      `(function (...xs) { eval("var x = 123;"); x; });`,
      finalize(
        define_caller(
          define_arguments(
            define_name(
              define_length(
                `function () {
                  let xs, _new_target, _this, _arguments, _frame;
                  _new_target = NEW_TARGET;
                  _this = (
                    NEW_TARGET ?
                    {__proto__: #Reflect.get(NEW_TARGET, "prototype")} :
                    (
                      (THIS === null) ?
                      #global :
                      (
                        (THIS === void 0) ?
                        #global :
                        #Object(THIS))));
                  xs = #Array.prototype.slice(@ARGUMENTS, 0);
                  _arguments = #Object.defineProperty(
                    #Object.defineProperty(
                      #Object.defineProperty(
                        #Object.assign(
                          {__proto__:#Object.prototype},
                          ARGUMENTS),
                        "length",
                        {
                          __proto__: null,
                          value: #Reflect.get(ARGUMENTS, "length"),
                          writable: true,
                          configurable: true}),
                      "callee",
                      {
                        __proto__: null,
                        value: f,
                        writable: true,
                        configurable: true}),
                    #Symbol.iterator,
                    {
                      __proto__: null,
                      value: #Array.prototype.values,
                      writable: true,
                      configurable: true});
                  _frame = {__proto__:null};
                  {
                    eval(§_this, §_new_target, §_arguments, §xs, §_frame, §f, "var x = 123;");
                    (
                      #Reflect.has(_frame, "x") ?
                      #Reflect.get(_frame, "x") :
                      (
                        #Reflect.has(#global, "x") ?
                        #Reflect.get(#global, "x") :
                        throw new #ReferenceError("x is not defined")));}
                  return (NEW_TARGET ? _this : void 0);}`,
                0),
              "foo")))));
  }
  // Class //
  {
    failure(
      "class",
      `(class {});`,
      "Unfortunately, Aran does not yet support classes.");
  }
});

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
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
      ecmaVersion: 2020}).body[0] :
  code);

State._run_session({nodes: [], serials: new Map(), evals: {__proto__:null}}, [], () => {

  const COMPLETION = "__completion__";
  const base = (identifier) => (
    identifier === "new.target" ?
    "$0newtarget" :
    "$" + identifier);
  const meta = (identifier) => "_" + identifier;

  const test = (strict, base_identifier_array_1, base_identifier_array_2, code1, completion, labels) => Scope.EXTEND_STATIC(
    (
      strict ?
      Scope._extend_use_strict(
        Scope._make_root()) :
      Scope._make_root()),
    ArrayLite.reduce(
      ArrayLite.concat(base_identifier_array_1, base_identifier_array_2),
      (hoisting, identifier) => (
        hoisting[identifier] = true,
        hoisting),
      {__proto__:null}),
    (scope) => Scope.Box(
      scope,
      "completion",
      true,
      Tree.primitive(void 0),
      (box) => Tree.Bundle(
        ArrayLite.concat(
          ArrayLite.map(
            base_identifier_array_1,
            (identifier) => Tree.Lift(
              Scope.initialize(
                scope,
                identifier,
                Tree.primitive(void 0)))),
          [
            Statement.Visit(
              scope,
              parse(code1),
              (
                typeof completion === "function" ?
                completion(box) :
                completion),
              labels)]))));
  const success = (strict, base_identifier_array_1, base_identifier_array_2, code1, completion, labels, meta_identifier_array, code2) => Lang._match_block(
    test(strict, base_identifier_array_1, base_identifier_array_2, code1, completion, labels),
    Lang.PARSE_BLOCK(`{
      let ${ArrayLite.join(
        ArrayLite.concat(
          [COMPLETION],
          ArrayLite.map(base_identifier_array_1, base),
          ArrayLite.map(base_identifier_array_2, base),
          ArrayLite.map(meta_identifier_array, meta)),
        ", ")};
      ${COMPLETION} = void 0;
      ${ArrayLite.join(
        ArrayLite.map(
          base_identifier_array_1,
          (identifier) => `${base(identifier)} = void 0;\n`),
        "")}${code2}}`),
    Assert);
  const failure = (strict, base_identifier_array_1, base_identifier_array_2, code1, completion, labels, message) => Assert.throws(
    () => test(strict, base_identifier_array_1, base_identifier_array_2, code1, completion, labels),
    new Error(message));
  // EmptyStatement //
  success(
    true,
    [],
    [],
    `;`,
    Completion._make_program(null),
    [],
    [],
    ``);
  // DebuggerStatement
  success(
    true,
    [],
    [],
    `debugger;`,
    Completion._make_program(null),
    [],
    [],
    `debugger;`);
  // ExpressionStatement //
  success(
    true,
    ["x"],
    [],
    `
      x++;`,
    Completion._make_program,
    [],
    ["result"],
    `${COMPLETION} = (
      ${meta("result")} = ${base("x")},
      (
        ${base("x")} = (_result + 1),
        _result));`);
  success(
    true,
    ["x"],
    [],
    `x++;`,
    Completion._make_program(null),
    [],
    [],
    `${base("x")} = (${base("x")} + 1);`);
  // BreakStatement //
  success(
    true,
    [],
    [],
    {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    Completion._make_program(null),
    [],
    [],
    `break foo;`);
  success(
    true,
    [],
    [],
    {
      type: "BreakStatement",
      label: null},
    Completion._make_program(null),
    [null],
    [],
    ``);
  // ContinueStatement //
  success(
    true,
    [],
    [],
    {
      type: "ContinueStatement",
      label: {
        type: "Identifier",
        name: "foo"}},
    Completion._make_program(null),
    [],
    [],
    `continue foo;`);
  failure(
    true,
    [],
    [],
    {
      type: "ContinueStatement",
      label: null},
    Completion._make_program(null),
    [null],
    "Break label used as continue label");
  // ThrowStatement //
  success(
    true,
    [],
    [],
    `throw 123;`,
    Completion._make_program(null),
    [],
    [],
    `throw 123;`);
  // ReturnStatement >> Completion._program //
  failure(
    true,
    [],
    [],
    {
      type: "ReturnStatement",
      argument: null},
    Completion._make_program(null),
    [],
    "Unexpected program completion");
  failure(
    true,
    [],
    [],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    Completion._make_program(null),
    [],
    "Unexpected program completion");
  // ReturnStatement >> Completion._arrow && Completion._method && Completion._accessor //
  success(
    true,
    [],
    [],
    {
      type: "ReturnStatement",
      argument: null},
    Completion._accessor,
    [],
    [],
    `return void 0;`);
  success(
    true,
    [],
    [],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    Completion._accessor,
    [],
    [],
    `return 123;`);
  // ReturnStatement >> Completion._function
  success(
    true,
    ["new.target", "this"],
    [],
    {
      type: "ReturnStatement",
      argument: null},
    Completion._function,
    [],
    [],
    `return (
      ${base("new.target")} ?
      ${base("this")} :
      void 0);`);
  success(
    true,
    ["new.target", "this"],
    [],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    Completion._function,
    [],
    [],
    `return (
      ${base("new.target")} ?
      (
        (
          (typeof 123 === "object") ?
          123 :
          (typeof 123 === "function")) ?
        123 :
        ${base("this")}) :
      123);`);
  // ReturnStatement >> Completion._constructor
  success(
    true,
    ["this"],
    [],
    {
      type: "ReturnStatement",
      argument: null},
    Completion._constructor,
    [],
    [],
    `return ${base("this")};`);
  success(
    true,
    ["this"],
    [],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    Completion._constructor,
    [],
    [],
    `return (
      (
        (typeof 123 === "object") ?
        123 :
        (typeof 123 === "function")) ?
      123 :
      ${base("this")});`);
  // ReturnStatement >> Completion._derived_constructor
  success(
    true,
    ["this"],
    [],
    {
      type: "ReturnStatement",
      argument: null},
    Completion._derived_constructor,
    [],
    [],
    `return (
      ${base("this")} ?
      ${base("this")} :
      throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"));`);
  success(
    true,
    ["this"],
    [],
    {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: 123}},
    Completion._derived_constructor,
    [],
    [],
    `return (
      (
        (typeof 123 === "object") ?
        123 :
        (typeof 123 === "function")) ?
      123 :
      (
        (123 === void 0) ?
        (
          ${base("this")} ?
          ${base("this")} :
          throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
        throw new #TypeError("Derived constructors may only return object or undefined")));`);
  // VariableDeclaration //
  success(
    true,
    [],
    ["x", "y", "z", "t"],
    `let x = () => { 123; }, {y, z} = 456, t;`,
    Completion._make_program(null),
    [],
    [],
    `
      ${base("x")} = #Object.defineProperty(
        #Object.defineProperty(
          method () {
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
          value: "x",
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
            ${base("y")} = #Reflect.get(
              #Object(456),
              "y")),
          ${base("z")} = #Reflect.get(
            #Object(456),
            "z")));
      ${base("t")} = void 0;`);
  // FunctionDeclaration //
  success(
    true,
    ["f"],
    [],
    `function f () { 123; }`,
    Completion._make_program(null),
    [],
    ["callee", "constructor"],
    `${base("f")} = (
      ${meta("callee")} = void 0,
      (
        ${meta("callee")} = (
          ${meta("constructor")} = #Object.defineProperty(
            #Object.defineProperty(
              function () {
                let ${base("f")}, ${base("new.target")}, ${base("this")}, ${base("arguments")};
                ${base("f")} = ${meta("callee")};
                ${base("new.target")} = NEW_TARGET;
                ${base("this")} = (
                  NEW_TARGET ?
                  #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET) :
                  THIS);
                ${base("arguments")} = #Object.assign(
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
                  123; }
                return (${base("new.target")} ? ${base("this")} : void 0);},
              "length",
              {
                __proto__: null,
                value: 0,
                configurable: true}),
            "name",
            {
              __proto__: null,
              value: "f",
              configurable: true}),
          #Object.defineProperty(
            ${meta("constructor")},
            "prototype",
            {
              __proto__: null,
              value: #Object.create(
                #Object.prototype,
                {
                  __proto__: null,
                  constructor: {
                    __proto__: null,
                    value: ${meta("constructor")},
                    writable: true,
                    configurable: true}}),
              writable: true})),
        ${meta("callee")}));`);
  // ClassDeclaration //
  success(
    true,
    [],
    ["c"],
    `class c {}`,
    Completion._make_program(null),
    [],
    [],
    `
      ${base("c")} = (
        () => {
          let ${base("c")}, ${meta("constructor")};
          ${base("c")} = (
            ${meta("constructor")} = #Object.defineProperty(
              #Object.defineProperty(
                function () {
                  return (
                    NEW_TARGET ?
                    #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET) :
                    throw new #TypeError("Class constructor cannot be invoked without 'new'"));},
                "length",
                {
                  __proto__: null,
                  ["value"]: 0,
                  ["configurable"]: true}),
              "name",
              {
                __proto__: null,
                ["value"]: "c",
                ["configurable"]: true}),
            #Object.defineProperty(
              ${meta("constructor")},
              "prototype",
              {
                __proto__: null,
                ["value"]: #Object.create(
                  #Object.prototype,
                  {
                    __proto__: null,
                    ["constructor"]: {
                      __proto__: null,
                      ["value"]: ${meta("constructor")},
                      ["writable"]: true,
                      ["configurable"]: true}}),
                ["writable"]: true}));
          return ${base("c")};}
        ());`);
  // BlockStatement //
  test(
    true,
    ["f"],
    [],
    `{
      123;
      let x = 456;
      function f () { 789; }}`,
    Completion._make_program,
    [],
    [],
    `{
      let ${base("x")};
      ${base("f")} = (
        ${meta("callee")} = void 0,
        (
          ${meta("callee")} = (
            ${meta("constructor")} = #Object.defineProperty(
              #Object.defineProperty(
                function () {
                  let ${base("f")}, ${base("new.target")}, ${base("this")}, ${base("arguments")};
                  ${base("f")} = ${meta("callee")};
                  ${base("new.target")} = NEW_TARGET;
                  ${base("this")} = (
                    NEW_TARGET ?
                    #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET) :
                    THIS);
                  ${base("arguments")} = #Object.assign(
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
                    789; }
                  return (${base("new.target")} ? ${base("this")} : void 0);},
                "length",
                {
                  __proto__: null,
                  value: 0,
                  configurable: true}),
              "name",
              {
                __proto__: null,
                value: "f",
                configurable: true}),
            #Object.defineProperty(
              ${meta("constructor")},
              "prototype",
              {
                __proto__: null,
                value: #Object.create(
                  #Object.prototype,
                  {
                    __proto__: null,
                    constructor: {
                      __proto__: null,
                      value: ${meta("constructor")},
                      writable: true,
                      configurable: true}}),
                writable: true})),
          ${meta("callee")}));
      ${COMPLETION} = 123;
      ${base("x")} = 456;}`);
  // LabeledStatement //
  success(
    true,
    [],
    [],
    `foo : break foo;`,
    Completion._make_program(null),
    [],
    [],
    ``);
  success(
    true,
    [],
    [],
    `foo : {
      123;
      break foo;
      456;}`,
    Completion._make_program,
    [],
    [],
    `foo: {
      ${COMPLETION} = 123;
      break foo;
      ${COMPLETION} = 456;}`);
  // IfStatement //
  success(
    true,
    [],
    [],
    `if (123) 456; else 789;`,
    Completion._make_program,
    [],
    [],
    `
      ${COMPLETION} = void 0;
      if (
        123)
      {
        ${COMPLETION} = 456; }
      else {
        ${COMPLETION} = 789; }`);
  success(
    true,
    [],
    [],
    `if (123) { 456; } else { 789; }`,
    Completion._make_program(null),
    [],
    [],
    `
      if (
        123)
      {
        456; }
      else {
        789; }`);
  success(
    true,
    [],
    [],
    `if (123) { 456; }`,
    Completion._make_program(null),
    [],
    [],
    `
      if (
        123)
      {
        456; }
      else {}`);
  // TryStatement //
  success(
    true,
    [],
    [],
    `try { 123; } catch { 456; } finally { 789; }`,
    Completion._make_program,
    [],
    [],
    `
      ${COMPLETION} = void 0;
      try {
        ${COMPLETION} = 123; }
      catch {
        ${COMPLETION} = void 0;
        {
          ${COMPLETION} = 456; }}
      finally {
        789; }`);
  success(
    true,
    [],
    [],
    `foo: try { 123; } finally { 789; break foo; }`,
    Completion._make_program,
    [],
    [],
    `
      ${COMPLETION} = void 0;
      foo: try {
        ${COMPLETION} = 123; }
      catch {
        throw ERROR;}
      finally {
        ${COMPLETION} = 789;
        break foo; }`);
  success(
    true,
    [],
    [],
    `foo: try { 123; } catch (x) { 456; }`,
    Completion._make_program(null),
    [],
    [],
    `
      foo: try {
        123; }
      catch {
        let x;
        x = ERROR;
        {
          456; }}
      finally {}`);
  // WithStatement //
  success(
    true,
    ["y"],
    [],
    `with (123) {
      let x = 456;
      x;
      y;
      789;}`,
    Completion._make_program,
    [],
    ["frame", "unscopables"],
    `
      ${COMPLETION} = void 0;
      ${meta("frame")} = 123;
      ${meta("frame")} = (
        (
          (${meta("frame")} === null) ?
          true :
          (${meta("frame")} === void 0)) ?
        throw new #TypeError("Cannot convert undefined or null to object") :
        #Object(${meta("frame")}));
      ${meta("unscopables")} = void 0;
      {
        let ${base("x")};
        ${base("x")} = 456;
        ${base("x")};
        (
          (
            #Reflect.has(${meta("frame")}, "y") ?
            (
              ${meta("unscopables")} = #Reflect.get(${meta("frame")}, #Symbol.unscopables),
              (
                (
                  (typeof ${meta("unscopables")} === "object") ?
                  ${meta("unscopables")} :
                  (typeof ${meta("unscopables")} === "function")) ?
                #Reflect.get(${meta("unscopables")}, "y") :
                false)) :
            true) ?
          ${base("y")} :
          #Reflect.get(${meta("frame")}, "y"));
        ${COMPLETION} = 789;}`);
  success(
    true,
    [],
    [],
    `with (123) 456;`,
    Completion._make_program(null),
    [],
    ["frame", "unscopables"],
    `
      ${meta("frame")} = 123;
      ${meta("frame")} = (
        (
          (${meta("frame")} === null) ?
          true :
          (${meta("frame")} === void 0)) ?
        throw new #TypeError("Cannot convert undefined or null to object") :
        #Object(${meta("frame")}));
      ${meta("unscopables")} = void 0;
      {
        456;}`);
  // WhileStatement //
  success(
    true,
    [],
    [],
    `while (123) { 456; }`,
    Completion._make_program,
    [],
    [],
    `
      ${COMPLETION} = void 0;
      : while (
        123)
      {
        ${COMPLETION} = 456;}`);
  success(
    true,
    [],
    [],
    `while (123) 456;`,
    Completion._make_program(null),
    [],
    [],
    `
      : while (
        123)
      {
        456;}`);
  // DoWhileStatement //
  success(
    true,
    [],
    [],
    `do { 123; } while (456)`,
    Completion._make_program,
    [],
    ["entrance"],
    `
      ${COMPLETION} = void 0;
      ${meta("entrance")} = true;
      : while (
        (
          ${meta("entrance")} ?
          (
            ${meta("entrance")} = false,
            true) :
          456))
      {
        ${COMPLETION} = 123;}`);
  success(
    true,
    [],
    [],
    `do 123; while (456)`,
    Completion._make_program(null),
    [],
    ["entrance"],
    `
      ${meta("entrance")} = true;
      : while (
        (
          ${meta("entrance")} ?
          (
            ${meta("entrance")} = false,
            true) :
          456))
      {
        123;}`);
  // ForStatement //
  success(
    true,
    [],
    [],
    `for (let x = 123; 456; 789) { 0; }`,
    Completion._make_program,
    [],
    [],
    `
      ${COMPLETION} = void 0;
      {
        let ${base("x")};
        ${base("x")} = 123;
        : while (
          456)
        {
          {
            ${COMPLETION} = 0;}
          789;}}`);
  success(
    true,
    [],
    [],
    `for (;;) 123;`,
    Completion._make_program(null),
    [],
    [],
    `
      : while (
        true)
      {
        123;}`);
  success(
    true,
    [],
    [],
    `for (123;;) 456;`,
    Completion._make_program(null),
    [],
    [],
    `
      123;
      : while (
        true)
      {
        456;}`);
  success(
    true,
    ["x"],
    [],
    `for (var x = 123;;) 456;`,
    Completion._make_program(null),
    [],
    [],
    `
      ${base("x")} = 123;
      : while (
        true)
      {
        456;}`);
  // ForInStatement //
  success(
    true,
    [],
    [],
    `for (let x in 123) { let x = 456; 789; }`,
    Completion._make_program,
    [],
    [],
    `
      ${COMPLETION} = void 0;
      {
        let ${base("x")}, ${meta("right")}, ${meta("keys")}, ${meta("index")}, ${meta("length")};
        ${meta("right")} = 123;
        ${meta("keys")} = #Array.of();
        ${meta("right")} = (
          (
            (${meta("right")} === null) ?
            true :
            (${meta("right")} === void 0)) ?
          ${meta("right")} :
          #Object(${meta("right")}));
        while (
          ${meta("right")})
        {
          ${meta("keys")} = #Array.prototype.concat(
            @${meta("keys")},
            #Object.keys(${meta("right")}));
          ${meta("right")} = #Reflect.getPrototypeOf(${meta("right")});}
        ${meta("index")} = 0;
        ${meta("length")} = #Reflect.get(${meta("keys")}, "length");
        : while (
          (${meta("index")} < ${meta("length")}))
        {
          let ${base("x")};
          ${base("x")} = #Reflect.get(${meta("keys")}, ${meta("index")});
          {
            let ${base("x")};
            ${base("x")} = 456;
            ${COMPLETION} = 789; }
          ${meta("index")} = (${meta("index")} + 1);}}`);
  success(
    true,
    ["x"],
    [],
    `for (var x in 123) { 456; }`,
    Completion._make_program(null),
    [],
    ["right", "keys", "index", "length"],
    `
      ${meta("right")} = 123;
      ${meta("keys")} = #Array.of();
      ${meta("right")} = (
        (
          (${meta("right")} === null) ?
          true :
          (${meta("right")} === void 0)) ?
        ${meta("right")} :
        #Object(${meta("right")}));
      while (
        ${meta("right")})
      {
        ${meta("keys")} = #Array.prototype.concat(
          @${meta("keys")},
          #Object.keys(${meta("right")}));
        ${meta("right")} = #Reflect.getPrototypeOf(${meta("right")});}
      ${meta("index")} = 0;
      ${meta("length")} = #Reflect.get(${meta("keys")}, "length");
      : while (
        (${meta("index")} < ${meta("length")}))
      {
        ${base("x")} = #Reflect.get(${meta("keys")}, ${meta("index")});
        {
          456; }
        ${meta("index")} = (${meta("index")} + 1);}`);
  success(
    true,
    ["x"],
    [],
    `for (x in 123) 456;`,
    Completion._make_program(null),
    [],
    ["right", "keys", "index", "length"],
    `
      ${meta("right")} = 123;
      ${meta("keys")} = #Array.of();
      ${meta("right")} = (
        (
          (${meta("right")} === null) ?
          true :
          (${meta("right")} === void 0)) ?
        ${meta("right")} :
        #Object(${meta("right")}));
      while (
        ${meta("right")})
      {
        ${meta("keys")} = #Array.prototype.concat(
          @${meta("keys")},
          #Object.keys(${meta("right")}));
        ${meta("right")} = #Reflect.getPrototypeOf(${meta("right")});}
      ${meta("index")} = 0;
      ${meta("length")} = #Reflect.get(${meta("keys")}, "length");
      : while (
        (${meta("index")} < ${meta("length")}))
      {
        ${base("x")} = #Reflect.get(${meta("keys")}, ${meta("index")});
        {
          456; }
        ${meta("index")} = (${meta("index")} + 1);}`);
  // ForOfStatement //
  failure(
    true,
    [],
    [],
    {
      type: "ForOfStatement",
      await: true},
    Completion._make_program(null),
    [],
    "Unfortunately, Aran does not yet support asynchronous closures and await for-of statements.");
  success(
    true,
    [],
    [],
    `for (let x of 123) { let x = 456; 789; }`,
    Completion._make_program,
    [],
    [],
    `
      ${COMPLETION} = void 0;
      {
        let ${base("x")}, ${meta("iterator")}, ${meta("step")};
        ${meta("iterator")} = (
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
        ${meta("step")} = void 0;
        : while (
          (
            ${meta("step")} = #Reflect.get(${meta("iterator")}, "next")(@${meta("iterator")}),
            !#Reflect.get(${meta("step")}, "done")))
          {
            let ${base("x")};
            ${base("x")} = #Reflect.get(${meta("step")}, "value");
            {
              let ${base("x")};
              ${base("x")} = 456;
              ${COMPLETION} = 789;}}}`);
  success(
    true,
    ["x"],
    [],
    `for (var x of 123) { 456; }`,
    Completion._make_program(null),
    [],
    ["iterator", "step"],
    `
      ${meta("iterator")} = (
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
      ${meta("step")} = void 0;
      : while (
        (
          ${meta("step")} = #Reflect.get(${meta("iterator")}, "next")(@${meta("iterator")}),
          !#Reflect.get(${meta("step")}, "done")))
        {
          ${base("x")} = #Reflect.get(${meta("step")}, "value");
          {
            456;}}`);
  success(
    true,
    ["x"],
    [],
    `for (x of 123) 456;`,
    Completion._make_program(null),
    [],
    ["iterator", "step"],
    `
      ${meta("iterator")} = (
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
      ${meta("step")} = void 0;
      : while (
        (
          ${meta("step")} = #Reflect.get(${meta("iterator")}, "next")(@${meta("iterator")}),
          !#Reflect.get(${meta("step")}, "done")))
        {
          ${base("x")} = #Reflect.get(${meta("step")}, "value");
          {
            456;}}`);
  // SwitchStatement //
  success(
    true,
    ["f"],
    [],
    `switch (!1) {
      case 2:
        3;
        let x = 4;
        function f () { 5; }
      default:
        x;
        6;}`,
    Completion._make_program,
    [],
    ["discriminant", "matched"],
    `
      ${COMPLETION} = void 0;
      ${meta("discriminant")} = !1;
      ${meta("matched")} = false;
      : {
        let ${base("x")}, ${meta("x")}, ${meta("callee")}, ${meta("constructor")};
        ${meta("x")} = false;
        ${base("f")} = (
          ${meta("callee")} = void 0,
          (
            ${meta("callee")} = (
              ${meta("constructor")} = #Object.defineProperty(
                #Object.defineProperty(
                  function () {
                    let ${base("f")}, ${base("new.target")}, ${base("this")}, ${base("arguments")};
                    ${base("f")} = ${meta("callee")};
                    ${base("new.target")} = NEW_TARGET;
                    ${base("this")} = (
                      NEW_TARGET ?
                      #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET) :
                      THIS);
                    ${base("arguments")} = #Object.assign(
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
                      5; }
                    return (${base("new.target")} ? ${base("this")} : void 0);},
                  "length",
                  {
                    __proto__: null,
                    value: 0,
                    configurable: true}),
                "name",
                {
                  __proto__: null,
                  value: "f",
                  configurable: true}),
              #Object.defineProperty(
                ${meta("constructor")},
                "prototype",
                {
                  __proto__: null,
                  value: #Object.create(
                    #Object.prototype,
                    {
                      __proto__: null,
                      constructor: {
                        __proto__: null,
                        value: ${meta("constructor")},
                        writable: true,
                        configurable: true}}),
                  writable: true})),
            ${meta("callee")}));
        if (
          (
            ${meta("matched")} ?
            true :
            (
              (${meta("discriminant")} === 2) ?
              (
                ${meta("matched")} = true,
                true) :
              false)))
        {
          3;
          (${base("x")} = 4, ${meta("x")} = true); }
        else {}
        ${meta("matched")} = true;
        {
          (
            ${meta("x")} ?
            ${base("x")} :
            throw new #ReferenceError("Cannot access 'x' before initialization"));
          ${COMPLETION} = 6; }}`);
});

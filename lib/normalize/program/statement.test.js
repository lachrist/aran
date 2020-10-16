"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const Tree = require("../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const ScopeMeta = require("../scope/meta.js");
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

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {

  const test = (identifiers, closure) => Scope.EXTEND_STATIC(
    Scope._make_global(),
    ArrayLite.reduce(
      global.Reflect.ownKeys(identifiers),
      (hoisting, identifier) => (
        hoisting[identifier] = true,
        hoisting),
      {__proto__:null}),
    (scope) => Tree.Bundle(
      [
        Tree.Bundle(
          ArrayLite.map(
            ArrayLite.filter(
              global.Reflect.ownKeys(identifiers),
              (identifier) => identifiers[identifier]),
            (identifier) => Tree.Lift(
              Scope.initialize(
                scope,
                identifier,
                Tree.primitive(null))))),
        closure(scope)]));

  const success = (identifiers1, closure, identifiers2, code2) => Lang._match_block(
    test(identifiers1, closure),
    Lang.PARSE_BLOCK(`{
      ${(
        (global.Reflect.ownKeys(identifiers2).length > 0) ?
        `let ${ArrayLite.join(global.Reflect.ownKeys(identifiers2), ", ")};` :
        ``)}
      ${ArrayLite.join(
        ArrayLite.map(
          ArrayLite.filter(
            global.Reflect.ownKeys(identifiers2),
            (identifier) => identifiers2[identifier]),
          (identifier) => `${identifier} = null;`),
        "\n")}
      ${code2}}`),
    Assert);

  const failure = (identifiers, closure, message) => Assert.throws(
    () => test(identifiers, closure),
    new Error(message));

  const extend_strict = (scope, strict) => (
    strict ?
    Scope._extend_use_strict(scope) :
    scope);

  const extend_super = (scope, value) => (
    value !== void 0 ?
    Scope._extend_binding_super(scope, value) :
    scope);

  const extend_tag = (scope, value) => (
    value !== void 0 ?
    Scope._extend_binding_tag(scope, value) :
    scope);

  const helper = (code, options) => (
    options = Object.assign(
      {
        last: false,
        strict: false,
        labels: [],
        completion: Completion._make_empty(),
        tag: void 0,
        super: void 0},
      options),
    (scope) => (
      options.last ?
      Scope.Box(
        scope,
        "completion",
        true,
        Tree.primitive(void 0),
        (box) => Statement.Visit(
          Scope._extend_binding_last(
            extend_super(
              extend_tag(
                extend_strict(scope, options.strict),
                options.tag),
              options.super),
            box),
          parse(code),
          {
            __proto__: Statement._default_context,
            labels: options.labels,
            completion: options.completion},
          options.context)) :
      Statement.Visit(
        extend_super(
          extend_tag(
            extend_strict(scope, options.strict),
            options.tag),
          options.super),
        parse(code),
        {
          __proto__: Statement._default_context,
          labels: options.labels,
          completion: options.completion})));

  // const helper = (code, context) => (scope) => Statement.Visit(
  //   scope,
  //   (
  //     typeof code === "string" ?
  //     parse(code).body[0] :
  //     code),
  //   context || Statement._default_context);

  // EmptyStatement //
  success(
    {},
    helper(`;`),
    {},
    ``);
  // DebuggerStatement
  success(
    {},
    helper(`debugger;`),
    {},
    `debugger;`);
  // ExpressionStatement //
  success(
    {"x":true},
    helper(
      `x++;`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false, "$x":true, "_result":false},
    `
      _completion = void 0;
      _completion = (
        _result = $x,
        (
          $x = (_result + 1),
          _result));`);
  success(
    {"x":true},
    helper(`x++;`),
    {"$x":true},
    `$x = ($x + 1);`);
  // BreakStatement //
  success(
    {},
    helper(
      {
        type: "BreakStatement",
        label: {
          type: "Identifier",
          name: "foo"}}),
    {},
    `break $foo;`);
  success(
    {},
    helper(
      {
        type: "BreakStatement",
        label: null},
      {
        __proto__: Statement._default_context,
        labels: [null]}),
    {},
    ``);
  // ContinueStatement //
  success(
    {},
    helper(
      {
        type: "ContinueStatement",
        label: {
          type: "Identifier",
          name: "foo"}}),
    {},
    `continue $foo;`);
  failure(
    {},
    helper(
      {
        type: "ContinueStatement",
        label: null},
      {
      __proto__: Statement._default_context,
      labels: [null]}),
    "Break label used as continue label");
  // ThrowStatement //
  success(
    {},
    helper(`throw 123;`),
    {},
    `throw 123;`);
  // ReturnStatement >> Completion._program //
  failure(
    {},
    helper(
      {
        type: "ReturnStatement",
        argument: null},
      {
        tag: null}),
    "Unexpected empty closure tag");
  // ReturnStatement >> Completion._arrow && Completion._method //
  success(
    {},
    helper(
      {
        type: "ReturnStatement",
        argument: null},
      {
        tag: "method"}),
    {},
    `return void 0;`);
  success(
    {},
    (scope) => Statement.Visit(
      Scope._extend_binding_tag(scope, "method"),
      {
        type: "ReturnStatement",
        argument: {
          type: "Literal",
          value: 123}},
      Statement._default_context),
    {},
    `return 123;`);
  // ReturnStatement >> Completion._function
  success(
    {"new.target":true, "this":true},
    helper(
      {
        type: "ReturnStatement",
        argument: null},
      {
        tag: "function"}),
    {"$newtarget":true, "$this":true},
    `return ($newtarget ? $this : void 0);`);
  success(
    {"new.target":true, "this":true},
    helper(
      {
        type: "ReturnStatement",
        argument: {
          type: "Literal",
          value: 123}},
      {
        tag: "function"}),
    {"$newtarget":true, "$this":true},
    `return (
      $newtarget ?
      (
        (
          (typeof 123 === "object") ?
          123 :
          (typeof 123 === "function")) ?
        123 :
        $this) :
      123);`);
  // ReturnStatement >> Completion._constructor
  success(
    {"this":true},
    helper(
      {
        type: "ReturnStatement",
        argument: null},
      {
        tag: "constructor",
        super: null}),
    {"$this":true},
    `return $this;`);
  success(
    {"this":true},
    helper(
      {
        type: "ReturnStatement",
        argument: {
          type: "Literal",
          value: 123}},
      {
        tag: "constructor",
        super: null}),
    {"$this":true},
    `return (
      (
        (typeof 123 === "object") ?
        123 :
        (typeof 123 === "function")) ?
      123 :
      $this);`);
  // ReturnStatement >> Completion._derived_constructor
  success(
    {"this":true},
    helper(
      {
        type: "ReturnStatement",
        argument: null},
      {
        tag: "constructor",
        super: ScopeMeta._primitive_box("yo")}),
    {"$this":true},
    `return (
      $this ?
      $this :
      throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"));`);
  success(
    {"this":true},
    helper(
      {
        type: "ReturnStatement",
        argument: {
          type: "Literal",
          value: 123}},
      {
        tag: "constructor",
        super: ScopeMeta._primitive_box("yo")}),
    {"$this":true},
    `return (
      (
        (typeof 123 === "object") ?
        123 :
        (typeof 123 === "function")) ?
      123 :
      (
        (123 === void 0) ?
        (
          $this ?
          $this :
          throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")) :
        throw new #TypeError("Derived constructors may only return object or undefined")));`);
  // VariableDeclaration //
  success(
    {"x":false, "y":false, "z":false, "t":false},
    helper(`let x = () => { 123; }, {y, z} = 456, t;`),
    {"$x":false, "$y":false, "$z":false, "$t":false},
    `
      $x = #Object.defineProperty(
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
            $y = #Reflect.get(
              #Object(456),
              "y")),
          $z = #Reflect.get(
            #Object(456),
            "z")));
      $t = void 0;`);
  // FunctionDeclaration //
  success(
    {"f":true},
    helper(
      `function f () { 123; }`,
      {strict:true}),
    {"$f":true, "_constructor":false},
    `$f = (
      _constructor = #Object.defineProperty(
        #Object.defineProperty(
          function () {
            let $f, $newtarget, $this, $arguments;
            $f = callee;
            $newtarget = new.target;
            $this = (
              new.target ?
              {__proto__:#Reflect.get(new.target, "prototype")} :
              this);
            $arguments = #Object.assign(
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
              123; }
            return ($newtarget ? $this : void 0);},
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
          writable: true}));`);
  // ClassDeclaration //
  success(
    {"c":false},
    helper(`class c {}`),
    {"$c":false},
    `
      $c = (
        (
          () => {
            let $c, _constructor, _prototype;
            return (
              $c = (
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
                      value: "c",
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
              $c);})
        ());`);
  // BlockStatement //
  success(
    {"f":true},
    helper(
      `{
        123;
        let x = 456;
        function f () { 789; }}`,
      {
        last: true,
        strict: true,
        completion: Completion._make_full()}),
    {"_completion":false, "$f":true},
    `
      _completion = void 0;
      {
        let $x, _constructor;
        $f = (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              function () {
                let $f, $newtarget, $arguments, $this;
                $f = callee;
                $newtarget = new.target;
                $this = (
                  new.target ?
                  {__proto__:#Reflect.get(new.target, "prototype")} :
                  this);
                $arguments = #Object.assign(
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
                  789;}
                return ($newtarget ? $this : void 0);},
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
        _completion = 123;
        $x = 456;}`);
  // LabeledStatement //
  success(
    {},
    helper(`foo : break foo;`),
    {},
    ``);
  success(
    {},
    helper(
      `foo : {
        123;
        break foo;
        456;}`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false},
    `
      _completion = void 0;
      $foo: {
        _completion = 123;
        break $foo;
        _completion = 456;}`);
  // IfStatement //
  success(
    {},
    helper(`if (123) { 456; } else { 789; }`),
    {},
    `
      if (
        123)
      {
        456; }
      else {
        789; }`);
  success(
    {},
    helper(
      `if (123) { 456; }`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false},
    `
      _completion = void 0;
      _completion = void 0;
      if (
        123)
      {
        _completion = 456; }
      else {}`);
  // TryStatement //
  success(
    {},
    helper(
      `try { 123; } catch { 456; } finally { 789; }`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false},
    `
      _completion = void 0;
      _completion = void 0;
      try {
        _completion = 123; }
      catch {
        _completion = void 0;
        {
          _completion = 456; }}
      finally {
        789; }`);
  success(
    {},
    helper(
      `foo: try { 123; } finally { 789; break foo; }`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false},
    `
      _completion = void 0;
      _completion = void 0;
      $foo: try {
        _completion = 123; }
      catch {
        throw error; }
      finally {
        _completion = 789;
        break $foo;}`);
  success(
    {},
    helper(`try { 123; } catch (x) { 456; }`),
    {},
    `
      try {
        123; }
      catch {
        let x;
        x = error;
        {
          456; }}
      finally {}`);
  // WithStatement //
  success(
    {"y":true},
    helper(
      `with (123) {
        let x = 456;
        x;
        y;}`),
    {"$y":true, "_frame":false, "_unscopables":false},
    `
      _frame = 123;
      _frame = (
        (
          (_frame === null) ?
          true :
          (_frame === void 0)) ?
        throw new #TypeError("Cannot convert undefined or null to object") :
        #Object(_frame));
      _unscopables = void 0;
      {
        let $x;
        $x = 456;
        $x;
        (
          (
            #Reflect.has(_frame, "y") ?
            (
              _unscopables = #Reflect.get(_frame, #Symbol.unscopables),
              (
                (
                  (typeof _unscopables === "object") ?
                  _unscopables :
                  (typeof _unscopables === "function")) ?
                #Reflect.get(_unscopables, "y") :
                false)) :
            true) ?
          $y :
          #Reflect.get(_frame, "y"));}`);
  success(
    {},
    helper(
      `with (123) 456;`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false, "_frame":false, "_unscopables":false},
    `
      _completion = void 0;
      _completion = void 0;
      _frame = 123;
      _frame = (
        (
          (_frame === null) ?
          true :
          (_frame === void 0)) ?
        throw new #TypeError("Cannot convert undefined or null to object") :
        #Object(_frame));
      _unscopables = void 0;
      {
        _completion = 456;}`);
  // WhileStatement //
  success(
    {},
    helper(
      `while (123) { 456; }`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false},
    `
      _completion = void 0;
      _completion = void 0;
      $: while (
        123)
      {
        _completion = 456;}`);
  success(
    {},
    helper(`while (123) 456;`),
    {},
    `
      $: while (
        123)
      {
        456;}`);
  // DoWhileStatement //
  success(
    {},
    helper(
      `do { 123; } while (456)`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false, "_entrance":false},
    `
      _completion = void 0;
      _completion = void 0;
      _entrance = true;
      $: while (
        (
          _entrance ?
          (
            _entrance = false,
            true) :
          456))
      {
        _completion = 123;}`);
  success(
    {},
    helper(`do 123; while (456)`),
    {"_entrance":false},
    `
      _entrance = true;
      $: while (
        (
          _entrance ?
          (
            _entrance = false,
            true) :
          456))
      {
        123;}`);
  // ForStatement //
  success(
    {},
    helper(
      `for (let x = 123; 456; 789) { 0; }`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false},
    `
      _completion = void 0;
      _completion = void 0;
      {
        let $x;
        $x = 123;
        $: while (
          456)
        {
          {
            _completion = 0;}
          789;}}`);
  success(
    {},
    helper(`for (;;) 123;`),
    {},
    `
      $: while (
        true)
      {
        123;}`);
  success(
    {},
    helper(`for (123;;) 456;`),
    {},
    `
      123;
      $: while (
        true)
      {
        456;}`);
  success(
    {"x":true},
    helper(`for (var x = 123;;) 456;`),
    {"$x":true},
    `
      $x = 123;
      $: while (
        true)
      {
        456;}`);
  // ForInStatement //
  success(
    {},
    helper(
      `for (let x in 123) { let x = 456; 789; }`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false},
    `
      _completion = void 0;
      _completion = void 0;
      {
        let $x, _right, _keys, _index, _length;
        _right = 123;
        _keys = #Array.of();
        _right = (
          (
            (_right === null) ?
            true :
            (_right === void 0)) ?
          null :
          #Object(_right));
        while (
          _right)
        {
          _keys = #Array.prototype.concat(
            @#Array.of(),
            _keys,
            #Object.keys(_right));
          _right = #Reflect.getPrototypeOf(_right);}
        _index = 0;
        _length = #Reflect.get(_keys, "length");
        $: while (
          (_index < _length))
        {
          let $x;
          $x = #Reflect.get(_keys, _index);
          {
            let $x;
            $x = 456;
            _completion = 789; }
          _index = (_index + 1);}}`);
  success(
    {"x":true},
    helper(`for (var x in 123) { 456; }`),
    {"$x":true, "_right":false, "_keys":false, "_index":false, "_length":false},
    `
      _right = 123;
      _keys = #Array.of();
      _right = (
        (
          (_right === null) ?
          true :
          (_right === void 0)) ?
        null :
        #Object(_right));
      while (
        _right)
      {
        _keys = #Array.prototype.concat(
          @#Array.of(),
          _keys,
          #Object.keys(_right));
        _right = #Reflect.getPrototypeOf(_right);}
      _index = 0;
      _length = #Reflect.get(_keys, "length");
      $: while (
        (_index < _length))
      {
        $x = #Reflect.get(_keys, _index);
        {
          456; }
        _index = (_index + 1);}`);
  success(
    {"x":true},
    helper(`for (x in 123) { 456; }`),
    {"$x":true, "_right":false, "_keys":false, "_index":false, "_length":false},
    `
      _right = 123;
      _keys = #Array.of();
      _right = (
        (
          (_right === null) ?
          true :
          (_right === void 0)) ?
        null :
        #Object(_right));
      while (
        _right)
      {
        _keys = #Array.prototype.concat(
          @#Array.of(),
          _keys,
          #Object.keys(_right));
        _right = #Reflect.getPrototypeOf(_right);}
      _index = 0;
      _length = #Reflect.get(_keys, "length");
      $: while (
        (_index < _length))
      {
        $x = #Reflect.get(_keys, _index);
        {
          456; }
        _index = (_index + 1);}`);
  // ForOfStatement //
  failure(
    {},
    helper(
      {
        type: "ForOfStatement",
        await: true}),
    "Unfortunately, Aran does not yet support asynchronous closures and await for-of statements.");
  success(
    {},
    helper(
      `for (let x of 123) { let x = 456; 789; }`,
      {
        last: true,
        completion: Completion._make_full()}),
    {"_completion":false},
    `
      _completion = void 0;
      _completion = void 0;
      {
        let $x, _iterator, _step;
        _iterator = (
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
        _step = void 0;
        $: while (
          (
            _step = #Reflect.get(_iterator, "next")(@_iterator),
            !#Reflect.get(_step, "done")))
          {
            let $x;
            $x = #Reflect.get(_step, "value");
            {
              let $x;
              $x = 456;
              _completion = 789;}}}`);
  success(
    {"x":true},
    helper(
      `for (var x of 123) { 456; }`,
      {strict:true}),
    {"$x":true, "_iterator": false, "_step":false},
    `
      _iterator = (
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
      _step = void 0;
      $: while (
        (
          _step = #Reflect.get(_iterator, "next")(@_iterator),
          !#Reflect.get(_step, "done")))
        {
          $x = #Reflect.get(_step, "value");
          {
            456;}}`);
  success(
    {"x":true},
    helper(`for (x of 123) 456;`),
    {"$x":true, "_iterator":false, "_step":false},
    `
      _iterator = (
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
      _step = void 0;
      $: while (
        (
          _step = #Reflect.get(_iterator, "next")(@_iterator),
          !#Reflect.get(_step, "done")))
        {
          $x = #Reflect.get(_step, "value");
          {
            456;}}`);
  // SwitchStatement //
  success(
    {"f":true},
    helper(
      `switch (!1) {
      case 2:
        3;
        let x = 4;
        function f () { 5; }
      default:
        x;
        6;}`,
      {
        strict: true,
        last: true,
        completion: Completion._make_full()}),
    {"$f":true, "_completion":false, "_discriminant":false, "_matched":false},
    `
      _completion = void 0;
      _completion = void 0;
      _discriminant = !1;
      _matched = false;
      $: {
        let $x, _x, _constructor;
        _x = false;
        $f = (
          _constructor = #Object.defineProperty(
            #Object.defineProperty(
              function () {
                let $f, $newtarget, $this, $arguments;
                $f = callee;
                $newtarget = new.target;
                $this = (
                  new.target ?
                  {__proto__:#Reflect.get(new.target, "prototype")} :
                  this);
                $arguments = #Object.assign(
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
                  5; }
                return ($newtarget ? $this : void 0);},
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
        if (
          (
            _matched ?
            true :
            (
              (_discriminant === 2) ?
              (
                _matched = true,
                true) :
              false)))
        {
          3;
          ($x = 4, _x = true); }
        else {}
        _matched = true;
        {
          (
            _x ?
            $x :
            throw new #ReferenceError("Cannot access 'x' before initialization"));
          _completion = 6; }}`);
});

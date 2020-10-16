"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Acorn = require("acorn");
const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

const Tree = require("../../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const ScopeMeta = require("../scope/meta.js");
const Completion = require("../completion.js");
const Expression = require("./expression.js");

const convert = (code) => `(
  (
    (${code} === null) ?
    true :
    (${code} === void 0)) ?
  ${code} :
  #Object(${code}))`;

const Statement = {
  Visit: (scope, statement) => {
    if (statement.type === "ExpressionStatement") {
      return Tree.Lift(Expression.visit(scope, statement.expression, {
        __proto__: Expression._default_context,
        dropped: true
      }));
    }
    Assert.fail("Unexpected statement type");
  }
};

require("./common")._resolve_circular_dependencies(Expression, Statement);

const isbase = (identifier) => identifier[0] === "$"
const ismeta = (identifier) => identifier[0] === "_";

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {
  const test = (scope, context, identifiers1, code1, identifiers2, code2) => Lang._match_block(
    Scope.EXTEND_STATIC(
      scope,
      ArrayLite.reduce(
        identifiers1,
        (hoisting, identifier) => (
          hoisting[identifier] = true,
          hoisting),
        {__proto__:null}),
      (scope) => Tree.Bundle(
        [
          Tree.Bundle(
            ArrayLite.map(
              identifiers1,
              (identifier) => Tree.Lift(
                Scope.initialize(
                  scope,
                  identifier,
                  Tree.primitive(null))))),
          Tree.Lift(
            Expression.visit(
              scope,
              (
                typeof code1 === "string" ?
                parse(`(${code1});`).body[0].expression :
                code1),
              context))])),
    Lang.PARSE_BLOCK(`{
      ${identifiers2.length === 0 ? `` : `let ${ArrayLite.join(identifiers2, ", ")};`}
      ${ArrayLite.join(
        ArrayLite.map(
          ArrayLite.filter(identifiers2, isbase),
          (identifier) => `${identifier} = null;`),
        "\n")}
      ${code2};}`),
    Assert);
  // YieldExpression //
  Assert.throws(
    () => Expression.visit(
      Scope._make_global(),
      {
        type: "YieldExpression",
        argument: {
          type: "Literal",
          value: null}},
      Expression._default_context),
    new Error("Unfortunately, Aran does not yet support generator closures and yield expressions."));
  // YieldExpression //
  Assert.throws(
    () => Expression.visit(
      Scope._make_global(),
      {
        type: "AwaitExpression",
        argument: {
          type: "Literal",
          value: null}},
      Expression._default_context),
    new Error("Unfortunately, Aran does not yet support asynchronous closures and await expressions."));
  // ImportExpression //
  Assert.throws(
    () => Expression.visit(
      Scope._make_global(),
      {
        type: "ImportExpression",
        argument: {
          type: "Literal",
          value: null}},
      Expression._default_context),
    new Error("Unfortunately, Aran does not yet support native modules and import expressions."));
  /////////////
  // Literal //
  /////////////
  // Literal //
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `123`,
    [],
    `123`);
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `/abc/g`,
    [],
    `new #RegExp("abc", "g")`);
  // TemplateLiteral //
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `\`foo\``,
    [],
    `"foo"`);
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `\`foo\${123}bar\${456}\\n\``,
    [],
    `(
      (
        ("foo" + 123) +
        ("bar" + 456)) +
      "\\n")`);
  // TaggedTemplateExpression //
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `(123)\`foo\${456}bar\${789}\\n\``,
    [],
    `(123)(
      #Object.freeze(
        #Object.defineProperty(
          #Array.of("foo", "bar", "\\n"),
          "raw",
          {
            __proto__: null,
            value: #Object.freeze(
              #Array.of("foo", "bar", "\\\\n"))})),
      456,
      789)`);
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `(789).qux\`foo\${123}bar\${456}\\n\``,
    [],
    `#Reflect.get(${convert(`789`)}, "qux")(
      @789,
      #Object.freeze(
        #Object.defineProperty(
          #Array.of("foo", "bar", "\\n"),
          "raw",
          {
            __proto__: null,
            value: #Object.freeze(
              #Array.of("foo", "bar", "\\\\n"))})),
      123,
      456)`);
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `(789)["qux"]\`foo\${123}bar\${456}\\n\``,
    [],
    `#Reflect.get(${convert(`789`)}, "qux")(
      @789,
      #Object.freeze(
        #Object.defineProperty(
          #Array.of("foo", "bar", "\\n"),
          "raw",
          {
            __proto__: null,
            value: #Object.freeze(
              #Array.of("foo", "bar", "\\\\n"))})),
      123,
      456)`);
  // ArrowFunctionExpression //
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `() => { 123; }`,
    [],
    `#Object.defineProperty(
      #Object.defineProperty(
        () => {
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
        value: "",
        configurable: true})`);
  // FunctionExpression //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      tag: "method"},
    [],
    `function () { 123; }`,
    [],
    `#Object.defineProperty(
      #Object.defineProperty(
        method () {
          let __new_target__, __this__, __arguments__;
          __new_target__ = void 0;
          __this__ = this;
          __arguments__ = #Object.assign(
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
          return void 0;},
        "length",
        {
          __proto__: null,
          value: 0,
          configurable: true}),
      "name",
      {
        __proto__: null,
        value: "",
        configurable: true})`);
  // ClassExpression //
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `class {}`,
    ["_prototype", "_constructor"],
    `(
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
          _constructor)))`);
  /////////////////
  // Environment //
  /////////////////
  // ThisExpression //
  test(
    Scope._extend_binding_super(
      Scope._make_global(),
      null),
    Expression._default_context,
    ["this"],
    `this`,
    ["$this"],
    `$this`);
  test(
    Scope._extend_binding_super(
      Scope._make_global(),
      ScopeMeta._primitive_box(123)),
    Expression._default_context,
    ["this"],
    `this`,
    ["$this"],
    `(
      $this ?
      $this :
      throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"))`);
  // MetaProperty //
  test(
    Scope._make_global(),
    Expression._default_context,
    ["new.target"],
    {
      type: "MetaProperty",
      meta: {
        type: "Identifier",
        name: "new"},
      property: {
        type: "Identifier",
        name: "target"}},
    ["$newtarget"],
    `$newtarget`);
  Assert.throws(
    () => Expression.visit(
      Scope._make_global(),
      {
        type: "MetaProperty",
        meta: {
          type: "Identifier",
          name: "import"},
        property: {
          type: "Identifier",
          name: "meta"}},
      Expression._default_context),
    new Error("Aran currently only support the new.target meta property."));
  // Super //
  test(
    Scope._extend_binding_self(
      Scope._extend_binding_super(
        Scope._make_global(),
        null),
      ScopeMeta._primitive_box(123)),
    Expression._default_context,
    [],
    {type: "Super"},
    [],
    `#Reflect.getPrototypeOf(123)`);
  test(
    Scope._extend_binding_self(
      Scope._extend_binding_super(
        Scope._make_global(),
        ScopeMeta._primitive_box(456)),
      ScopeMeta._primitive_box(123)),
    Expression._default_context,
    ["this"],
    {type: "Super"},
    ["$this"],
    `(
      $this ?
      #Reflect.getPrototypeOf(123) :
      throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"))`);
  // Identifier //
  test(
    Scope._make_global(),
    Expression._default_context,
    ["x"],
    `x`,
    ["$x"],
    `$x`);
  // AssignmentExpression >> MemberExpression >> Special Case #1 >> (dropped && strict && =)
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `123[456] = 789`,
    [],
    `(
      #Reflect.set(123, 456, 789) ?
      true :
      throw new #TypeError("Cannot set object property"))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(123).foo = 789`,
    [],
    `(
      #Reflect.set(123, "foo", 789) ?
      true :
      throw new #TypeError("Cannot set object property"))`);
  // AssignmentExpression >> MemberExpression >> Special Case #2 >> (dropped && !strict && =)
  test(
    Scope._make_global(),
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `123[456] = 789`,
    [],
    `#Reflect.set(
      ${convert(`123`)},
      456,
      789)`);
  test(
    Scope._make_global(),
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(123).foo = 789`,
    [],
    `#Reflect.set(
      ${convert(`123`)},
      "foo",
      789)`);
  // AssignmentExpression >> MemberExpression >> Special Case #3 >> (dropped && +=)
  test(
    Scope._make_global(),
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `123[456] += 789`,
    [],
    `#Reflect.set(
      ${convert(`123`)},
      456,
      (
        #Reflect.get(
          ${convert(`123`)},
          456) +
        789))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(123).foo += 789`,
    [],
    `(
      #Reflect.set(
        123,
        "foo",
        (
          #Reflect.get(${convert(`123`)}, "foo") +
          789)) ?
      true :
      throw new #TypeError("Cannot set object property"))`);
  // AssignmentExpression >> MemberExpression >> General Case //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `123[456] = 789`,
    [],
    `(
      #Reflect.set(
        123,
        456,
        789) ?
      789 :
      throw new #TypeError("Cannot set object property"))`);
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `123[456] += 789`,
    ["_result"],
    `(
      _result = (
        #Reflect.get(
          ${convert(`123`)},
          456) +
        789),
      (
        #Reflect.set(
          ${convert(`123`)},
          456,
          _result),
        _result))`);
  // AssignmentExpression >> Identifier //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    ["x"],
    `x = () => {}`,
    ["$x"],
    `$x = #Object.defineProperty(
      #Object.defineProperty(
        () => {
          {}
          return void 0;},
        "length",
        {
          __proto__: null,
          value: 0,
          configurable: true}),
      "name",
      {
        __proto__: null,
        value: "x",
        configurable: true})`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `x += () => {}`,
    ["$x", "_result"],
    `(
      _result = (
        $x +
        #Object.defineProperty(
          #Object.defineProperty(
            () => {
              {}
              return void 0;},
            "length",
            {
              __proto__: null,
              value: 0,
              configurable: true}),
          "name",
          {
            __proto__: null,
            value: "",
            configurable: true})),
      ($x = _result, _result))`);
  // AssignmentExpression >> Pattern //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    ["x"],
    `{foo:x} = 123`,
    ["$x"],
    `(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
      (
        void 0,
        $x = #Reflect.get(
          #Object(123),
          "foo")))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `{foo:x} = 123`,
    ["$x"],
    `(
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        (
          void 0,
          $x = #Reflect.get(
            #Object(123),
            "foo"))),
      123)`);
  // UpdateExpression >> MemberExpression >> dropped //
  test(
    Scope._make_global(),
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `++(123).foo`,
    [],
    `#Reflect.set(
      ${convert(`123`)},
      "foo",
      (
        #Reflect.get(${convert(`123`)}, "foo") +
        1))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `++123[456]`,
    [],
    `(
      #Reflect.set(
        123,
        456,
        (
          #Reflect.get(${convert(`123`)}, 456) +
          1)) ?
      true :
      throw new #TypeError("Cannot set object property"))`);
  // UpdateExpression >> MemberExpression >> !dropped //
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `++123[456]`,
    ["_result"],
    `(
      _result = (
        #Reflect.get(${convert(`123`)}, 456) +
        1),
      (
        #Reflect.set(
          ${convert(`123`)},
          456,
          _result),
        _result))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `123[456]++`,
    ["_result"],
    `(
      _result = #Reflect.get(${convert(`123`)}, 456),
      (
        #Reflect.set(
          123,
          456,
          (_result + 1)) ?
        _result :
        throw new #TypeError("Cannot set object property")))`);
  // UpdateExpression >> Identifier //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    ["x"],
    `++x`,
    ["$x"],
    `$x = ($x + 1)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `++x`,
    ["$x", "_result"],
    `(
      _result = ($x + 1),
      (
        $x = _result,
        _result))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `x++`,
    ["$x", "_result"],
    `(
      _result = $x,
      (
        $x = (_result + 1),
        _result))`);
  /////////////
  // Control //
  /////////////
  // SequenceExpression //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `(x = 123, x = 456, x = 789)`,
    ["$x"],
    `(
      $x = 123,
      (
        $x = 456,
        (
          $x = 789,
          789)))`);
  // LogicalExpression //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    ["x"],
    `123 && (x = 456)`,
    ["$x"],
    `(
      123 ?
      $x = 456 :
      void 0)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    ["x"],
    `123 || (x = 456)`,
    ["$x"],
    `(
      123 ?
      void 0 :
      $x = 456)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `123 && (x = 456)`,
    ["$x"],
    `(
      123 ?
      (
        $x = 456,
        456) :
      123)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `123 || (x = 456)`,
    ["$x"],
    `(
      123 ?
      123 :
      (
        $x = 456,
        456))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    ["x"],
    `123 ?? (x = 456)`,
    ["$x"],
    `(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      $x = 456 :
      void 0)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `123 ?? (x = 456)`,
    ["$x"],
    `(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      (
        $x = 456,
        456) :
      123)`);
  // ConditionalExpression //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    {
      __proto__: Expression._default_context,
      dropped: true},
    ["x"],
    `123 ? (x = 456) : (x = 789)`,
    ["$x"],
    `(
      123 ?
      $x = 456 :
      $x = 789)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `123 ? (x = 456) : (x = 789)`,
    ["$x"],
    `(
      123 ?
      (
        $x = 456,
        456) :
      (
        $x = 789,
        789))`);
  /////////////////
  // Combination //
  /////////////////
  // Array //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `[123, 456, 789]`,
    [],
    `#Array.of(123, 456, 789)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `[123,, 456, ...789]`,
    [],
    `#Array.prototype.concat(
      @#Array.of(),
      #Array.of(123),
      #Array(1),
      #Array.of(456),
      789)`);
  // Object //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `{foo:123, ["bar"]:456, "qux":789}`,
    [],
    `{
        __proto__: #Object.prototype,
        foo: 123,
        bar: 456,
        qux: 789}`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `{__proto__:123}`,
    [],
    `{
      __proto__: (
        (
          (typeof 123 === "object") ?
          true :
          (typeof 123 === "function")) ?
        123 :
        #Object.prototype)}`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `{...123, __proto__:456, foo:789}`,
    [],
    `#Object.defineProperty(
      #Object.setPrototypeOf(
        #Object.assign(
          {__proto__: #Object.prototype},
          123),
        (
          (
            (typeof 456 === "object") ?
            true :
            (typeof 456 === "function")) ?
          456 :
          #Object.prototype)),
      "foo",
      {
        __proto__: null,
        value: 789,
        writable: true,
        enumerable: true,
        configurable: true})`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `{foo () { super.foo; }}`,
    ["_self"],
    `(
      _self = void 0,
      (
        _self = {
          __proto__: #Object.prototype,
          foo: #Object.defineProperty(
            #Object.defineProperty(
              method () {
                let $newtarget, $arguments, $this;
                $newtarget = void 0;
                $this = this;
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
                  let _object_member;
                  (
                    _object_member = #Reflect.getPrototypeOf(_self),
                    #Reflect.get(
                      (
                        (
                          (_object_member === null) ?
                          true :
                          (_object_member === void 0)) ?
                        _object_member :
                        #Object(_object_member)),
                      "foo"));}
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
              configurable: true})},
        _self))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `{get ["foo"] () { super.foo; }}`,
    ["_self"],
    `(
      _self = void 0,
      (
        _self = #Object.create(
          #Object.prototype,
          {
            __proto__: null,
            foo: {
              __proto__: null,
              get: #Object.defineProperty(
                #Object.defineProperty(
                  method () {
                    let $newtarget, $arguments, $this;
                    $newtarget = void 0;
                    $this = this;
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
                      let _object_member;
                      (
                        _object_member = #Reflect.getPrototypeOf(_self),
                        #Reflect.get(
                          (
                            (
                              (_object_member === null) ?
                              true :
                              (_object_member === void 0)) ?
                            _object_member :
                            #Object(_object_member)),
                          "foo"));}
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
              enumerable: true,
              configurable:true}}),
        _self))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `{"foo": () => 123}`,
    [],
    `{
      __proto__: #Object.prototype,
      foo: #Object.defineProperty(
        #Object.defineProperty(
          () => {
            return 123;
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
          configurable: true})}`);
  // UnaryExpression //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `!123`,
    [],
    `!123`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["x"],
    `typeof x`,
    ["$x"],
    `typeof $x`);
  test(
    Scope._make_global(),
    Expression._default_context,
    ["x"],
    `delete x`,
    ["$x"],
    `true`);
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `delete (123).foo`,
    [],
    `#Reflect.deleteProperty(
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        123 :
        #Object(123)),
      "foo")`);
  test(
    Scope._make_global(),
    Expression._default_context,
    [],
    `delete (123)[456]`,
    [],
    `#Reflect.deleteProperty(
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        123 :
        #Object(123)),
      456)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `delete !123`,
    [],
    `(!123, true)`);
  // BinaryExpression //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `123 + 456`,
    [],
    `(123 + 456)`);
  // MemberExpression && ChainExpression //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `123[456]`,
    [],
    `#Reflect.get(
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        123 :
        #Object(123)),
      456)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `(123).foo`,
    [],
    `#Reflect.get(
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        123 :
        #Object(123)),
      "foo")`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `123?.[456]`,
    [],
    `(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      void 0 :
      #Reflect.get(
        #Object(123),
        456))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `(123)?.foo`,
    [],
    `(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      void 0 :
      #Reflect.get(
        #Object(123),
        "foo"))`);
  // NewExpression //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `new 123(456, 789)`,
    [],
    `new 123(456, 789)`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `new 123(456, ...789)`,
    [],
    `#Reflect.construct(
      123,
      #Array.prototype.concat(
        @#Array.of(),
        #Array.of(456),
        789))`);
  // CallExpression >> SuperCall //
  test(
    Scope._extend_binding_super(
      Scope._extend_use_strict(
        Scope._make_global()),
      ScopeMeta._primitive_box(123)),
    Expression._default_context,
    ["this"],
    {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Super"},
      arguments: [
        {
          type: "Literal",
          value: 456},
        {
          type: "Literal",
          value: 789}]},
    ["$this"],
    `(
      $this ?
      throw new #ReferenceError("Super constructor may only be called once") :
      (
        $this = new 123(456, 789),
        $this))`);
  test(
    Scope._extend_binding_super(
      Scope._extend_use_strict(
        Scope._make_global()),
      ScopeMeta._primitive_box(123)),
    Expression._default_context,
    ["this"],
    {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Super"},
      arguments: [
        {
          type: "Literal",
          value: 456},
        {
          type: "SpreadElement",
          argument: {
            type: "Literal",
            value: 789}}]},
    ["$this"],
    `(
      $this ?
      throw new #ReferenceError("Super constructor may only be called once") :
      (
        $this = #Reflect.construct(
          123,
          #Array.prototype.concat(
            @#Array.of(),
            #Array.of(456),
            789)),
        $this))`);
  // CallExpression >> DirectEvalCall //
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["eval"],
    `eval(!123, !456)`,
    ["$eval", "_eval", "_arg0", "_arg1"],
    `(
      _eval = $eval,
      (
        _arg0 = !123,
        (
          _arg1 = !456,
          (
            (_eval === #eval) ?
            eval(_arg0) :
            _eval(_arg0, _arg1)))))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    ["eval"],
    `eval?.(!123, !456)`,
    ["$eval", "_eval", "_arg0", "_arg1"],
    `(
      _eval = $eval,
      (
        (
          (_eval === null) ?
          true :
          (_eval === void 0)) ?
        void 0 :
        (
          _arg0 = !123,
          (
            _arg1 = !456,
            (
              (_eval === #eval) ?
              eval(_arg0) :
              _eval(_arg0, _arg1))))))`);
  // CallExpression >> MemberExpression
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `123[456](789)`,
    [],
    `(
      #Reflect.get(
        (
          (
            (123 === null) ?
            true :
            (123 === void 0)) ?
          123 :
          #Object(123)),
        456)
      (
        @123,
        789))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `(123).foo(789)`,
    [],
    `(
      #Reflect.get(
        (
          (
            (123 === null) ?
            true :
            (123 === void 0)) ?
          123 :
          #Object(123)),
        "foo")
      (
        @123,
        789))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `(123)?.[456]?.(789)`,
    ["_callee"],
    `(
      _callee = (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        void 0 :
        #Reflect.get(
          #Object(123),
          456)),
      (
        (
          (_callee === null) ?
          true :
          (_callee === void 0)) ?
        void 0 :
        _callee(
          @123,
          789)))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `(123)?.foo?.(789)`,
    ["_callee"],
    `(
      _callee = (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        void 0 :
        #Reflect.get(
          #Object(123),
          "foo")),
      (
        (
          (_callee === null) ?
          true :
          (_callee === void 0)) ?
        void 0 :
        _callee(
          @123,
          789)))`);
  test(
    Scope._extend_use_strict(
      Scope._make_global()),
    Expression._default_context,
    [],
    `123(456, ...789)`,
    [],
    `#Reflect.apply(
      123,
      void 0,
      #Array.prototype.concat(
        @#Array.of(),
        #Array.of(456),
        789))`);
});

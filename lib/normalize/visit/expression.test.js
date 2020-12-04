"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Parse = require("../../parse.js");
const Tree = require("../../tree.js");
const Lang = require("../../lang/index.js");
const State = require("../state.js");
const Scope = require("../scope/index.js");
const Completion = require("../completion.js");
const Visit = require("./index.js");

const convert = (code) => `(
  (
    (${code} === null) ?
    true :
    (${code} === void 0)) ?
  ${code} :
  #Object(${code}))`;

Visit._test_init([
  require("./other.js"),
  require("./pattern.js"),
  require("./closure.js"),
  require("./class.js"),
  require("./expression.js"),
  {
    CLOSURE_BODY: (scope, node, context) => Scope.CLOSURE_BODY(scope, false, [], (scope) => {
      Assert.deepEqual(context, {bindings:[]});
      if (node.type === "BlockStatement") {
        return Tree.Bundle(ArrayLite.map(node.body, (node) => {
          Assert.deepEqual(node.type, "ExpressionStatement");
          return Tree.Lift(Visit.expression(scope, node.expression, null));
        }));
      }
      return Tree.Return(Visit.expression(scope, node, null));
    })
  }
]);

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, () => {
  const test = (strict, variables, code1, context, code2) => Lang._match_block(
    Scope.MODULE(
      Scope._make_root(),
      false,
      variables,
      (scope) => Tree.Lift(
        Visit.expression(
          (
            strict ?
            Scope._use_strict(scope) :
            scope),
          (
            typeof code1 === "string" ?
            Parse.script(`(${code1});`).body[0].expression :
            code1),
          context))),
    Lang.PARSE_BLOCK(code2),
    Assert);
  // YieldExpression //
  Assert.throws(
    () => Scope.MODULE(
      Scope._make_root(),
      false,
      [],
      (scope) => Visit.expression(
        scope,
        {
          type: "YieldExpression",
          argument: {
            type: "Literal",
            value: null}},
        null)),
    new global.Error(`yield expression should never be reached`));
  // YieldExpression //
  Assert.throws(
    () => Scope.MODULE(
      Scope._make_root(),
      false,
      [],
      (scope) => Visit.expression(
        scope,
        {
          type: "AwaitExpression",
          argument: {
            type: "Literal",
            value: null}},
        null)),
    new global.Error(`await expression should never be reached`));
  /////////////
  // Literal //
  /////////////
  // Literal //
  test(
    false,
    [],
    `123`,
    null,
    `{
      123; }`);
  test(
    false,
    [],
    `/abc/g`,
    null,
    `{
      new #RegExp("abc", "g"); }`);
  // TemplateLiteral //
  test(
    false,
    [],
    `\`foo\``,
    null,
    `{
      "foo";}`);
  test(
    false,
    [],
    `\`foo\${123}bar\${456}\\n\``,
    null,
    `{
      (
        (
          ("foo" + 123) +
          ("bar" + 456)) +
        "\\n"); }`);
  // TaggedTemplateExpression //
  test(
    false,
    [],
    `(123)\`foo\${456}bar\${789}\\n\``,
    null,
    `{
      (123)(
        #Object.freeze(
          #Object.defineProperty(
            #Array.of("foo", "bar", "\\n"),
            "raw",
            {
              __proto__: null,
              value: #Object.freeze(
                #Array.of("foo", "bar", "\\\\n"))})),
        456,
        789); }`);
  test(
    false,
    [],
    `(789).qux\`foo\${123}bar\${456}\\n\``,
    null,
    `{
      #Reflect.get(${convert(`789`)}, "qux")(
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
        456); }`);
  test(
    false,
    [],
    `(789)["qux"]\`foo\${123}bar\${456}\\n\``,
    null,
    `{
      #Reflect.get(${convert(`789`)}, "qux")(
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
        456); }`);
  // ArrowFunctionExpression //
  test(
    false,
    [],
    `() => { 123; }`,
    null,
    `{
      ${Lang._generate_expression(
        Visit.closure(
          Scope._use_strict(
            Scope._make_root()),
          Parse.script(`(() => { 123; });`).body[0].expression,
          null))}; }`);
  // FunctionExpression //
  test(
    true,
    [],
    `function () { 123; }`,
    null,
    `{
      let _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        ${Lang._generate_expression(
          Visit.closure(
            Scope._use_strict(
              Scope._make_root()),
            Parse.script(`(function () { 123; });`).body[0].expression,
            {
              prototype: Scope._test_box("_prototype")}))}); }`);
  // ClassExpression && Super && This //
  test(
    false,
    [],
    `(class extends 123 {
      constructor () {
        super.foo;
        super(456, 789);
        super(901, ...234);
        this; } })`,
    null,
    `{
      let _prototype, _constructor;
      (
        (
          (123 === null) ?
          void 0 :
          #Reflect.construct(
            #Object,
            {
              __proto__:null,
              length: 0},
            123)),
        (
          _prototype = {__proto__:#Reflect.get(123, "prototype")},
          (
            _constructor = #Reflect.get(
              #Object.defineProperty(
                _prototype,
                "constructor",
                {
                  __proto__: null,
                  value: #Object.defineProperty(
                    #Object.defineProperty(
                      #Object.defineProperty(
                        constructor () {
                          let $arguments, $this, $0newtarget;
                          $arguments = void 0;
                          $0newtarget = (
                            new.target ?
                            new.target :
                            throw new #TypeError("Closure must be invoked as a constructor"));
                          $this = null;
                          $arguments = #Object.assign(
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
                            let _object;
                            (
                              _object = (
                                $this ?
                                #Reflect.getPrototypeOf(_prototype) :
                                throw new #ReferenceError("Super constructor must be called before accessing super property")),
                              #Reflect.get(
                                (
                                  (
                                    (_object === null) ?
                                    true :
                                    (_object === void 0)) ?
                                  _object :
                                  #Object(_object)),
                                "foo"));
                            (
                              $this = (
                                new (
                                  $this ?
                                  throw new #ReferenceError("Super constructor may only be called once") :
                                  123)
                                (456, 789)),
                              $this);
                            (
                              $this = #Reflect.construct(
                                (
                                  $this ?
                                  throw new #ReferenceError("Super constructor may only be called once") :
                                  123),
                                #Array.prototype.concat(
                                  @#Array.of(),
                                  #Array.of(901),
                                  234)),
                              $this);
                            (
                              $this ?
                              $this :
                              throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")); }
                          return (
                            $this ?
                            $this :
                            throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor")); },
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
                    "prototype",
                    {
                      __proto__: null,
                      value: _prototype,
                      writable: false,
                      enumerable: false,
                      configurable: false}),
                  writable: true,
                  enumerable: false,
                  configurable: true}),
              "constructor"),
            _constructor))); }`);
  /////////////////
  // Environment //
  /////////////////
  // ThisExpression //
  test(
    false,
    [
      {kind:"var", name:"this"}],
    `this`,
    null,
    `{
      let $this;
      $this = void 0;
      $this; }`);
  // test(
  //   Scope._extend_binding_super(
  //     Scope._make_global(),
  //     Scope._primitive_box(123)),
  //   null,
  //   ["this"],
  //   `this`,
  //   ["$this"],
  //   `(
  //     $this ?
  //     $this :
  //     throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"))`);
  // MetaProperty //
  test(
    false,
    [
      {kind:"var", name:"new.target"}],
    {
      type: "MetaProperty",
      meta: {
        type: "Identifier",
        name: "new"},
      property: {
        type: "Identifier",
        name: "target"}},
    null,
    `{
      let $0newtarget;
      $0newtarget = void 0;
      $0newtarget;}`);
  test(
    false,
    [
      {kind:"var", name:"import.meta"}],
    {
      type: "MetaProperty",
      meta: {
        type: "Identifier",
        name: "import"},
      property: {
        type: "Identifier",
        name: "meta"}},
    null,
    `{
      let $0importmeta;
      $0importmeta = void 0;
      $0importmeta;}`);
  Assert.throws(
    () => Scope.MODULE(
      Scope._make_root(),
      false,
      [],
      (scope) => Visit.expression(
        scope,
        {
          type: "MetaProperty",
          meta: {
            type: "Identifier",
            name: "foo"},
          property: {
            type: "Identifier",
            name: "bar"}},
        null)),
    new global.Error("Aran currently only support the meta properties new.target and import.meta"));
  // Super //
  // test(
  //   Scope._extend_binding_self(
  //     Scope._extend_binding_super(
  //       Scope._make_global(),
  //       null),
  //     Scope._primitive_box(123)),
  //   null,
  //   [],
  //   {type: "Super"},
  //   [],
  //   `#Reflect.getPrototypeOf(123)`);
  // test(
  //   Scope._extend_binding_self(
  //     Scope._extend_binding_super(
  //       Scope._make_global(),
  //       Scope._primitive_box(456)),
  //     Scope._primitive_box(123)),
  //   null,
  //   ["this"],
  //   {type: "Super"},
  //   ["$this"],
  //   `(
  //     $this ?
  //     #Reflect.getPrototypeOf(123) :
  //     throw new #ReferenceError("Must call super constructor in derived class before accessing 'this' or returning from derived constructor"))`);
  // Identifier //
  test(
    false,
    [
      {kind: "var", name:"x"}],
    `x`,
    null,
    `{
      let $x;
      $x = void 0;
      $x; }`);
  // AssignmentExpression >> MemberExpression >> Special Case #1 >> (dropped && strict && =)
  test(
    true,
    [],
    `123[456] = 789`,
    {dropped: true},
    `{
      (
        #Reflect.set(123, 456, 789) ?
        true :
        throw new #TypeError("Cannot set object property")); }`);
  test(
    true,
    [],
    `(123).foo = 789`,
    {dropped: true},
    `{
      (
        #Reflect.set(123, "foo", 789) ?
        true :
        throw new #TypeError("Cannot set object property")); }`);
  // AssignmentExpression >> MemberExpression >> Special Case #2 >> (dropped && !strict && =)
  test(
    false,
    [],
    `123[456] = 789`,
    {dropped: true},
    `{
      #Reflect.set(
        ${convert(`123`)},
        456,
        789); }`);
  test(
    false,
    [],
    `(123).foo = 789`,
    {dropped: true},
    `{
      #Reflect.set(
        ${convert(`123`)},
        "foo",
        789); }`);
  // AssignmentExpression >> MemberExpression >> Special Case #3 >> (dropped && +=)
  test(
    false,
    [],
    `123[456] += 789`,
    {dropped: true},
    `{
      #Reflect.set(
        ${convert(`123`)},
        456,
        (
          #Reflect.get(
            ${convert(`123`)},
            456) +
          789)); }`);
  test(
    true,
    [],
    `(123).foo += 789`,
    {dropped: true},
    `{
      (
        #Reflect.set(
          123,
          "foo",
          (
            #Reflect.get(${convert(`123`)}, "foo") +
            789)) ?
        true :
        throw new #TypeError("Cannot set object property")); }`);
  // AssignmentExpression >> MemberExpression >> General Case //
  test(
    true,
    [],
    `123[456] = 789`,
    null,
    `{
      (
        #Reflect.set(
          123,
          456,
          789) ?
        789 :
        throw new #TypeError("Cannot set object property")); }`);
  test(
    false,
    [],
    `123[456] += 789`,
    null,
    `{
      let _result;
      (
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
          _result)); }`);
  // AssignmentExpression >> Identifier //
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `x = () => { 123; }`,
    {dropped: true},
    `{
      let $x;
      $x = void 0;
      $x = ${Lang._generate_expression(
        Visit.closure(
          Scope._make_root(),
          Parse.script(`(() => { 123; });`).body[0].expression,
          {name:Scope._primitive_box("x")}))}; }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `x += () => { 123; }`,
    null,
    `{
      let $x, _result;
      $x = void 0;
      (
        _result = (
          $x +
          ${Lang._generate_expression(
            Visit.closure(
              Scope._make_root(),
              Parse.script(`(() => { 123; });`).body[0].expression,
              null))}),
        ($x = _result, _result)); }`);
  // AssignmentExpression >> Pattern //
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `{foo:x} = 123`,
    {
      __proto__: null,
      dropped: true},
    `{
      let $x;
      $x = void 0;
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
            "foo"))); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `{foo:x} = 123`,
    null,
    `{
      let $x;
      $x = void 0;
      (
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
        123); }`);
  // UpdateExpression >> MemberExpression >> dropped //
  test(
    false,
    [],
    `++(123).foo`,
    {
      __proto__: null,
      dropped: true},
    `{
      #Reflect.set(
        ${convert(`123`)},
        "foo",
        (
          #Reflect.get(${convert(`123`)}, "foo") +
          1)); }`);
  test(
    true,
    [],
    `++123[456]`,
    {
      __proto__: null,
      dropped: true},
    `{
      (
        #Reflect.set(
          123,
          456,
          (
            #Reflect.get(${convert(`123`)}, 456) +
            1)) ?
        true :
        throw new #TypeError("Cannot set object property")); }`);
  // UpdateExpression >> MemberExpression >> !dropped //
  test(
    false,
    [],
    `++123[456]`,
    null,
    `{
      let _result;
      (
        _result = (
          #Reflect.get(${convert(`123`)}, 456) +
          1),
        (
          #Reflect.set(
            ${convert(`123`)},
            456,
            _result),
          _result)); }`);
  test(
    true,
    [],
    `123[456]++`,
    null,
    `{
      let _result;
      (
        _result = #Reflect.get(${convert(`123`)}, 456),
        (
          #Reflect.set(
            123,
            456,
            (_result + 1)) ?
          _result :
          throw new #TypeError("Cannot set object property"))); }`);
  // UpdateExpression >> Identifier //
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `++x`,
    {
      __proto__: null,
      dropped: true},
    `{
      let $x;
      $x = void 0;
      $x = ($x + 1); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `++x`,
    null,
    `{
      let $x, _result;
      $x = void 0;
      (
        _result = ($x + 1),
        (
          $x = _result,
          _result)); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `x++`,
    null,
    `{
      let $x, _result;
      $x = void 0;
      (
        _result = $x,
        (
          $x = (_result + 1),
          _result)); }`);
  /////////////
  // Control //
  /////////////
  // SequenceExpression //
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `(x = 123, x = 456, x = 789)`,
    null,
    `{
      let $x;
      $x = void 0;
      (
        $x = 123,
        (
          $x = 456,
          (
            $x = 789,
            789))); }`);
  // LogicalExpression //
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `123 && (x = 456)`,
    {
      __proto__: null,
      dropped: true},
    `{
      let $x;
      $x = void 0;
      (
        123 ?
        $x = 456 :
        void 0); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `123 || (x = 456)`,
    {
      __proto__: null,
      dropped: true},
    `{
      let $x;
      $x = void 0;
      (
        123 ?
        void 0 :
        $x = 456); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `123 && (x = 456)`,
    null,
    `{
      let $x;
      $x = void 0;
      (
        123 ?
        (
          $x = 456,
          456) :
        123); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `123 || (x = 456)`,
    null,
    `{
      let $x;
      $x = void 0;
      (
        123 ?
        123 :
        (
          $x = 456,
          456)); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `123 ?? (x = 456)`,
    {
      __proto__: null,
      dropped: true},
    `{
      let $x;
      $x = void 0;
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        $x = 456 :
        void 0); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `123 ?? (x = 456)`,
    null,
    `{
      let $x;
      $x = void 0;
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        (
          $x = 456,
          456) :
        123); }`);
  // ConditionalExpression //
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `123 ? (x = 456) : (x = 789)`,
    {
      __proto__: null,
      dropped: true},
    `{
      let $x;
      $x = void 0;
      (
        123 ?
        $x = 456 :
        $x = 789); }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `123 ? (x = 456) : (x = 789)`,
    {
      __proto__: null,
      dropped: false},
    `{
      let $x;
      $x = void 0;
      (
        123 ?
        (
          $x = 456,
          456) :
        (
          $x = 789,
          789)); }`);
  /////////////////
  // Combination //
  /////////////////
  // Array //
  test(
    true,
    [],
    `[123, 456, 789]`,
    null,
    `{
      #Array.of(123, 456, 789); }`);
  test(
    true,
    [],
    `[123,, 456, ...789]`,
    null,
    `{
      #Array.prototype.concat(
        @#Array.of(),
        #Array.of(123),
        #Array(1),
        #Array.of(456),
        789); }`);
  // Object //
  test(
    true,
    [],
    `{foo:123, ["bar"]:456, "qux":789}`,
    null,
    `{
      {
        __proto__: #Object.prototype,
        foo: 123,
        bar: 456,
        qux: 789}; }`);
  test(
    true,
    [],
    `{__proto__:123, foo:456, bar:789}`,
    null,
    `{
      {
        __proto__: (
          (
            (typeof 123 === "object") ?
            true :
            (typeof 123 === "function")) ?
          123 :
          #Object.prototype),
        foo: 456,
        bar: 789}; }`);
  test(
    true,
    [],
    `{foo: 123, __proto__:!456, bar:789}`,
    null,
    `{
      let _raw_prototype, _cooked_prototype;
      #Object.setPrototypeOf(
        {
          __proto__: null,
          foo: 123,
          bar: (
            (
              _raw_prototype = !456,
              _cooked_prototype = (
                (
                  (typeof _raw_prototype === "object") ?
                  true :
                  (typeof _raw_prototype === "function")) ?
                _raw_prototype :
                #Object.prototype)),
            789)},
        _cooked_prototype); }`);
  test(
    true,
    [],
    `{foo: 123, bar: 456, __proto__:789}`,
    null,
    `{
      #Object.setPrototypeOf(
        {
          __proto__: null,
          foo: 123,
          bar: 456},
        (
          (
            (typeof 789 === "object") ?
            true :
            (typeof 789 === "function")) ?
          789 :
          #Object.prototype)); }`);
  test(
    true,
    [],
    `{...123, __proto__:456, foo:789, bar: () => { 901 } }`,
    null,
    `{
      #Object.defineProperty(
        #Object.defineProperty(
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
            configurable: true}),
        "bar",
        {
          __proto__: null,
          value: ${Lang._generate_expression(
            Visit.closure(
              Scope._make_root(),
              Parse.script(`(() => { 901; });`).body[0].expression,
              {name:Scope._primitive_box("bar")}))},
          writable: true,
          enumerable: true,
          configurable: true}); }`);
  test(
    true,
    [],
    `{foo (arguments) { super.foo; } }`,
    null,
    `{
      let _self;
      (
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
                  $arguments = #Reflect.get(arguments, 0);
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
                        "foo")); }
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
                configurable: true})},
          _self)); }`);
  test(
    true,
    [],
    `{ get ["foo"] () { super.foo; }, bar (arguments) { super.bar } }`,
    null,
    `{
      let _self;
      (
        _self = void 0,
        (
          _self = #Object.defineProperty(
            #Object.defineProperty(
              {__proto__:#Object.prototype},
              "foo",
              {
                __proto__: null,
                get: #Object.defineProperty(
                  #Object.defineProperty(
                    method () {
                      let $newtarget, $arguments, $this;
                      $arguments = void 0;
                      $newtarget = void 0;
                      $this = this;
                      $arguments = #Object.assign(
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
                            "foo")); }
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
                    value: ("get " + "foo"),
                    writable: false,
                    enumerable: false,
                    configurable: true}),
                enumerable: true,
                configurable: true}),
            "bar",
            {
              __proto__: null,
              value: #Object.defineProperty(
                #Object.defineProperty(
                  method () {
                    let $$this, $$0newtarget, $$arguments;
                    $$0newtarget = void 0;
                    $$this = this;
                    $$arguments = #Reflect.get(arguments, 0);
                    {
                      let _object;
                      (
                        _object = #Reflect.getPrototypeOf(_self),
                        #Reflect.get(
                          (
                            (
                              (_object === null) ?
                              true :
                              (_object === void 0)) ?
                            _object :
                            #Object(_object)),
                          "bar")); }
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
                  value: "bar",
                  writable: false,
                  enumerable: false,
                  configurable: true}),
              writable: true,
              enumerable: true,
              configurable: true}),
          _self)); }`);
  test(
    true,
    [],
    `{"foo": () => { 123; } }`,
    null,
    `{
      {
        __proto__: #Object.prototype,
        foo: ${Lang._generate_expression(
          Visit.closure(
            Scope._make_root(),
            Parse.script(`(() => { 123; });`).body[0].expression,
            {name:Scope._primitive_box("foo")}))}}; }`);
  // ImportExpression //
  test(
    true,
    [],
    {
      type: "ImportExpression",
      source: {
        type: "Literal",
        value: 123}},
    null,
    `{
      import 123;}`);
  // UnaryExpression //
  test(
    true,
    [],
    `!123`,
    null,
    `{
      !123; }`);
  test(
    true,
    [
      {kind:"var", name:"x"}],
    `typeof x`,
    null,
    `{
      let $x;
      $x = void 0;
      typeof $x; }`);
  test(
    false,
    [
      {kind:"var", name:"x"}],
    `delete x`,
    null,
    `{
      let $x;
      $x = void 0;
      false; }`);
  test(
    false,
    [],
    `delete (123).foo`,
    null,
    `{
      #Reflect.deleteProperty(
        (
          (
            (123 === null) ?
            true :
            (123 === void 0)) ?
          123 :
          #Object(123)),
        "foo"); }`);
  test(
    false,
    [],
    `delete (123)[456]`,
    null,
    `{
      #Reflect.deleteProperty(
        (
          (
            (123 === null) ?
            true :
            (123 === void 0)) ?
          123 :
          #Object(123)),
        456); }`);
  test(
    true,
    [],
    `delete !123`,
    null,
    `{
      (!123, true); }`);
  // BinaryExpression //
  test(
    true,
    [],
    `123 + 456`,
    null,
    `{
      (123 + 456); }`);
  // MemberExpression && ChainExpression //
  test(
    true,
    [],
    `123[456]`,
    null,
    `{
      #Reflect.get(
        (
          (
            (123 === null) ?
            true :
            (123 === void 0)) ?
          123 :
          #Object(123)),
        456); }`);
  test(
    true,
    [],
    `(123).foo`,
    null,
    `{
      #Reflect.get(
        (
          (
            (123 === null) ?
            true :
            (123 === void 0)) ?
          123 :
          #Object(123)),
        "foo"); }`);
  test(
    true,
    [],
    `123?.[456]`,
    null,
    `{
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        void 0 :
        #Reflect.get(
          #Object(123),
          456)); }`);
  test(
    true,
    [],
    `(123)?.foo`,
    null,
    `{
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        void 0 :
        #Reflect.get(
          #Object(123),
          "foo")); }`);
  // NewExpression //
  test(
    true,
    [],
    `new 123(456, 789)`,
    null,
    `{
      new 123(456, 789); }`);
  test(
    true,
    [],
    `new 123(456, ...789)`,
    null,
    `{
      #Reflect.construct(
        123,
        #Array.prototype.concat(
          @#Array.of(),
          #Array.of(456),
          789)); }`);
  // // CallExpression >> SuperCall //
  // test(
  //   Scope._extend_binding_super(
  //     Scope._extend_use_strict(
  //       Scope._make_global()),
  //     Scope._primitive_box(123)),
  //   null,
  //   ["this"],
  //   {
  //     type: "CallExpression",
  //     optional: false,
  //     callee: {
  //       type: "Super"},
  //     arguments: [
  //       {
  //         type: "Literal",
  //         value: 456},
  //       {
  //         type: "Literal",
  //         value: 789}]},
  //   ["$this"],
  //   `(
  //     $this ?
  //     throw new #ReferenceError("Super constructor may only be called once") :
  //     (
  //       $this = new 123(456, 789),
  //       $this))`);
  // test(
  //   Scope._extend_binding_super(
  //     Scope._extend_use_strict(
  //       Scope._make_global()),
  //     Scope._primitive_box(123)),
  //   null,
  //   ["this"],
  //   {
  //     type: "CallExpression",
  //     optional: false,
  //     callee: {
  //       type: "Super"},
  //     arguments: [
  //       {
  //         type: "Literal",
  //         value: 456},
  //       {
  //         type: "SpreadElement",
  //         argument: {
  //           type: "Literal",
  //           value: 789}}]},
  //   ["$this"],
  //   `(
  //     $this ?
  //     throw new #ReferenceError("Super constructor may only be called once") :
  //     (
  //       $this = #Reflect.construct(
  //         123,
  //         #Array.prototype.concat(
  //           @#Array.of(),
  //           #Array.of(456),
  //           789)),
  //       $this))`);
  // CallExpression >> DirectEvalCall //
  test(
    false,
    [
      {kind:"var", name:"eval"}],
    `eval(!123, !456)`,
    null,
    `{
      let $eval, _eval, _arg0, _arg1;
      $eval = void 0;
      (
        _eval = $eval,
        (
          _arg0 = !123,
          (
            _arg1 = !456,
            (
              (_eval === #eval) ?
              eval(_arg0) :
              _eval(_arg0, _arg1))))); }`);
  test(
    false,
    [
      {kind:"var", name:"eval"}],
    `eval?.(!123, !456)`,
    null,
    `{
      let $eval, _eval, _arg0, _arg1;
      $eval = void 0;
      (
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
                _eval(_arg0, _arg1)))))); }`);
  // CallExpression >> MemberExpression
  test(
    true,
    [],
    `123[456](789)`,
    null,
    `{
      (
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
          789)); }`);
  test(
    true,
    [],
    `(123).foo(789)`,
    null,
    `{
      (
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
          789)); }`);
  test(
    true,
    [],
    `(123)?.[456]?.(789)`,
    null,
    `{
      let _callee;
      (
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
            789))); }`);
  test(
    true,
    [],
    `(123)?.foo?.(789)`,
    null,
    `{
      let _callee;
      (
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
            789))); }`);
  test(
    true,
    [],
    `123(456, ...789)`,
    null,
    `{
      #Reflect.apply(
        123,
        void 0,
        #Array.prototype.concat(
          @#Array.of(),
          #Array.of(456),
          789)); }`);
});

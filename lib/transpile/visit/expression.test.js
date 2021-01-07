"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const ParseExternal = require("../../parse-external.js");
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

const spread = (code) => `(
  arrow () {
    let result, length, iterable, iterator, step;
    result = {__proto__:null, [#Symbol.isConcatSpreadable]:true};
    length = 0;
    iterable = #Reflect.get(#Reflect.get(input, "arguments"), 0);
    iterator = #Reflect.get(iterable, #Symbol.iterator)(@iterable);
    step = void 0;
    while (
      (
        step = #Reflect.get(iterator, "next")(@iterator),
        !#Reflect.get(step, "done")))
      {
        #Reflect.set(result, length, #Reflect.get(step, "value"));
        length = (length + 1); }
    #Reflect.set(result, "length", length);
    return result; }
  (${code}))`;

const make_variable = (kind, name) => ({
  kind,
  name,
  ghost: false,
  exports: []
});

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
  const test = (scope, variables, code1, context, code2) => Lang._match(
    Scope.MODULE(
      scope,
      variables,
      (scope) => Tree.Lift(
        Visit.expression(
          scope,
          (
            typeof code1 === "string" ?
            ParseExternal(`(${code1});`).body[0].expression :
            code1),
          context))),
    Lang.PARSE_BLOCK(code2),
    Assert);
  // YieldExpression //
  test(
    Scope._make_root(),
    [],
    {
      type: "YieldExpression",
      delegate: false,
      argument: {
        type: "Literal",
        value: 123 } },
    null,
    `{
      yield 123; }`);
  test(
    Scope._make_root(),
    [],
    {
      type: "YieldExpression",
      delegate: false,
      argument: null },
    null,
    `{
      yield void 0; }`);
  test(
    Scope._make_root(),
    [],
    {
      type: "YieldExpression",
      delegate: true,
      argument: {
        type: "Literal",
        value: 123 } },
    null,
    `{
      yield * 123; }`);
  // Assert.throws(
  //   () => Scope.MODULE(
  //     Scope._make_root(),
  //     [],
  //     (scope) => Visit.expression(
  //       scope,
  //       {
  //         type: "YieldExpression",
  //         argument: {
  //           type: "Literal",
  //           value: null}},
  //       null)),
  //   new global.Error(`yield expression should never be reached`));
  // AwaitExpression //
  test(
    Scope._make_root(),
    [],
    {
      type: "AwaitExpression",
      argument: {
        type: "Literal",
        value: 123 } },
    null,
    `{
      await 123; }`);
  // Assert.throws(
  //   () => Scope.MODULE(
  //     Scope._make_root(),
  //     [],
  //     (scope) => Visit.expression(
  //       scope,
  //       {
  //         type: "AwaitExpression",
  //         argument: {
  //           type: "Literal",
  //           value: null}},
  //       null)),
  //   new global.Error(`await expression should never be reached`));
  /////////////
  // Literal //
  /////////////
  // Literal //
  test(
    Scope._make_root(),
    [],
    `123`,
    null,
    `{
      123; }`);
  test(
    Scope._make_root(),
    [],
    `/abc/g`,
    null,
    `{
      new #RegExp("abc", "g"); }`);
  // TemplateLiteral //
  test(
    Scope._make_root(),
    [],
    `\`foo\``,
    null,
    `{
      "foo";}`);
  test(
    Scope._make_root(),
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
    Scope._make_root(),
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
    Scope._make_root(),
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
    Scope._make_root(),
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
    Scope._make_root(),
    [],
    `() => { 123; }`,
    null,
    `{
      ${Lang._generate(
        Visit.closure(
          Scope._use_strict(
            Scope._make_root()),
          ParseExternal(`(() => { 123; });`).body[0].expression,
          null))}; }`);
  // FunctionExpression //
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `function () { 123; }`,
    null,
    `{
      let _prototype;
      (
        _prototype = {__proto__:#Object.prototype},
        ${Lang._generate(
          Visit.closure(
            Scope._use_strict(
              Scope._make_root()),
            ParseExternal(`(function () { 123; });`).body[0].expression,
            {
              prototype: Scope._test_box("_prototype")}))}); }`);
  // ClassExpression && Super && This //
  test(
    Scope._make_root(),
    [],
    `(class c {})`,
    null,
    `{
      ${Lang._generate(
        Visit.class(
          Scope._use_strict(
            Scope._make_root()),
          ParseExternal(`(class c {})`).body[0].expression,
          null))}; }`);
  /////////////////
  // Environment //
  /////////////////
  // ThisExpression //
  test(
    Scope._make_root(),
    [
      make_variable("var", "this")],
    `this`,
    null,
    `{
      let $this;
      $this = void 0;
      $this; }`);
  test(
    Scope._make_root(
      {
        sort: "derived-constructor"}),
    [
      make_variable("var", "this")],
    {type: "ThisExpression"},
    null,
    `{
      let $this;
      $this = void 0;
      (
        $this ?
        $this :
        throw new #ReferenceError("Cannot read variable named 'this' before calling super constructor")); }`);
  // MetaProperty //
  test(
    Scope._make_root(),
    [
      make_variable("var", "new.target")],
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
    Scope._make_root(),
    [
      make_variable("var", "import.meta")],
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
    new global.Error("Unknown meta property"));
  // Super //
  // test(
  //   Scope._make_root(
  //     {
  //       self: Scope._primitive_box(123)}),
  //   [],
  //   {type: "Super"},
  //   null,
  //   `{
  //     #Reflect.getPrototypeOf(123); }`);
  // test(
  //   Scope._make_root(
  //     {
  //       self: Scope._primitive_box(123),
  //       super: Scope._primitive_box(456) }),
  //   [
  //     make_variable("var", "this")],
  //   {type: "Super"},
  //   null,
  //   `{
  //     let $this;
  //     $this = void 0;
  //     (
  //       $this ?
  //       #Reflect.getPrototypeOf(123) :
  //       throw new #ReferenceError("Super constructor must be called before accessing super property")); }`);
  // Identifier //
  test(
    Scope._make_root(),
    [
      make_variable("var", "x")],
    `x`,
    null,
    `{
      let $x;
      $x = void 0;
      $x; }`);
  // AssignmentExpression >> MemberExpression >> Special Case #1 >> (dropped && strict && =)
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `123[456] = 789`,
    {dropped: true},
    `{
      (
        #Reflect.set(123, 456, 789) ?
        true :
        throw new #TypeError("Cannot set object property")); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._make_root(),
    [],
    `123[456] = 789`,
    {dropped: true},
    `{
      #Reflect.set(
        ${convert(`123`)},
        456,
        789); }`);
  test(
    Scope._make_root(),
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
    Scope._make_root(),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._make_root(),
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
    `x = () => { 123; }`,
    {dropped: true},
    `{
      let $x;
      $x = void 0;
      $x = ${Lang._generate(
        Visit.closure(
          Scope._make_root(),
          ParseExternal(`(() => { 123; });`).body[0].expression,
          {name:Scope._primitive_box("x")}))}; }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
    `x += () => { 123; }`,
    null,
    `{
      let $x, _result;
      $x = void 0;
      (
        _result = (
          $x +
          ${Lang._generate(
            Visit.closure(
              Scope._make_root(),
              ParseExternal(`(() => { 123; });`).body[0].expression,
              null))}),
        ($x = _result, _result)); }`);
  // AssignmentExpression >> Pattern //
  test(
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
    `++x`,
    {
      __proto__: null,
      dropped: true},
    `{
      let $x, _old;
      $x = void 0;
      (
        _old = $x,
        $x = (
          _old +
          (
            (typeof _old === "bigint") ?
            1n :
            1))); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
    `x++`,
    null,
    `{
      let $x, _old;
      $x = void 0;
      (
        _old = $x,
        (
          $x = (
            _old +
            (
              (typeof _old === "bigint") ?
              1n :
              1)),
          _old)); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
    `++x`,
    null,
    `{
      let $x, _old, _new;
      $x = void 0;
      (
        _old = $x,
        (
          _new = (
            _old +
            (
              (typeof _old === "bigint") ?
              1n :
              1)),
          (
            $x = _new,
            _new))); }`);
  test(
    Scope._make_root(),
    [],
    `++(123)[456]`,
    {
      __proto__: null,
      dropped: true},
    `{
      let _old;
      (
        _old = #Reflect.get(${convert(`123`)}, 456),
        #Reflect.set(
          ${convert(`123`)},
          456,
          (
            _old +
            (
              (typeof _old === "bigint") ?
              1n :
              1)))); }`);
  test(
    Scope._make_root({strict:true}),
    [],
    `++(123)[456]`,
    {
      __proto__: null,
      dropped: true},
    `{
      let _old;
      (
        _old = #Reflect.get(${convert(`123`)}, 456),
        (
          #Reflect.set(
            123,
            456,
            (
              _old +
              (
                (typeof _old === "bigint") ?
                1n :
                1))) ?
          true :
          throw new #TypeError("Cannot set object property"))); }`);
  // test(
  //   Scope._use_strict(
  //     Scope._make_root()),
  //   [],
  //   `++123[456]`,
  //   {
  //     __proto__: null,
  //     dropped: true},
  //   `{
  //     (
  //       #Reflect.set(
  //         123,
  //         456,
  //         (
  //           #Reflect.get(${convert(`123`)}, 456) +
  //           1)) ?
  //       true :
  //       throw new #TypeError("Cannot set object property")); }`);
  // // UpdateExpression >> MemberExpression >> !dropped //
  // test(
  //   Scope._make_root(),
  //   [],
  //   `++123[456]`,
  //   null,
  //   `{
  //     let _result;
  //     (
  //       _result = (
  //         #Reflect.get(${convert(`123`)}, 456) +
  //         1),
  //       (
  //         #Reflect.set(
  //           ${convert(`123`)},
  //           456,
  //           _result),
  //         _result)); }`);
  // test(
  //   Scope._use_strict(
  //     Scope._make_root()),
  //   [],
  //   `123[456]++`,
  //   null,
  //   `{
  //     let _result;
  //     (
  //       _result = #Reflect.get(${convert(`123`)}, 456),
  //       (
  //         #Reflect.set(
  //           123,
  //           456,
  //           (_result + 1)) ?
  //         _result :
  //         throw new #TypeError("Cannot set object property"))); }`);
  // // UpdateExpression >> Identifier //
  // test(
  //   Scope._use_strict(
  //     Scope._make_root()),
  //   [
  //     make_variable("var", "x")],
  //   `++x`,
  //   {
  //     __proto__: null,
  //     dropped: true},
  //   `{
  //     let $x;
  //     $x = void 0;
  //     $x = ($x + 1); }`);
  // test(
  //   Scope._use_strict(
  //     Scope._make_root()),
  //   [
  //     make_variable("var", "x")],
  //   `++x`,
  //   null,
  //   `{
  //     let $x, _result;
  //     $x = void 0;
  //     (
  //       _result = ($x + 1),
  //       (
  //         $x = _result,
  //         _result)); }`);
  // test(
  //   Scope._use_strict(
  //     Scope._make_root()),
  //   [
  //     make_variable("var", "x")],
  //   `x++`,
  //   null,
  //   `{
  //     let $x, _result;
  //     $x = void 0;
  //     (
  //       _result = $x,
  //       (
  //         $x = (_result + 1),
  //         _result)); }`);
  /////////////
  // Control //
  /////////////
  // SequenceExpression //
  test(
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
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
  // ArrayExpression //
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `[123, 456, 789]`,
    null,
    `{
      #Array.of(123, 456, 789); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `[123,, 456, ...789]`,
    null,
    `{
      #Array.prototype.concat(
        @#Array.of(),
        #Array.of(123),
        {
          __proto__: null,
          length: 1,
          [#Symbol.isConcatSpreadable]: true},
        #Array.of(456),
        ${spread(`789`)}); }`);
  // Object //
  test(
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
          value: ${Lang._generate(
            Visit.closure(
              Scope._make_root(),
              ParseExternal(`(() => { 901; });`).body[0].expression,
              {name:Scope._primitive_box("bar")}))},
          writable: true,
          enumerable: true,
          configurable: true}); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `{ foo () { 123; } }`,
    null,
    `{
      let _super;
      (
        _super = {
          __proto__: null,
          constructor: null,
          prototype: null},
        (
          #Reflect.set(
            _super,
            "prototype",
            {
              __proto__: #Object.prototype,
              foo: ${Lang._generate(
                Visit.closure(
                  Scope._use_strict(
                    Scope._make_root()),
                  ParseExternal(`(function () { 123; });`).body[0].expression,
                  {
                    sort: "method",
                    super: Scope._test_box("_super"),
                    name:Scope._primitive_box("foo")}))}}),
          #Reflect.get(_super, "prototype"))); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `{ get ["foo"] () { super.foo; }, bar () { super.bar } }`,
    null,
    `{
      let _super;
      (
        _super = {
          __proto__: null,
          constructor: null,
          prototype: null},
        (
          #Reflect.set(
            _super,
            "prototype",
            #Object.defineProperty(
              #Object.defineProperty(
                {__proto__:#Object.prototype},
                "foo",
                {
                  __proto__: null,
                  get: ${global.Reflect.apply(
                    global.String.prototype.replace,
                    Lang._generate(
                      Visit.closure(
                        Scope._use_strict(
                          Scope._make_root()),
                        ParseExternal(`(function () { 123; });`).body[0].expression,
                        {
                          sort: "method",
                          name: Scope._primitive_box("foo"),
                          accessor: "get",
                          super: Scope._test_box("_super")})),
                    // N.B. $ escape with String.prototype.replace!
                    [
                      `123;`,
                      `#Reflect.get(
                          #Reflect.getPrototypeOf(
                            #Reflect.get($$$super, "prototype")),
                          "foo");`])},
                  enumerable: true,
                  configurable: true}),
              "bar",
              {
                __proto__: null,
                value: ${global.Reflect.apply(
                  global.String.prototype.replace,
                  Lang._generate(
                    Visit.closure(
                      Scope._use_strict(
                        Scope._make_root()),
                      ParseExternal(`(function () { 123; });`).body[0].expression,
                      {
                        sort: "method",
                        name: Scope._primitive_box("bar"),
                        super: Scope._test_box("_super")})),
                  // N.B. $ escape with String.prototype.replace!
                  [
                    `123;`,
                    `#Reflect.get(
                        #Reflect.getPrototypeOf(
                          #Reflect.get($$$super, "prototype")),
                        "bar");`])},
                writable: true,
                enumerable: true,
                configurable: true})),
          #Reflect.get(_super, "prototype"))); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `{"foo": () => { 123; } }`,
    null,
    `{
      {
        __proto__: #Object.prototype,
        foo: ${Lang._generate(
          Visit.closure(
            Scope._make_root(),
            ParseExternal(`(() => { 123; });`).body[0].expression,
            {name:Scope._primitive_box("foo")}))}}; }`);
  // ImportExpression //
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    {
      type: "ImportExpression",
      source: {
        type: "Literal",
        value: 123}},
    null,
    `{
      require 123;}`);
  // UnaryExpression //
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `!123`,
    null,
    `{
      !123; }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [
      make_variable("var", "x")],
    `typeof x`,
    null,
    `{
      let $x;
      $x = void 0;
      typeof $x; }`);
  test(
    Scope._make_root(),
    [
      make_variable("var", "x")],
    `delete x`,
    null,
    `{
      let $x;
      $x = void 0;
      false; }`);
  test(
    Scope._make_root(),
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
    Scope._make_root(),
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
    Scope._use_strict(
      Scope._make_root()),
    [],
    `delete !123`,
    null,
    `{
      (!123, true); }`);
  // BinaryExpression //
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `123 + 456`,
    null,
    `{
      (123 + 456); }`);
  // MemberExpression && ChainExpression //
  test(
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
    [],
    `new 123(456, 789)`,
    null,
    `{
      new 123(456, 789); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `new 123(456, ...789)`,
    null,
    `{
      #Reflect.construct(
        123,
        #Array.prototype.concat(
          @#Array.of(),
          #Array.of(456),
          ${spread(`789`)})); }`);
  // CallExpression >> SuperCall //
  test(
    Scope._make_root(
      {
        strict: true,
        sort: "derived-constructor"}),
    [
      make_variable("var", "this"),
      make_variable("var", "new.target"),
      make_variable("var", "super")],
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
    null,
    `{
      let $this, $0newtarget, $super;
      $this = void 0;
      $0newtarget = void 0;
      $super = void 0;
      (
        $this ?
        throw new #ReferenceError("Super constructor may only be called once") :
        (
          $this = #Reflect.construct(
            #Reflect.get($super, "constructor"),
            #Array.prototype.concat(
              @#Array.of(),
              #Array.of(456),
              ${spread(`789`)}),
            $0newtarget),
          $this)); }`);
          test(
            Scope._make_root(
              {
                strict: true,
                sort: "derived-constructor"}),
            [
              make_variable("var", "this"),
              make_variable("var", "new.target"),
              make_variable("var", "super")],
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
            null,
            `{
              let $this, $0newtarget, $super;
              $this = void 0;
              $0newtarget = void 0;
              $super = void 0;
              (
                $this ?
                throw new #ReferenceError("Super constructor may only be called once") :
                (
                  $this = #Reflect.construct(
                    #Reflect.get($super, "constructor"),
                    #Array.of(456, 789),
                    $0newtarget),
                  $this)); }`);
  // CallExpression >> DirectEvalCall //
  test(
    Scope._make_root(),
    [
      make_variable("var", "eval")],
    `eval()`,
    null,
    `{
      let $eval, _eval;
      $eval = void 0;
      (
        _eval = $eval,
        (
          (_eval === #eval) ?
          eval(void 0) :
          _eval())); }`);
  test(
    Scope._make_root(),
    [
      make_variable("var", "eval")],
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
    Scope._make_root(),
    [
      make_variable("var", "eval")],
    `eval(!123, ...!456)`,
    null,
    `{
      let $eval, _eval, _arg0, _arg1;
      $eval = void 0;
      (
        _eval = $eval,
        (
          _arg0 = #Array.of(!123),
          (
            _arg1 = ${spread(`!456`)},
            (
              (_eval === #eval) ?
              eval(
                #Reflect.get(
                  #Array.prototype.concat(
                    @#Array.of(),
                    _arg0,
                    _arg1),
                  0)) :
              #Reflect.apply(
                _eval,
                void 0,
                #Array.prototype.concat(
                  @#Array.of(),
                  _arg0,
                  _arg1)))))); }`);
  test(
    Scope._make_root(),
    [
      make_variable("var", "eval")],
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
    [],
    `123[456](...789)`,
    null,
    `{
      #Reflect.apply(
        #Reflect.get(
          (
            (
              (123 === null) ?
              true :
              (123 === void 0)) ?
            123 :
            #Object(123)),
          456),
        123,
        #Array.prototype.concat(
          @#Array.of(),
          ${spread(`789`)} )); }`),
  test(
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
    Scope._use_strict(
      Scope._make_root()),
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
  // CallExpression
  test(
    Scope._use_strict(
      Scope._make_root()),
    [],
    `123(456, 789)`,
    null,
    `{
      123(456, 789); }`);
  test(
    Scope._use_strict(
      Scope._make_root()),
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
          ${spread(`789`)} )); }`);
});

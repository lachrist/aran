"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../tree.js")._toggle_debug_mode();

const Acorn = require("acorn");
const Expression = require("./expression.js");
const Tree = require("../tree.js");
const State = require("../state.js");
const Lang = require("../../lang/index.js");
const Scope = require("../scope/index.js");
const Completion = require("../completion.js");

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

State._run_session({nodes: [], serials: new Map(), evals: {__proto__:null}}, [], () => {
  const test = (strict, code1, context, identifiers, code2) => Lang._match_block(
    Scope.EXTEND_STATIC(
      (
        strict ?
        Scope._extend_use_strict(
          Scope._make_root()) :
        Scope._make_root()),
      {
        __proto__:null,
        "this": true,
        "new.target": true,
        "super": true,
        "x": true},
      (scope) => Tree.Bundle(
        [
          Tree.Lift(
            Scope.initialize(
              scope,
              "this",
              Tree.primitive("this"))),
          Tree.Lift(
            Scope.initialize(
              scope,
              "new.target",
              Tree.primitive("new.target"))),
          Tree.Lift(
            Scope.initialize(
              scope,
              "super",
              Tree.primitive("super"))),
          Tree.Lift(
            Scope.initialize(
              scope,
              "x",
              Tree.primitive("x"))),
          Tree.Lift(
          Expression.visit(
            scope,
            (
              code1 === "new.target" ?
              {
                type: "MetaProperty",
                meta: {
                  type: "Identifer",
                  name: "new"},
                property: {
                  type: "Identifier",
                  name: "target"}} :
              (
                code1 === "super" ?
                {type: "Super"} :
                Acorn.parse(`(${code1});`).body[0].expression)),
            context))])),
    Lang.PARSE_BLOCK(`{
      let ${identifiers.concat(["__this__", "__new_target__", "__super__", "x"]).join(", ")};
      __this__ = "this";
      __new_target__ = "new.target";
      __super__ = "super";
      x = "x";
      ${code2};}`),
    Assert);
  //YieldExpression //
  Assert.throws(
    () => Expression.visit(
      Scope._make_root(),
      {
        type: "YieldExpression",
        argument: {
          type: "Literal",
          value: null}},
      Expression._default_context),
    new Error("Unfortunately, Aran does not yet support yield expressions and generator closures."));
  //YieldExpression //
  Assert.throws(
    () => Expression.visit(
      Scope._make_root(),
      {
        type: "AwaitExpression",
        argument: {
          type: "Literal",
          value: null}},
      Expression._default_context),
    new Error("Unfortunately, Aran does not yet support await expressions and asynchronous closures."));
  /////////////
  // Literal //
  /////////////
  // Literal //
  test(
    true,
    `123`,
    Expression._default_context,
    [],
    `123`);
  test(
    true,
    `/abc/g`,
    Expression._default_context,
    [],
    `new #RegExp("abc", "g")`);
  // TemplateLiteral //
  test(
    true,
    `\`foo\``,
    Expression._default_context,
    [],
    `"foo"`);
  test(
    true,
    `\`foo\${123}bar\${456}\\n\``,
    Expression._default_context,
    [],
    `(
      (
        ("foo" + 123) +
        ("bar" + 456)) +
      "\\n")`);
  // TaggedTemplateExpression //
  test(
    true,
    `x\`foo\${123}bar\${456}\\n\``,
    Expression._default_context,
    [],
    `x(
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
    true,
    `(789).qux\`foo\${123}bar\${456}\\n\``,
    Expression._default_context,
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
    true,
    `(789)["qux"]\`foo\${123}bar\${456}\\n\``,
    Expression._default_context,
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
    true,
    `() => { 123; }`,
    Expression._default_context,
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
  test(
    true,
    `() => { 123; }`,
    {
      __proto__: Expression._default_context,
      completion: Completion._arrow},
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
    true,
    `function () { 123; }`,
    {
      __proto__: Expression._default_context,
      completion: Completion._method},
    [],
    `#Object.defineProperty(
      #Object.defineProperty(
        method () {
          let __super__, __new_target__, __this__, __arguments__;
          __super__ = #Object;
          __new_target__ = void 0;
          __this__ = THIS;
          __arguments__ = #Object.assign(
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
  test(
    true,
    `function () { 123; }`,
    Expression._default_context,
    ["_constructor"],
    `(
      _constructor = #Object.defineProperty(
        #Object.defineProperty(
          function () {
            let __new_target__, __this__, __arguments__;
            __new_target__ = NEW_TARGET;
            __this__ = (
              NEW_TARGET ?
              #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET) :
              THIS);
            __arguments__ = #Object.assign(
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
            return (__new_target__ ? __this__ : void 0);},
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
          writable: true}))`);
  // ClassExpression //
  test(
    false,
    `class {}`,
    Expression._default_context,
    ["_constructor"],
    `(
      _constructor = #Object.defineProperty(
        #Object.defineProperty(
          constructor () {
            return (
              NEW_TARGET ?
              #Reflect.construct(#Object, ARGUMENTS, NEW_TARGET) :
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
          writable: true}))`);
  // ThisExpression //
  test(
    true,
    `this`,
    Expression._default_context,
    [],
    `__this__`);
  // MetaProperty //
  test(
    true,
    `new.target`,
    Expression._default_context,
    [],
    `__new_target__`);
  Assert.throws(
    () => Expression.visit(
      Scope._make_root(),
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
  test(
    true,
    `super`,
    Expression._default_context,
    [],
    `__super__`);
  // Identifier //
  test(
    true,
    `x`,
    Expression._default_context,
    [],
    `x`);
  // AssignmentExpression //
  // MemberExpression >> Special Case #1 >> (dropped && strict && =)
  test(
    true,
    `123[456] = 789`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(
      #Reflect.set(123, 456, 789) ?
      true :
      throw new #TypeError("Cannot set object property"))`);
  test(
    true,
    `(123).foo = 789`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(
      #Reflect.set(123, "foo", 789) ?
      true :
      throw new #TypeError("Cannot set object property"))`);
  // MemberExpression >> Special Case #2 >> (dropped && !strict && =)
  test(
    false,
    `123[456] = 789`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `#Reflect.set(
      ${convert(`123`)},
      456,
      789)`);
  test(
    false,
    `(123).foo = 789`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `#Reflect.set(
      ${convert(`123`)},
      "foo",
      789)`);
  // MemberExpression >> Special Case #3 >> (dropped && +=)
  test(
    false,
    `123[456] += 789`,
    {
      __proto__: Expression._default_context,
      dropped: true},
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
    true,
    `(123).foo += 789`,
    {
      __proto__: Expression._default_context,
      dropped: true},
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
  // MemberExpression >> General Case
  test(
    true,
    `123[456] = 789`,
    Expression._default_context,
    [],
    `(
      #Reflect.set(
        123,
        456,
        789) ?
      789 :
      throw new #TypeError("Cannot set object property"))`);
  test(
    false,
    `123[456] += 789`,
    Expression._default_context,
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
  // Identifier
  test(
    true,
    `x = () => {}`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `x = #Object.defineProperty(
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
    true,
    `x += () => {}`,
    Expression._default_context,
    ["_result"],
    `(
      _result = (
        x +
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
      (x = _result, _result))`);
  // Pattern
  test(
    true,
    `{foo:x} = 123`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
      (
        void 0,
        x = #Reflect.get(
          #Object(123),
          "foo")))`);
  test(
    true,
    `{foo:x} = 123`,
    Expression._default_context,
    [],
    `(
      (
        (
          (123 === null) ?
          true :
          (123 === void 0)) ?
        throw new #TypeError("Cannot destructure 'undefined' or 'null'") :
        (
          void 0,
          x = #Reflect.get(
            #Object(123),
            "foo"))),
      123)`);
  // UpdateExpression //
  // MemberExpression >> dropped
  test(
    false,
    `++(123).foo`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `#Reflect.set(
      ${convert(`123`)},
      "foo",
      (
        #Reflect.get(${convert(`123`)}, "foo") +
        1))`);
  test(
    true,
    `++123[456]`,
    {
      __proto__: Expression._default_context,
      dropped: true},
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
  // MemberExpression >> !dropped
  test(
    false,
    `++123[456]`,
    Expression._default_context,
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
    true,
    `123[456]++`,
    Expression._default_context,
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
  // Identifier
  test(
    true,
    `++x`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `x = (x + 1)`);
  test(
    true,
    `++x`,
    Expression._default_context,
    ["_result"],
    `(
      _result = (x + 1),
      (
        x = _result,
        _result))`);
  test(
    true,
    `x++`,
    Expression._default_context,
    ["_result"],
    `(
      _result = x,
      (
        x = (_result + 1),
        _result))`);
  // Lang._match_block(
  //   Expression.visit(
  //     Scope._make_root(),
  //     Acorn.parse(`this;`).body[0].expression,
  //     context
  //     false,
  //     null),
  //   Lang.parse_expression(`123`),
  //   Assert);
  // Lang._match_expression(
  //   Expression.visit(
  //     Scope._make_root(),
  //     Acorn.parse(`/abc/g;`).body[0].expression,
  //     false,
  //     null),
  //   Lang.parse_expression(`new #RegExp("abc", "g")`),
  //   Assert);
  // ////////////////////////////////////////////////////////////////////////////
  // // 5. All but ArrowExpression && FunctionExpression with return statement //
  // ////////////////////////////////////////////////////////////////////////////
  // const test = (strict, code1, code2) => Lang._match_block(
  //   Block.REGULAR(
  //     (
  //       strict ?
  //       Scope._extend_use_strict(
  //         Scope._make_root()) :
  //       Scope._make_root()),
  //     Acorn.parse(code1).body,
  //     Completion._make_program(null)),
  //   Lang.PARSE_BLOCK(code2),
  //   Assert);
  // // Identifier //
  // test(
  //   false,
  //   `foo;`,
  //   `{
  //       (
  //         #Reflect.has(#global, "foo") ?
  //         #Reflect.get(#global, "foo") :
  //         throw new #ReferenceError("foo is not defined"));}`);
  // // UnaryExpression //
  // test(
  //   false,
  //   `!123;`,
  //   `{!123;}`);
  // test(
  //   false,
  //   `typeof x;`,
  //   `{
  //     typeof #Reflect.get(#global, "x");}`);
  // test(
  //   false,
  //   `delete (!123)[456];`,
  //   `{
  //     let _object;
  //     #Reflect.deleteProperty(
  //       (
  //         _object = !123,
  //         (
  //           (typeof _object === "object") ?
  //           _object :
  //           (
  //             (_object === void 0) ?
  //             void 0 :
  //             #Object(_object)))),
  //       456);}`);
  // test(
  //   true,
  //   `delete (!123).foo;`,
  //   `{
  //     let _object;
  //     (
  //       #Reflect.deleteProperty(
  //         (
  //           _object = !123,
  //           (
  //             (typeof _object === "object") ?
  //             _object :
  //             (
  //               (_object === void 0) ?
  //               void 0 :
  //               #Object(_object)))),
  //         "foo") ?
  //       true :
  //       throw new #TypeError("Cannot delete object property"));}`);
  // test(
  //   false,
  //   `delete foo;`,
  //   `{#Reflect.deleteProperty(#global, "foo");}`);
  // test(
  //   false,
  //   `delete 123;`,
  //   `{(123, true);}`);
  // // BinaryExpression //
  // test(
  //   false,
  //   `123 + 456;`,
  //   `{(123 + 456);}`);
  // // SequenceExpression //
  // test(
  //   false,
  //   `(123, 456, 789);`,
  //   `{((123, 456), 789);}`);
  // // Conditional //
  // test(
  //   false,
  //   `123 ? 456 : 789;`,
  //   `{(123 ? 456 : 789);}`);
  // // Logical //
  // test(
  //   false,
  //   `!123 || 456;`,
  //   `{
  //     let _test;
  //     (
  //       _test = !123,
  //       (_test ? _test : 456));}`);
  // test(
  //   false,
  //   `!123 && 456;`,
  //   `{
  //     let _test;
  //     (
  //       _test = !123,
  //       (_test ? 456 :_test));}`);
  // // test(   // Acorn limitation
  // //   false,
  // //   `!123 ?? 456;`,
  // //   `{
  // //     let _test;
  // //     (
  // //       _test = !123,
  // //       (
  // //         (
  // //           (_test === null) ?
  // //           true :
  // //           (_test === void 0)) ?
  // //         456 :
  // //         _test));}`);
  // // Member Expression //
  // test(
  //   false,
  //   `(!123).foo;`,
  //   `{
  //     let _object;
  //     #Reflect.get(
  //       (
  //         _object = !123,
  //         (
  //           (typeof _object === "object") ?
  //           _object :
  //           (
  //             (_object === void 0) ?
  //             void 0 :
  //             #Object(_object)))),
  //       "foo");}`);
  // test(
  //   false,
  //   `(!123)[456];`,
  //   `{
  //     let _object;
  //     #Reflect.get(
  //       (
  //         _object = !123,
  //         (
  //           (typeof _object === "object") ?
  //           _object :
  //           (
  //             (_object === void 0) ?
  //             void 0 :
  //             #Object(_object)))),
  //       456);}`);
  // // ArrayExpression //
  // test(
  //   false,
  //   `[123, 456];`,
  //   `{
  //     #Array.of(123, 456);}`);
  // test(
  //   false,
  //   `[123,, ...456,, 789];`,
  //   `{
  //       #Array.prototype.concat(
  //         @#Array.of(),
  //         #Array.of(123),
  //         #Array(1),
  //         456,
  //         #Array(1),
  //         #Array.of(789));}`);
  // // NewExpression //
  // test(
  //   false,
  //   `new 123(456, 789);`,
  //   `{
  //     new 123(456, 789);}`);
  // test(
  //   false,
  //   `new 123(456, ...789);`,
  //   `{
  //     #Reflect.construct(
  //       123,
  //       #Array.prototype.concat(
  //         @#Array.of(),
  //         #Array.of(456),
  //         789));}`);
  // // CallExpression //
  // test(
  //   false,
  //   `123(456, 789);`,
  //   `{
  //     123(456, 789);}`);
  // [`.foo`, `["foo"]`].forEach((code) => {
  //   test(
  //     false,
  //     `(!123)${code}(456, 789);`,
  //     `{
  //       let _object;
  //       (
  //         _object = !123,
  //         (
  //           #Reflect.get(
  //             ${obj("_object")},
  //             "foo")
  //           (@_object, 456, 789)));}`)});
  // test(
  //   false,
  //   `123(456, ...789);`,
  //   `{
  //     #Reflect.apply(
  //       123,
  //       void 0,
  //       #Array.prototype.concat(
  //         @#Array.of(),
  //         #Array.of(456),
  //         789));}`);
  // [`.foo`, `["foo"]`].forEach((code) => {
  //   test(
  //     false,
  //     `(!123)${code}(456, ...789);`,
  //     `{
  //       let _object;
  //       (
  //         _object = !123,
  //         #Reflect.apply(
  //           #Reflect.get(${obj("_object")}, "foo"),
  //           _object,
  //           #Array.prototype.concat(
  //             @#Array.of(),
  //             #Array.of(456),
  //             789)));}`)});
  // test(
  //   false,
  //   `eval(!123, !456);`,
  //   `{
  //     let _callee, _arg0, _arg1;
  //     (
  //       _callee = (
  //         #Reflect.has(#global, "eval") ?
  //         #Reflect.get(#global, "eval") :
  //         throw new #ReferenceError("eval is not defined")),
  //       (
  //         _arg0 = !123,
  //         (
  //           _arg1 = !456,
  //           (
  //             (_callee === #eval) ?
  //             eval(§_callee, §_arg0, §_arg1, _arg0) :
  //             _callee(_arg0, _arg1)))));}`);
  // // TemplateLiteral //
  // test(
  //   false,
  //   `\`foo\${123}bar\${456}qux\`;`,
  //   `{
  //     (
  //       (
  //         ("foo" + 123) +
  //         ("bar" + 456)) +
  //       "qux");}`);
  // test(
  //   false,
  //   `\`foo\`;`,
  //   `{
  //     "foo";}`);
  // // TaggedTemplateLiteral //
  // test(
  //   false,
  //   `123\`\\tfoo\${456}\\tbar\`;`,
  //   `{
  //     123(
  //       #Object.freeze(
  //         #Object.defineProperty(
  //           #Array.of("\\tfoo", "\\tbar"),
  //           "raw",
  //           {
  //             __proto__: null,
  //             value: #Object.freeze(
  //               #Array.of("\\\\tfoo", "\\\\tbar"))})),
  //       456);}`);
  // [`.foo`, `["foo"]`].forEach((code) => {
  //   test(
  //     false,
  //     `(!123)${code}\`bar\`;`,
  //     `{
  //       let _object;
  //       (
  //         _object = !123,
  //         (
  //           #Reflect.get(${obj("_object")}, "foo")
  //           (
  //             @_object,
  //             #Object.freeze(
  //               #Object.defineProperty(
  //                 #Array.of("bar"),
  //                 "raw",
  //                 {
  //                   __proto__: null,
  //                   value: #Object.freeze(
  //                     #Array.of("bar"))})))));}`)});
  //
});

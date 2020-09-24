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

const obj = (code) => `(
  (typeof ${code} === "object") ?
  ${code} :
  (
    (${code} === void 0) ?
    void 0 :
    #Object(${code})))`

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
        "super": true},
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
      let ${identifiers.concat(["__this__", "__new_target__", "__super__"]).join(", ")};
      __this__ = "this";
      __new_target__ = "new.target";
      __super__ = "super";
      ${code2};}`),
    Assert);
  /////////////////
  // Environment //
  /////////////////
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
    `(
      #Reflect.has(#global, "x") ?
      #Reflect.get(#global, "x") :
      throw new #ReferenceError("x is not defined"))`);
  // AssignmentExpression
  test(
    true,
    `123[456] = 789`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `#Reflect.set(123, 456, 789)`);
  //
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

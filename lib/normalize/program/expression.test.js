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

const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

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

State._run_session({nodes: [], serials: new Map(), scopes: {__proto__:null}}, [], () => {
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
                parse(`(${code1});`).body[0].expression)),
            context))])),
    Lang.PARSE_BLOCK(`{
      let ${identifiers.concat(["__this__", "__new_target__", "__super__", "x"]).join(", ")};
      __this__ = "this";
      __new_target__ = "new.target";
      __super__ = "super";
      x = "x";
      ${code2};}`),
    Assert);
  // YieldExpression //
  Assert.throws(
    () => Expression.visit(
      Scope._make_root(),
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
      Scope._make_root(),
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
      Scope._make_root(),
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
        method () {
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
        method () {
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
          function () {
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
    `x`);
  // AssignmentExpression >> MemberExpression >> Special Case #1 >> (dropped && strict && =)
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
  // AssignmentExpression >> MemberExpression >> Special Case #2 >> (dropped && !strict && =)
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
  // AssignmentExpression >> MemberExpression >> Special Case #3 >> (dropped && +=)
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
  // AssignmentExpression >> MemberExpression >> General Case //
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
  // AssignmentExpression >> Identifier //
  test(
    true,
    `x = () => {}`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `x = #Object.defineProperty(
      #Object.defineProperty(
        method () {
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
            method () {
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
  // AssignmentExpression >> Pattern //
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
  // UpdateExpression >> MemberExpression >> dropped //
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
  // UpdateExpression >> MemberExpression >> !dropped //
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
  // UpdateExpression >> Identifier //
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
  /////////////
  // Control //
  /////////////
  // SequenceExpression //
  test(
    true,
    `(x = 123, x = 456, x = 789)`,
    Expression._default_context,
    [],
    `(
      x = 123,
      (
        x = 456,
        (
          x = 789,
          789)))`);
  // LogicalExpression //
  test(
    true,
    `123 && (x = 456)`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(
      123 ?
      x = 456 :
      void 0)`);
  test(
    true,
    `123 || (x = 456)`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(
      123 ?
      void 0 :
      x = 456)`);
  test(
    true,
    `123 && (x = 456)`,
    Expression._default_context,
    [],
    `(
      123 ?
      (
        x = 456,
        456) :
      123)`);
  test(
    true,
    `123 || (x = 456)`,
    Expression._default_context,
    [],
    `(
      123 ?
      123 :
      (
        x = 456,
        456))`);
  test(
    true,
    `123 ?? (x = 456)`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      x = 456 :
      void 0)`);
  test(
    true,
    `123 ?? (x = 456)`,
    Expression._default_context,
    [],
    `(
      (
        (123 === null) ?
        true :
        (123 === void 0)) ?
      (
        x = 456,
        456) :
      123)`);
  // ConditionalExpression //
  test(
    true,
    `123 ? (x = 456) : (x = 789)`,
    {
      __proto__: Expression._default_context,
      dropped: true},
    [],
    `(
      123 ?
      x = 456 :
      x = 789)`);
  test(
    true,
    `123 ? (x = 456) : (x = 789)`,
    Expression._default_context,
    [],
    `(
      123 ?
      (
        x = 456,
        456) :
      (
        x = 789,
        789))`);
  /////////////////
  // Combination //
  /////////////////
  // Array //
  test(
    true,
    `[123, 456, 789]`,
    Expression._default_context,
    [],
    `#Array.of(123, 456, 789)`);
  test(
    true,
    `[123,, 456, ...789]`,
    Expression._default_context,
    [],
    `#Array.prototype.concat(
      @#Array.of(),
      #Array.of(123),
      #Array(1),
      #Array.of(456),
      789)`);
  // Object //
  test(
    true,
    `{}`,
    Expression._default_context,
    [],
    `{__proto__:#Object.prototype}`);
  test(
    true,
    `{__proto__: 123, foo () {456;} }`,
    Expression._default_context,
    [],
    `{
      __proto__: 123,
      foo: #Object.defineProperty(
        #Object.defineProperty(
          method () {
            let _new_target, _arguments, _this, _super;
            _super = 123;
            _new_target = void 0;
            _this = THIS;
            _arguments = #Object.assign(
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
              456;}
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
  test(
    true,
    `{ ["foo"]: 123, get "bar" () {456;} }`,
    Expression._default_context,
    [],
    `#Object.create(
      #Object.prototype,
      {
        __proto__: null,
        foo: {
          __proto__: null,
          value: 123,
          writable: true,
          enumerable: true,
          configurable: true},
        bar: {
          __proto__: null,
          get: #Object.defineProperty(
            #Object.defineProperty(
              method () {
                let _new_target, _arguments, _this;
                _new_target = void 0;
                _this = THIS;
                _arguments = #Object.assign(
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
                  456;}
                return void 0;},
              "length",
              {
                __proto__: null,
                value: 0,
                configurable: true}),
            "name",
            {
              __proto__: null,
              value: "bar",
              configurable: true}),
          enumerable: true,
          configurable: true}})`);
  test(
    true,
    `{ ...123, get foo () {456;}, "bar":789 }`,
    Expression._default_context,
    ["_prototype"],
    `(
      _prototype = #Object.prototype,
      #Object.defineProperty(
        #Object.defineProperty(
          #Object.assign(
            {__proto__:_prototype},
            123),
          "foo",
          {
            __proto__: null,
            get: #Object.defineProperty(
              #Object.defineProperty(
                method () {
                  let _new_target, _arguments, _this;
                  _new_target = void 0;
                  _this = THIS;
                  _arguments = #Object.assign(
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
                    456;}
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
                configurable: true}),
            enumerable: true,
            configurable: true}),
        "bar",
        {
          __proto__: null,
          value: 789,
          writable: true,
          enumerable: true,
          configurable: true}))`);
  test(
    true,
    `{ ["bar"] () {456;}, __proto__: 123 }`,
    Expression._default_context,
    ["_prototype"],
    `(
      _prototype = #Object.prototype,
      #Object.setPrototypeOf(
        #Object.defineProperty(
          {__proto__:_prototype},
          "bar",
          {
            __proto__: null,
            value: #Object.defineProperty(
              #Object.defineProperty(
                method () {
                  let _new_target, _arguments, _this, _super;
                  _super = _prototype;
                  _new_target = void 0;
                  _this = THIS;
                  _arguments = #Object.assign(
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
                    456;}
                  return void 0;},
                "length",
                {
                  __proto__: null,
                  value: 0,
                  configurable: true}),
              "name",
              {
                __proto__: null,
                value: "bar",
                configurable: true}),
            writable: true,
            enumerable: true,
            configurable: true}),
        (
          _prototype = 123,
          _prototype)))`);
  // UnaryExpression //
  test(
    true,
    `!123`,
    Expression._default_context,
    [],
    `!123`);
  test(
    true,
    `typeof x`,
    Expression._default_context,
    [],
    `typeof x`);
  test(
    true,
    `delete x`,
    Expression._default_context,
    [],
    `true`);
  test(
    false,
    `delete (123).foo`,
    Expression._default_context,
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
    false,
    `delete (123)[456]`,
    Expression._default_context,
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
    true,
    `delete !123`,
    Expression._default_context,
    [],
    `(!123, true)`);
  // BinaryExpression //
  test(
    true,
    `123 + 456`,
    Expression._default_context,
    [],
    `(123 + 456)`);
  // MemberExpression && ChainExpression //
  test(
    true,
    `123[456]`,
    Expression._default_context,
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
    true,
    `(123).foo`,
    Expression._default_context,
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
    true,
    `123?.[456]`,
    Expression._default_context,
    [],
    `(
      (123 === null) ?
      void 0 :
      (
        (123 === void 0) ?
        void 0 :
        #Reflect.get(
          #Object(123),
          456)))`);
  test(
    true,
    `(123)?.foo`,
    Expression._default_context,
    [],
    `(
      (123 === null) ?
      void 0 :
      (
        (123 === void 0) ?
        void 0 :
        #Reflect.get(
          #Object(123),
          "foo")))`);
  // NewExpression //
  test(
    true,
    `new 123(456, 789)`,
    Expression._default_context,
    [],
    `new 123(456, 789)`);
  test(
    true,
    `new 123(456, ...789)`,
    Expression._default_context,
    [],
    `#Reflect.construct(
      123,
      #Array.prototype.concat(
        @#Array.of(),
        #Array.of(456),
        789))`);
  // CallExpression >> DirectEvalCall //
  test(
    true,
    `eval(!123, !456)`,
    Expression._default_context,
    ["_arg0", "_arg1"],
    `(
      throw new #ReferenceError("eval is not defined"),
      (
        _arg0 = !123,
        (
          _arg1 = !456,
          (
            ("dummy-primitive-box" === #eval) ?
            eval(§__this__, §__new_target__, §__super__, §x, §_arg0, §_arg1, _arg0) :
            "dummy-primitive-box"(_arg0, _arg1)))))`);
  test(
    true,
    `eval?.(!123, !456)`,
    Expression._default_context,
    ["_arg0", "_arg1"],
    `(
      throw new #ReferenceError("eval is not defined"),
      (
        ("dummy-primitive-box" === null) ?
        void 0 :
        (
          ("dummy-primitive-box" === void 0) ?
          void 0 :
          (
            _arg0 = !123,
            (
              _arg1 = !456,
              (
                ("dummy-primitive-box" === #eval) ?
                eval(§__this__, §__new_target__, §__super__, §x, §_arg0, §_arg1, _arg0) :
                "dummy-primitive-box"(_arg0, _arg1)))))))`);
  // CallExpression >> MemberExpression
  test(
    true,
    `123[456](789)`,
    Expression._default_context,
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
    true,
    `(123).foo(789)`,
    Expression._default_context,
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
    true,
    `(123)?.[456]?.(789)`,
    Expression._default_context,
    ["_callee"],
    `(
      _callee = (
        (123 === null) ?
        void 0 :
        (
          (123 === void 0) ?
          void 0 :
          #Reflect.get(
            #Object(123),
            456))),
      (
        (_callee === null) ?
        void 0 :
        (
          (_callee === void 0) ?
          void 0 :
          _callee(
            @123,
            789))))`);
  test(
    true,
    `(123)?.foo?.(789)`,
    Expression._default_context,
    ["_callee"],
    `(
      _callee = (
        (123 === null) ?
        void 0 :
        (
          (123 === void 0) ?
          void 0 :
          #Reflect.get(
            #Object(123),
            "foo"))),
      (
        (_callee === null) ?
        void 0 :
        (
          (_callee === void 0) ?
          void 0 :
          _callee(
            @123,
            789))))`);
  test(
    true,
    `123(456, ...789)`,
    Expression._default_context,
    [],
    `#Reflect.apply(
      123,
      void 0,
      #Array.prototype.concat(
        @#Array.of(),
        #Array.of(456),
        789))`);
});

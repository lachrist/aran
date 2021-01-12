"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

require("colors");
const ArrayLite = require("array-lite");
const Acorn = require("acorn");
const Escodegen = require("escodegen");
const Diff = require("diff");
const ParseExternal = require("./parse-external.js");
const Aran = require("./index.js");
const Identifier = require("./identifier.js");

const parse = (code, source) => Acorn.parse(code, {ecmaVersion:2021, sourceType:source});
const parser = {
  script: (code, options) => parse(code, "script"),
  module: (code, options) => parse(code, "module")};
const generate = (estree) => Escodegen.generate(estree);
const diff = (code1, code2) => {
  if (code1 !== code2) {
    {
      let line = 0;
      let column = 0;
      for (let index = 0; index < code1.length; index++) {
        if (code1[index] !== code2[index]) {
          console.log(`line: ${line}, column: ${column}, ${global.JSON.stringify(code1[index])} !== ${global.JSON.stringify(code2[index])}`);
          break;
        }
        if (code1[index] === "\n") {
          line++;
          column = 0;
        } else {
          column++;
        }
      }
    }
    const parts = Diff.diffChars(code1, code2);
    parts.forEach((part) => {
      const color = (
        part.added ?
        "green" :
        (
          part.removed ? "red" : "grey"));
      process.stderr.write(part.value[color]);});
    process.stderr.write("\n");
    Assert.fail("Diff failing"); }};

let aran = Aran();

///////////
// Unary //
///////////
ArrayLite.forEach(
  [
    aran.unary.closure,
    global.eval(aran.unary.script),
    global.eval(generate(aran.unary.estree))],
  (closure) => (
    Assert.deepEqual(
      (
        (
          () => {
            try {
              closure("foo", 1); }
            catch (error) {
              return error;}
            return null;})
        ()),
      "invalid unary operator"),
    ArrayLite.forEach(
      aran.unary.operators,
      (operator) => Assert.deepEqual(
        global.eval(`${operator} 1`),
        closure(operator, 1)))));

////////////
// Binary //
////////////
ArrayLite.forEach(
  [
    aran.binary.closure,
    global.eval(aran.binary.script),
    global.eval(generate(aran.binary.estree))],
  (closure) => (
    Assert.deepEqual(
      (
        (
          () => {
            try {
              closure("foo", 10, 5); }
            catch (error) {
              return error;}
            return false})
        ()),
      "invalid binary operator"),
    ArrayLite.forEach(
      aran.binary.operators,
      (operator) => (
        operator === "in" ?
        (
          Assert.deepEqual(
            closure("in", "foo", {__proto__:null}),
            false),
          Assert.deepEqual(
            closure("in", "foo", {__proto__:null, foo:123}),
            true)) :
        (
          operator === "instanceof" ?
          (
            Assert.deepEqual(
              closure("instanceof", 123, global.String),
              false),
            Assert.deepEqual(
              closure("instanceof", new global.String("foo"), global.String),
              true)) :
          Assert.deepEqual(
            global.eval(`10 ${operator} 5`),
            closure(operator, 10, 5)))))));

////////////
// Object //
////////////
ArrayLite.forEach(
  [
    aran.object.closure,
    global.eval(aran.object.script),
    global.eval(generate(aran.object.estree))],
  (closure, _prototype) => (
    Assert.deepEqual(
      closure(
        global.Object.prototype,
        [
          ["foo", 123],
          ["bar", 456]]),
      {
        __proto__: global.Object.prototype,
        foo: 123,
        bar: 456}),
    Assert.deepEqual(
      closure(
        null,
        [
          ["qux", 789]]),
      {
        __proto__: null,
        qux: 789})));

///////////////
// Intrinsic //
///////////////
ArrayLite.forEach(
  [
    aran.intrinsic.object,
    global.eval(aran.intrinsic.script),
    global.eval(generate(aran.intrinsic.estree))],
  (object) => (
    Assert.deepEqual(
      global.Reflect.ownKeys(object).length,
      aran.intrinsic.names.length),
    ArrayLite.forEach(
      aran.intrinsic.names,
      (name) => (
        Assert.notDeepEqual(global.Reflect.getOwnPropertyDescriptor(object, name), void 0),
        (
          name === "aran.globalObjectRecord" ?
          Assert.equal(object[name], global) :
          (
            (
              name === "aran.globalDeclarativeRecord" ||
              name === "aran.advice") ?
            Assert.deepEqual(object[name], {__proto__:null}) :
            (
              name === "aran.deadzoneMarker" ?
              Assert.deepEqual(String(object[name]), "Symbol(deadzone-placeholder)") :
              (
                name === "aran.generatorPrototype" ?
                Assert.deepEqual(
                  object[name],
                  global.Reflect.getPrototypeOf((function*() {}).prototype)) :
                (
                  name === "aran.asynchronousGeneratorPrototype") ?
                  Assert.deepEqual(
                    object[name],
                    global.Reflect.getPrototypeOf((async function* () {}).prototype)) :
                  Assert.equal(
                    object[name],
                    (
                      name === "Function.prototype.arguments@get" ?
                      global.Reflect.getOwnPropertyDescriptor(Function.prototype, "arguments").get :
                      (
                        name === "Function.prototype.arguments@set" ?
                        global.Reflect.getOwnPropertyDescriptor(Function.prototype, "arguments").set :
                        global.eval(name))))))))))));

const test = (code1, options, code2, _code) => (
  _code = (new Aran({parser})).weave(code1, options),
  diff(
    generate(
      parse(_code, options.source)),
    generate(
      parse(code2, options.source))),
  diff(
    _code,
    (new Aran()).weave(
      parse(code1, options.source),
      options)),
  diff(
    generate(
      (new Aran()).weave(
        parse(code1, options.source),
        global.Object.assign(
          {},
          options,
          {output:"estree"}))),
    generate(
      parse(code2, options.source))));

test(
  `l: while(123) { let x; x; break l; break; continue l; continue }; 123;`,
  {
    newline: "\n    ",
    pointcut: ["read", "break"]},
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let input, $$this; input = {__proto__:null};
        $$this = INTRINSIC["aran.globalObjectRecord"];
        {
          Bl: b9: {
            let input; input = { __proto__: null };
            while (
              123)
              { Cl: c9: { let input, $$x; input = {__proto__:null};
                ($$x =
                  (void 0));
                (
                  (INTRINSIC["aran.advice"]).read(
                    {
                      __proto__: null,
                      ['raw']: "$$x",
                      ['type']: "base",
                      ['name']: "x"},
                    $$x,
                    19));
                (
                  (INTRINSIC["aran.advice"]).break(
                    {
                      __proto__: null,
                      ['raw']: "Bl",
                      ['type']: "break",
                      ['name']: "l"},
                    20));
                break Bl;
                (
                  (INTRINSIC["aran.advice"]).break(
                    {
                      __proto__: null,
                      ['raw']: "b9",
                      ['type']: "break",
                      ['name']: null},
                    21));
                break b9;
                (
                  (INTRINSIC["aran.advice"]).break(
                    {
                      __proto__: null,
                      ['raw']: "Cl",
                      ['type']: "continue",
                      ['name']: "l"},
                    22));
                break Cl;
                (
                  (INTRINSIC["aran.advice"]).break(
                    {
                      __proto__: null,
                      ['raw']: "c9",
                      ['type']: "continue",
                      ['name']: null},
                    23));
                break c9; } } } }
        return (
          123); }) ());`);

// simplify array //
test(
  `[1, 2, 3];`,
  {source:"script"},
  `
    "use strict"; ((() =>
      { const INTRINSIC = __aran__; let input, $$this; input = {__proto__:null};
        $$this = INTRINSIC["aran.globalObjectRecord"];
        return (
          [
            1,
            2,
            3]); }) ());`);

// unmangle (input && shadow && meta && base) //
test(
  `(y) => x[y]; let x;`,
  {source:"module", pointcut:["read", "write"], enclave:true},
  `
    "use strict"; ((() =>
      { const __ARAN__INTRINSIC = __aran__; let __ARAN__input, __ARAN__$$this, __ARAN__$$x, __ARAN___$x, __ARAN__CALLEE_0; __ARAN__input = {__proto__:null};
        (__ARAN___$x =
          (
            (__ARAN__INTRINSIC["aran.advice"]).write(
            {
              __proto__: null,
              ['raw']: "_$x",
              ['type']: "deadzone",
              ['name']: "x"},
            false,
            0)));
        __ARAN__$$this = __ARAN__INTRINSIC["aran.advice"].write(
          {
            __proto__: null,
            ['raw']: "$$this",
            ['type']: "base",
            ['name']: "this"},
          __ARAN__INTRINSIC["aran.globalObjectRecord"],
          0);
        (
          (null, __ARAN__INTRINSIC["Object.defineProperty"]) (
          (
            (null, __ARAN__INTRINSIC["Object.defineProperty"]) (
            (__ARAN__CALLEE_0 = (...__ARAN__ARGUMENTS) =>
              { let __ARAN__input, __ARAN__$$y; __ARAN__input = {__proto__:null, callee:__ARAN__CALLEE_0, arguments:__ARAN__ARGUMENTS};
                (__ARAN__$$y =
                  (
                    (__ARAN__INTRINSIC["aran.advice"]).write(
                    {
                      __proto__: null,
                      ['raw']: "$$y",
                      ['type']: "base",
                      ['name']: "y"},
                    (
                      (null, __ARAN__INTRINSIC["Reflect.get"]) (
                      (
                        (null, __ARAN__INTRINSIC["Reflect.get"]) (
                        (
                          (__ARAN__INTRINSIC["aran.advice"]).read(
                          {
                            __proto__: null,
                            ['raw']: "input",
                            ['type']: "input",
                            ['name']: null},
                          __ARAN__input,
                          4)),
                        "arguments")),
                      0)),
                    5)));
                /* lone */
                  { let __ARAN__input, __ARAN__$_ExpressionMemberObject_11_1; __ARAN__input = {__proto__:null};
                    return (
                      (
                        (__ARAN__$_ExpressionMemberObject_11_1 =
                          (
                            (__ARAN__INTRINSIC["aran.advice"]).write(
                            {
                              __proto__: null,
                              ['raw']: "$_ExpressionMemberObject_11_1",
                              ['type']: "meta",
                              ['name']: "ExpressionMemberObject_11_1"},
                            (
                              (
                                (__ARAN__INTRINSIC["aran.advice"]).read(
                                {
                                  __proto__: null,
                                  ['raw']: "_$x",
                                  ['type']: "deadzone",
                                  ['name']: "x"},
                                __ARAN___$x,
                                7)) ?
                              (
                                (__ARAN__INTRINSIC["aran.advice"]).read(
                                {
                                  __proto__: null,
                                  ['raw']: "$$x",
                                  ['type']: "base",
                                  ['name']: "x"},
                                __ARAN__$$x,
                                7)) :
                              ((() => { throw (
                                (new
                                  (__ARAN__INTRINSIC["ReferenceError"]) (
                                  "Cannot read from non-initialized static variable named x"))); }) ())),
                            6))),
                        (
                          (null, __ARAN__INTRINSIC["Reflect.get"]) (
                          (
                            (
                              (
                                (
                                  (__ARAN__INTRINSIC["aran.advice"]).read(
                                  {
                                    __proto__: null,
                                    ['raw']: "$_ExpressionMemberObject_11_1",
                                    ['type']: "meta",
                                    ['name']: "ExpressionMemberObject_11_1"},
                                  __ARAN__$_ExpressionMemberObject_11_1,
                                  6)) ===
                                null) ?
                              true :
                              (
                                (
                                  (__ARAN__INTRINSIC["aran.advice"]).read(
                                  {
                                    __proto__: null,
                                    ['raw']: "$_ExpressionMemberObject_11_1",
                                    ['type']: "meta",
                                    ['name']: "ExpressionMemberObject_11_1"},
                                  __ARAN__$_ExpressionMemberObject_11_1,
                                  6)) ===
                                (void 0))) ?
                            (
                              (__ARAN__INTRINSIC["aran.advice"]).read(
                              {
                                __proto__: null,
                                ['raw']: "$_ExpressionMemberObject_11_1",
                                ['type']: "meta",
                                ['name']: "ExpressionMemberObject_11_1"},
                              __ARAN__$_ExpressionMemberObject_11_1,
                              6)) :
                            (
                              (null, __ARAN__INTRINSIC["Object"]) (
                              (
                                (__ARAN__INTRINSIC["aran.advice"]).read(
                                {
                                  __proto__: null,
                                  ['raw']: "$_ExpressionMemberObject_11_1",
                                  ['type']: "meta",
                                  ['name']: "ExpressionMemberObject_11_1"},
                                __ARAN__$_ExpressionMemberObject_11_1,
                                6))))),
                          (
                            (__ARAN__INTRINSIC["aran.advice"]).read(
                            {
                              __proto__: null,
                              ['raw']: "$$y",
                              ['type']: "base",
                              ['name']: "y"},
                            __ARAN__$$y,
                            8)))))); }
                return (
                  (void 0)); }),
            "length",
            ({__proto__:
              null,[
              "value"]:
              1,[
              "writable"]:
              false,[
              "enumerable"]:
              false,[
              "configurable"]:
              true}))),
          "name",
          ({__proto__:
            null,[
            "value"]:
            "",[
            "writable"]:
            false,[
            "enumerable"]:
            false,[
            "configurable"]:
            true})));
        (
          (__ARAN__$$x =
            (
              (__ARAN__INTRINSIC["aran.advice"]).write(
              {
                __proto__: null,
                ['raw']: "$$x",
                ['type']: "base",
                ['name']: "x"},
              (void 0),
              11))),
          (__ARAN___$x =
            (
              (__ARAN__INTRINSIC["aran.advice"]).write(
              {
                __proto__: null,
                ['raw']: "_$x",
                ['type']: "deadzone",
                ['name']: "x"},
              true,
              11)))); }) ());`);

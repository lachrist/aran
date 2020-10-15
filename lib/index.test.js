"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js")._toggle_debug_mode();

require("colors");
const ArrayLite = require("array-lite");
const Acorn = require("acorn");
const Astring = require("astring");
const Diff = require("diff");
const Aran = require("./index.js");
const Stratum = require("./stratum.js");

const parameters_instrument_identifier = "parameters";
const advice_instrument_identifier = "advice";
const callee_instrument_identifier = "callee";

const builtin_generate_identifier = "BUILTIN";
const callee_generate_identifier = "CALLEE";
const apply_generate_identifier = "APPLY";
const error_generate_identifier = "ERROR";
const arguments_generate_identifier = "ARGUMENTS";
const this_generate_identifier = "THIS";
const new_target_generate_identifier = "NEW_TARGET";

const parse = (code) => Acorn.parse(code, {__proto__:null, ecmaVersion:2020});
const generate = (estree) => Astring.generate(estree);
const diff = (code1, code2) => {
  if (code1 !== code2) {
    const parts = Diff.diffChars(code1, code2);
    parts.forEach((part) => {
      const color = (
        part.added ?
        "green" :
        (
          part.removed ? "red" : "grey"));
      process.stderr.write(part.value[color]);});
    process.stderr.write("\n");
    Assert.fail("Diff failing");}};

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

/////////////
// Builtin //
/////////////
ArrayLite.forEach(
  [
    aran.builtin.object,
    global.eval(aran.builtin.script),
    global.eval(generate(aran.builtin.estree))],
  (object) => (
    Assert.deepEqual(
      global.Reflect.ownKeys(object).length,
      aran.builtin.names.length),
    ArrayLite.forEach(
      aran.builtin.names,
      (name) => (
        Assert.notDeepEqual(global.Reflect.getOwnPropertyDescriptor(object, name), void 0),
        Assert.equal(
          object[name],
          (
            name === "Function.prototype.arguments@get" ?
            global.Reflect.getOwnPropertyDescriptor(Function.prototype, "arguments").get :
            (
              name === "Function.prototype.arguments@set" ?
              global.Reflect.getOwnPropertyDescriptor(Function.prototype, "arguments").set :
              global.eval(name))))))));

//////////////
// Failures //
//////////////
const failure = (pointcut, serial, message) => Assert.throws(
  () => aran.weave(
    {
      type: "Program",
      body: []},
    pointcut,
    serial),
  new Error(message));
failure(true, "foo", "serial should either be null/undefined (global code) or a number (direct eval code)");
failure(true, 0/0, "serial is NaN");
failure(true, 1.5, "serial should be an integer");
failure(true, -1, "serial should be a positive integer");
failure(true, global.Number.MAX_SAFE_INTEGER, "serial does not refer to a node representing a direct eval call");
failure("foo", null, "pointcut must be either an array, a closure, a boolean, or an object");

/////////////
// Success //
/////////////
const success = (code1, pointcut, serial, code2) => diff(
  generate(
    aran.weave(
      parse(code1),
      pointcut,
      serial)),
  generate(
    parse(code2)));
aran = Aran();
success(
  `123;`,
  false,
  null,
  `((${builtin_generate_identifier}, ${apply_generate_identifier}, eval) => {
    ${apply_generate_identifier} = ${apply_generate_identifier} || ${builtin_generate_identifier}["Reflect.apply"];
    eval = eval || ${builtin_generate_identifier}["eval"];
    return ((() => {
      "use strict";
      let ${callee_generate_identifier + "1"};
      return (${callee_generate_identifier + "1"} = (...${arguments_generate_identifier}) => {
        let ${callee_generate_identifier} = ${callee_generate_identifier + "1"};
        let ${advice_instrument_identifier}, ${parameters_instrument_identifier};
        ${advice_instrument_identifier} = (0, ${builtin_generate_identifier}["Reflect.get"])(${arguments_generate_identifier}, 0);
        {
          let ${Stratum._base(Stratum._base("this"))};
          ${Stratum._base(Stratum._base("this"))} = ${builtin_generate_identifier}["global"];
          return 123;
        }
      }, delete ${callee_generate_identifier + "1"}.length, delete ${callee_generate_identifier + "1"}.name, ${callee_generate_identifier + "1"});
    }) ());
  });`);
aran = Aran();
success(
  `123;`,
  true,
  null,
  `((${builtin_generate_identifier}, ${apply_generate_identifier}, eval) => {
    ${apply_generate_identifier} = ${apply_generate_identifier} || ${builtin_generate_identifier}["Reflect.apply"];
    eval = eval || ${builtin_generate_identifier}["eval"];
    return ((() => {
      "use strict";
      let ${callee_generate_identifier + "1"};
      return (${callee_generate_identifier + "1"} = (...${arguments_generate_identifier}) => {
        let ${callee_generate_identifier} = ${callee_generate_identifier + "1"};
        let ${advice_instrument_identifier}, ${parameters_instrument_identifier};
        ${advice_instrument_identifier} = (0, ${builtin_generate_identifier}["Reflect.get"])(${arguments_generate_identifier}, 0);
        {
          try {
            let ${Stratum._base(Stratum._base("this"))};
            ${advice_instrument_identifier}["enter"]("program", [], {__proto__:null}, ["this"], 0);
            ${Stratum._base(Stratum._base("this"))} = ${advice_instrument_identifier}["write"](
              "this",
              ${advice_instrument_identifier}["builtin"]("global", ${builtin_generate_identifier}["global"], 0),
              0);
            return ${advice_instrument_identifier}["primitive"](123, 1);
          } catch (${error_generate_identifier}) {
            throw ${advice_instrument_identifier}["failure"]("program", ${error_generate_identifier}, 0);
          } finally {
            ${advice_instrument_identifier}["leave"]("program", 0);
          }
        }
      }, delete ${callee_generate_identifier + "1"}.length, delete ${callee_generate_identifier + "1"}.name, ${callee_generate_identifier + "1"});
    }) ());
  });`);
// Pointcut //
ArrayLite.forEach(
  [
    ["primitive"],
    {__proto__:null, primitive:true},
    (name, args) => name === "primitive"],
  (pointcut) => (
  aran = Aran(),
  success(
    `123;`,
    pointcut,
    null,
    `((${builtin_generate_identifier}, ${apply_generate_identifier}, eval) => {
      ${apply_generate_identifier} = ${apply_generate_identifier} || ${builtin_generate_identifier}["Reflect.apply"];
      eval = eval || ${builtin_generate_identifier}["eval"];
      return ((() => {
        "use strict";
        let ${callee_generate_identifier + "1"};
        return (${callee_generate_identifier + "1"} = (...${arguments_generate_identifier}) => {
          let ${callee_generate_identifier} = ${callee_generate_identifier + "1"};
          let ${advice_instrument_identifier}, ${parameters_instrument_identifier};
          ${advice_instrument_identifier} = (0, ${builtin_generate_identifier}["Reflect.get"])(${arguments_generate_identifier}, 0);
          {
            let ${Stratum._base(Stratum._base("this"))};
            ${Stratum._base(Stratum._base("this"))} = ${builtin_generate_identifier}["global"];
            return ${advice_instrument_identifier}["primitive"](123, 1);
          }
        }, delete ${callee_generate_identifier + "1"}.length, delete ${callee_generate_identifier + "1"}.name, ${callee_generate_identifier + "1"});
      }) ());
    });`)));
// Show //
aran = Aran();
success(
  `
    foo: {
      break foo; }
    (() => { x; });
    let x = 123;
    (!456) || 789;`,
  ["break", "read"],
  null,
  `
    ((${builtin_generate_identifier}, ${apply_generate_identifier}, eval) => {
      ${apply_generate_identifier} = ${apply_generate_identifier} || ${builtin_generate_identifier}["Reflect.apply"];
      eval = eval || ${builtin_generate_identifier}["eval"];
      return (
        (
          () => {
            "use strict";
            let ${callee_generate_identifier + "1"};
            return (
              ${callee_generate_identifier + "1"} = (...${arguments_generate_identifier}) => {
                let ${callee_generate_identifier} = ${callee_generate_identifier + "1"};
                let ${advice_instrument_identifier}, ${parameters_instrument_identifier};
                ${advice_instrument_identifier} = (0, ${builtin_generate_identifier}["Reflect.get"])(${arguments_generate_identifier}, 0);
                {
                  let ${Stratum._base(Stratum._base("this"))}, ${Stratum._base(Stratum._base("x"))}, ${Stratum._meta(Stratum._base("x"))}, ${Stratum._base(Stratum._meta("ExpressionLogicalLeft_1_1"))}, ${callee_instrument_identifier + "1"}, ${callee_generate_identifier + "2"};
                  ${Stratum._meta(Stratum._base("x"))} = false;
                  ${Stratum._base(Stratum._base("this"))} = ${builtin_generate_identifier}["global"];
                  ${Stratum._base("foo")}: {
                    ${advice_instrument_identifier}["break"]("foo", 3);
                    break ${Stratum._base("foo")};
                  }
                  (0, ${builtin_generate_identifier}["Object.defineProperty"])(
                    (0, ${builtin_generate_identifier}["Object.defineProperty"])(
                      (
                        ${callee_instrument_identifier + "1"} = (
                          ${callee_generate_identifier + "2"} = (...${arguments_generate_identifier}) => {
                            let ${callee_generate_identifier} = ${callee_generate_identifier + "2"};
                            ${callee_generate_identifier} = ${callee_instrument_identifier + "1"};
                            {
                              (
                                ${advice_instrument_identifier}["read"]("%x", ${Stratum._meta(Stratum._base("x"))}, 7) ?
                                ${advice_instrument_identifier}["read"]("x", ${Stratum._base(Stratum._base("x"))}, 7) :
                                (
                                  (
                                    () => {
                                      throw new ${builtin_generate_identifier}["ReferenceError"]("Cannot access 'x' before initialization"); })
                                  ()));}
                            return void 0;},
                          delete ${callee_generate_identifier + "2"}.length,
                          delete ${callee_generate_identifier + "2"}.name,
                          ${callee_generate_identifier + "2"}),
                        ${callee_instrument_identifier + "1"}),
                      "length",
                      {
                        __proto__: null,
                        ["value"]: 0,
                        ["configurable"]: true}),
                    "name", {
                      __proto__: null,
                      ["value"]: "",
                      ["configurable"]: true});
                  (
                    ${Stratum._base(Stratum._base("x"))} = 123,
                    ${Stratum._meta(Stratum._base("x"))} = true);
                  return (
                    ${Stratum._base(Stratum._meta("ExpressionLogicalLeft_1_1"))} = !456,
                    (
                      ${advice_instrument_identifier}["read"]("#ExpressionLogicalLeft_1_1", ${Stratum._base(Stratum._meta("ExpressionLogicalLeft_1_1"))}, 10) ?
                      ${advice_instrument_identifier}["read"]("#ExpressionLogicalLeft_1_1", ${Stratum._base(Stratum._meta("ExpressionLogicalLeft_1_1"))}, 10) :
                      789));}},
              delete ${callee_generate_identifier + "1"}.length,
              delete ${callee_generate_identifier + "1"}.name,
              ${callee_generate_identifier + "1"});})
        ());});`);
// Serialization && Local //
aran = Aran();
success(
  `
    let x = 123;
    eval(456);`,
  false,
  null,
  `(${builtin_generate_identifier}, ${apply_generate_identifier}, eval) => {
    ${apply_generate_identifier} = ${apply_generate_identifier} || ${builtin_generate_identifier}["Reflect.apply"];
    eval = eval || ${builtin_generate_identifier}["eval"];
    return (
      (
        () => {
          "use strict";
          let ${callee_generate_identifier + "1"};
          return (
            ${callee_generate_identifier + "1"} = (...${arguments_generate_identifier}) => {
              let ${callee_generate_identifier} = ${callee_generate_identifier + "1"};
              let ${advice_instrument_identifier}, ${parameters_instrument_identifier};
              ${advice_instrument_identifier} = (0, ${builtin_generate_identifier}["Reflect.get"])(${arguments_generate_identifier}, 0);
              {
                let ${Stratum._base(Stratum._base("this"))}, ${Stratum._base(Stratum._base("x"))}, ${Stratum._base(Stratum._meta("ExpressionCallEvalCallee_1_1"))};
                ${Stratum._base(Stratum._base("this"))} = ${builtin_generate_identifier}["global"];
                ${Stratum._base(Stratum._base("x"))} = 123;
                return (
                  ${Stratum._base(Stratum._meta("ExpressionCallEvalCallee_1_1"))} = (
                    (0, ${builtin_generate_identifier}["Reflect.has"])(
                      ${builtin_generate_identifier}["global"],
                      "eval") ?
                    (0, ${builtin_generate_identifier}["Reflect.get"])(
                      ${builtin_generate_identifier}["global"],
                      "eval") :
                    (
                      (
                        () => { throw new ${builtin_generate_identifier}["ReferenceError"]("eval is not defined"); })
                      ())),
                  (
                    (
                      ${Stratum._base(Stratum._meta("ExpressionCallEvalCallee_1_1"))} ===
                      ${builtin_generate_identifier}["eval"]) ?
                    eval(456) :
                    ${Stratum._base(Stratum._meta("ExpressionCallEvalCallee_1_1"))}(456)));}},
            delete ${callee_generate_identifier + "1"}.length,
            delete ${callee_generate_identifier + "1"}.name,
            ${callee_generate_identifier + "1"});})
    ());};`);
aran = Aran(global.JSON.parse(global.JSON.stringify(aran)));
success(
  `x;`,
  false,
  3,
  `(
    (
      () => {
        return ${Stratum._base(Stratum._base("x"))}; })
    ());`);

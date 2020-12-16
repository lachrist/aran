"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js")._toggle_debug_mode();

require("colors");
const Acorn = require("acorn");
const Escodegen = require("escodegen");
const Diff = require("diff");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Generate = require("./generate.js");
  
const parse = (code) => Acorn.parse(
  code,
  {
    __proto__: null,
    ecmaVersion: 2020});

const generate = (estree) => {
  try {
    return Escodegen.generate(estree); }
  catch (error) {
    console.log(error);
    console.log(JSON.stringify(estree, null, 2));
    Assert.fail(error.message);}};

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

const builtin_identifier = "BUILTIN";
const callee_identifier = "CALLEE";
const apply_identifier = "APPLY";
const make_namespace = (_counter) => (
  _counter = 0,
  {
    __proto__: null,
    builtin: builtin_identifier,
    apply: apply_identifier,
    callee: () => callee_identifier + (++_counter)});
const convert = (identifier) => (
  identifier === "new.target" ?
  "$0newtarget" :
  "$" + identifier);
const apply = (visit, expression1, expression2, expressions) => (
  expressions.length === 0 ?
  {
    type: "SequenceExpression",
    expressions: [
      {
        type: "Literal",
        value: "SPECIAL-APPLY"},
      visit(expression1),
      visit(expression2)]} :
  null);
const construct = (visit, expression, expressions) => (
  expressions.length === 0 ?
  {
    type: "SequenceExpression",
    expressions: [
      {
        type: "Literal",
        value: "SPECIAL-CONSTRUCT"},
      visit(expression)]} :
  null);

const test = (mode, code1, code2, _estree, _errors) => diff(
  generate(
    Generate(
      Lang.PARSE_BLOCK(code1),
      {
        __proto__: null,
        mode: mode},
      {
        __proto__: null,
        convert,
        apply,
        construct,
        namespace: make_namespace()})),
  generate(
    parse(code2)));

// Local Program //
test(
  "local-eval",
  `{
    return 123;}`,
  `(
    (
      () => {
        return 123;})
    ());`);
// Atomic Statement //
test(
  "global-eval",
  `{
    123;
    throw 456;
    debugger;
    return 789;}`,
  `(${convert(builtin_identifier)}, ${convert(apply_identifier)}, eval) => {
    ${convert(apply_identifier)} = ${convert(apply_identifier)} || ${convert(builtin_identifier)}["Reflect.apply"];
    eval = eval || ${convert(builtin_identifier)}["eval"];
    return (
      (
        () => {
          "use strict";
          123;
          throw 456;
          debugger;
          return 789;})
      ());};`);
// Compound Statement //
test(
  "global-eval",
  `{
    {
      1; }
    if (2) {
      3; }
    else {
      4; }
    while (5) {
      6; }
    try {
      7; }
    catch {
      8; }
    finally {
      9; }
    return 10;}`,
  `(${convert(builtin_identifier)}, ${convert(apply_identifier)}, eval) => {
    ${convert(apply_identifier)} = ${convert(apply_identifier)} || ${convert(builtin_identifier)}["Reflect.apply"];
    eval = eval || ${convert(builtin_identifier)}["eval"];
    return (
      (
        () => {
          "use strict";
          {
            1; }
          if (2) {
            3; }
          else {
            4; }
          while (5) {
            6; }
          try {
            7; }
          catch (${convert("error")}) {
            8; }
          finally {
            9; }
          return 10;})
      ());};`);
// Labeled Statement //
test(
  "global-eval",
  `{
    foo: bar: while (123) {
      break foo;
      continue bar; }
    return 456;}`,
  `(${convert(builtin_identifier)}, ${convert(apply_identifier)}, eval) => {
    ${convert(apply_identifier)} = ${convert(apply_identifier)} || ${convert(builtin_identifier)}["Reflect.apply"];
    eval = eval || ${convert(builtin_identifier)}["eval"];
    return (
      (
        () => {
          "use strict";
          foo: bar: while (123) {
            break foo;
            continue bar; }
          return 456;})
      ());};`);
// Producer Expression //
test(
  "global-eval",
  `{
    let x;
    123;
    void 0;
    x;
    #global;
    return 456;}`,
  `(${convert(builtin_identifier)}, ${convert(apply_identifier)}, eval) => {
    ${convert(apply_identifier)} = ${convert(apply_identifier)} || ${convert(builtin_identifier)}["Reflect.apply"];
    eval = eval || ${convert(builtin_identifier)}["eval"];
    return (
      (
        () => {
          "use strict";
          let ${convert("x")};
          123;
          void 0;
          ${convert("x")};
          ${convert(builtin_identifier)}["global"];
          return 456;})
      ());};`);
// Closure Expressions //
test(
  "global-eval",
  `{
    () => { return 1; };
    function () { return 2; };
    method () { return 3; };
    constructor () { return 4; };
    return 5; }`,
  `(${convert(builtin_identifier)}, ${convert(apply_identifier)}, eval) => {
    ${convert(apply_identifier)} = ${convert(apply_identifier)} || ${convert(builtin_identifier)}["Reflect.apply"];
    eval = eval || ${convert(builtin_identifier)}["eval"];
    return (
      (
        () => {
          "use strict";
          let ${convert(callee_identifier + "1")}, ${convert(callee_identifier + "2")}, ${convert(callee_identifier + "3")}, ${convert(callee_identifier + "4")};
          (
            ${convert(callee_identifier + "1")} = (...${convert("arguments")}) => {
              let ${convert("callee")} = ${convert(callee_identifier + "1")};
              return 1; },
            delete ${convert(callee_identifier + "1")}.length,
            delete ${convert(callee_identifier + "1")}.name,
            ${convert(callee_identifier + "1")});
          (
            ${convert(callee_identifier + "2")} = function (...${convert("arguments")}) {
              let ${convert("callee")} = ${convert(callee_identifier + "2")};
              let ${convert("new.target")} = new.target;
              let ${convert("this")} = this;
              return 2; },
            delete ${convert(callee_identifier + "2")}.length,
            delete ${convert(callee_identifier + "2")}.name,
            ${convert(callee_identifier + "2")}.prototype = null,
            ${convert(callee_identifier + "2")});
          (
            ${convert(callee_identifier + "3")} = (
              (
                {
                  [0] (...${convert("arguments")}) {
                    let ${convert("callee")} = ${convert(callee_identifier + "3")};
                    let ${convert("this")} = this;
                    return 3; }})
              [0]),
            delete ${convert(callee_identifier + "3")}.length,
            delete ${convert(callee_identifier + "3")}.name,
            ${convert(callee_identifier + "3")});
          (
            ${convert(callee_identifier + "4")} = function (...${convert("arguments")}) {
              let ${convert("callee")} = ${convert(callee_identifier + "4")};
              let ${convert("new.target")} = new.target;
              return 4; },
            delete ${convert(callee_identifier + "4")}.length,
            delete ${convert(callee_identifier + "4")}.name,
            ${convert(callee_identifier + "4")}.prototype = null,
            ${convert(callee_identifier + "4")});
          return 5;})
      ());};`);
// Consumer Expression //
test(
  "global-eval",
  `{
    let x;
    eval(x = 1);
    x = (throw x = 2);
    (x = 3, x = 4);
    (x = 5 ? x = 6 : x = 7);
    return 8;}`,
  `(${convert(builtin_identifier)}, ${convert(apply_identifier)}, eval) => {
    ${convert(apply_identifier)} = ${convert(apply_identifier)} || ${convert(builtin_identifier)}["Reflect.apply"];
    eval = eval || ${convert(builtin_identifier)}["eval"];
    return (
      (
        () => {
          "use strict";
          let ${convert("x")};
          eval((${convert("x")} = 1, void 0));
          ${convert("x")} = ((() => { throw (${convert("x")} = 2, void 0); }) ());
          (${convert("x")} = 3, ${convert("x")} = 4);
          ((${convert("x")} = 5, void 0) ? ${convert("x")} = 6 : ${convert("x")} = 7);
          return 8;})
      ());};`);
// Combiner Expression //
test(
  "global-eval",
  `{
    !1;
    (2 + 3);
    ({__proto__:4, [5]:6, [7]:8});
    new (9)(10, 11);
    (12)(@!13, 14, 15);
    (16)(17, 18);
    #global(19, 20);
    (21)(@22);
    new (23)();
    return 24;}`,
  `(${convert(builtin_identifier)}, ${convert(apply_identifier)}, eval) => {
    ${convert(apply_identifier)} = ${convert(apply_identifier)} || ${convert(builtin_identifier)}["Reflect.apply"];
    eval = eval || ${convert(builtin_identifier)}["eval"];
    return (
      (
        () => {
          "use strict";
          !1;
          (2 + 3);
          ({__proto__:4, [5]:6, [7]:8});
          new (9)(10, 11);
          ${convert(apply_identifier)}(12, !13, [14, 15]);
          (16)(17, 18);
          (0, ${convert(builtin_identifier)}["global"])(19, 20);
          ("SPECIAL-APPLY", 21, 22);
          ("SPECIAL-CONSTRUCT", 23);
          return 24;})
      ());};`);

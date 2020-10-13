"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

require("colors");
const Acorn = require("acorn");
const Escodegen = require("escodegen");
const Diff = require("diff");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Generate = require("./generate.js");
Tree._toggle_debug_mode();

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

const BUILTIN_IDENTIFIER = "BUILTIN";
const CALLEE_IDENTIFIER = "CALLEE";
const show = (identifier) => (
  identifier === "new.target" ?
  "$0newtarget" :
  "$" + identifier);

const test = (local, code1, code2, _estree, _errors) => diff(
  generate(
    Generate(
      Lang.PARSE_BLOCK(code1),
      {
        __proto__: null,
        local: local,
        show: show,
        namespaces: {
          __proto__: null,
          builtin: BUILTIN_IDENTIFIER,
          callee: CALLEE_IDENTIFIER}})),
  generate(
    parse(code2)));

// Local Program //
test(
  true,
  `{
    return 123;}`,
  `(
    (
      () => {
        return 123;})
    ());`);
// Atomic Statement //
test(
  false,
  `{
    123;
    throw 456;
    debugger;
    return 789;}`,
  `(${show(BUILTIN_IDENTIFIER)}) => {
    const eval = ${show(BUILTIN_IDENTIFIER)}["eval"];
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
  false,
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
  `(${show(BUILTIN_IDENTIFIER)}) => {
    const eval = ${show(BUILTIN_IDENTIFIER)}["eval"];
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
          catch (${show("error")}) {
            8; }
          finally {
            9; }
          return 10;})
      ());};`);
// Labeled Statement //
test(
  false,
  `{
    foo: bar: while (123) {
      break foo;
      continue bar; }
    return 456;}`,
  `(${show(BUILTIN_IDENTIFIER)}) => {
    const eval = ${show(BUILTIN_IDENTIFIER)}["eval"];
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
  false,
  `{
    let x;
    123;
    void 0;
    x;
    #global;
    return 456;}`,
  `(${show(BUILTIN_IDENTIFIER)}) => {
    const eval = ${show(BUILTIN_IDENTIFIER)}["eval"];
    return (
      (
        () => {
          "use strict";
          let ${show("x")};
          123;
          void 0;
          ${show("x")};
          ${show(BUILTIN_IDENTIFIER)}["global"];
          return 456;})
      ());};`);
// Closure Expressions //
test(
  false,
  `{
    () => { return 1; };
    function () { return 2; };
    method () { return 3; };
    constructor () { return 4; };
    return 5; }`,
  `(${show(BUILTIN_IDENTIFIER)}) => {
    const eval = ${show(BUILTIN_IDENTIFIER)}["eval"];
    return (
      (
        () => {
          "use strict";
          let ${show(CALLEE_IDENTIFIER + "1")}, ${show(CALLEE_IDENTIFIER + "2")}, ${show(CALLEE_IDENTIFIER + "3")}, ${show(CALLEE_IDENTIFIER + "4")};
          (
            ${show(CALLEE_IDENTIFIER + "1")} = (...${show("arguments")}) => {
              let ${show("callee")} = ${show(CALLEE_IDENTIFIER + "1")};
              return 1; },
            delete ${show(CALLEE_IDENTIFIER + "1")}.length,
            delete ${show(CALLEE_IDENTIFIER + "1")}.name,
            ${show(CALLEE_IDENTIFIER + "1")});
          (
            ${show(CALLEE_IDENTIFIER + "2")} = function (...${show("arguments")}) {
              let ${show("callee")} = ${show(CALLEE_IDENTIFIER + "2")};
              let ${show("new.target")} = new.target;
              let ${show("this")} = this;
              return 2; },
            delete ${show(CALLEE_IDENTIFIER + "2")}.length,
            delete ${show(CALLEE_IDENTIFIER + "2")}.name,
            ${show(CALLEE_IDENTIFIER + "2")}.prototype = null,
            ${show(CALLEE_IDENTIFIER + "2")});
          (
            ${show(CALLEE_IDENTIFIER + "3")} = (
              (
                {
                  [0] (...${show("arguments")}) {
                    let ${show("callee")} = ${show(CALLEE_IDENTIFIER + "3")};
                    let ${show("this")} = this;
                    return 3; }})
              [0]),
            delete ${show(CALLEE_IDENTIFIER + "3")}.length,
            delete ${show(CALLEE_IDENTIFIER + "3")}.name,
            ${show(CALLEE_IDENTIFIER + "3")});
          (
            ${show(CALLEE_IDENTIFIER + "4")} = function (...${show("arguments")}) {
              let ${show("callee")} = ${show(CALLEE_IDENTIFIER + "4")};
              let ${show("new.target")} = new.target;
              return 4; },
            delete ${show(CALLEE_IDENTIFIER + "4")}.length,
            delete ${show(CALLEE_IDENTIFIER + "4")}.name,
            ${show(CALLEE_IDENTIFIER + "4")}.prototype = null,
            ${show(CALLEE_IDENTIFIER + "4")});
          return 5;})
      ());};`);
// Consumer Expression //
test(
  false,
  `{
    let x;
    eval(x = 1);
    x = (throw x = 2);
    (x = 3, x = 4);
    (x = 5 ? x = 6 : x = 7);
    return 8;}`,
  `(${show(BUILTIN_IDENTIFIER)}) => {
    const eval = ${show(BUILTIN_IDENTIFIER)}["eval"];
    return (
      (
        () => {
          "use strict";
          let ${show("x")};
          eval((${show("x")} = 1, void 0));
          ${show("x")} = ((() => { throw (${show("x")} = 2, void 0); }) ());
          (${show("x")} = 3, ${show("x")} = 4);
          ((${show("x")} = 5, void 0) ? ${show("x")} = 6 : ${show("x")} = 7);
          return 8;})
      ());};`);
// Combiner Expression //
test(
  false,
  `{
    !1;
    (2 + 3);
    ({__proto__:4, [5]:6, [7]:8});
    new (9)(10, 11);
    (12)(@!13, 14, 15);
    (16)(17, 18);
    #global(19, 20);
    #Array.of(21, 22);
    return 23;}`,
    `(${show(BUILTIN_IDENTIFIER)}) => {
      const eval = ${show(BUILTIN_IDENTIFIER)}["eval"];
      return (
        (
          () => {
            "use strict";
            !1;
            (2 + 3);
            ({__proto__:4, [5]:6, [7]:8});
            new (9)(10, 11);
            ${show(BUILTIN_IDENTIFIER)}["Reflect.apply"](12, !13, [14, 15]);
            (16)(17, 18);
            (0, ${show(BUILTIN_IDENTIFIER)}["global"])(19, 20);
            [21, 22];
            return 23;})
        ());};`);

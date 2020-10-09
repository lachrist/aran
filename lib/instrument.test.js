"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Instrument = require("./instrument.js");

const ADVICE_IDENTIFIER = "ADVICE";
const PARAMETERS_IDENTIFIER = "PARAMETERS";
const CALLEE_IDENTIFIER = "CALLEE";

const all = (...childeren) => childeren;
const all_but_first = (_, ...childeren) => childeren;
const none = () => [];

const show = (identifier) => "@" + identifier;

const callbacks = {
  __proto__: null,
  // Block //
  "BLOCK": (identifiers, childeren) => childeren,
  // Statement //
  "Lift": all,
  "Return": all,
  "Break": none,
  "Continue": none,
  "Debugger": none,
  "Bundle": (childeren) => childeren,
  "Lone": all_but_first,
  "If": all_but_first,
  "While": all_but_first,
  "Try": all_but_first,
  // Expression //
  "primitive": none,
  "builtin": none,
  "read": none,
  "function": all,
  "arrow": all,
  "constructor": all,
  "method": all,
  "write": all_but_first,
  "sequence": all,
  "conditional": all,
  "throw": all,
  "eval": all,
  "unary": all_but_first,
  "binary": all_but_first,
  "apply": (child1, child2, childeren) => [child1, child2].concat(childeren),
  "construct": (child, childeren) => [child].concat(childeren),
  "object": (child, properties) => [child].concat(properties.flat())};

for (let name in callbacks) {
  const extract = callbacks[name];
  callbacks[name] = (context, parent, ...fields) => (
    context.serials.set(parent, context.infos.length),
    context.infos.push(
      (
        (
          name in context.counters ?
          null :
          context.counters[name] = 0),
        context.counters[name]++,
        name + context.counters[name])),
    extract(...fields).forEach((child) => Tree._dispatch(callbacks, context, child)));}

const make_pointcut = (trace, cut, infos) => ArrayLite.reduce(
  [
    // Informers //
    "enter",
    "leave",
    "completion",
    "failure",
    "debugger",
    "break",
    "continue",
    // Producers //
    "primitive",
    "read",
    "closure",
    "builtin",
    // Consumers //
    "eval",
    "write",
    "test",
    "return",
    "throw",
    "drop",
    // Combiners //
    "unary",
    "binary",
    "object",
    "apply",
    "construct"],
  (pointcut, name) => (
    pointcut[name] = function (...args) {
      Assert.equal(this, pointcut);
      Assert.ok(args.length > 0);
      const serial = args.pop();
      Assert.ok(typeof serial === "number");
      Assert.ok(/^[0-9]+$/.test(String(serial)));
      Assert.ok(serial < infos.length);
      args.push(infos[serial]);
      const actual = [name].concat(args);
      Assert.ok(trace.length > 0);
      const expected = trace.pop();
      Assert.deepEqual(actual, expected);
      return cut;},
    pointcut),
  {__proto__:null});

const instrument = (local, cut, trace, code) => {
  trace = trace.slice().reverse();
  const serials = new Map();
  const infos = [];
  const block1 = Lang.PARSE_BLOCK(code);
  const counters = {__proto__:null};
  Tree._dispatch(callbacks, {__proto__:null, serials, infos, counters}, block1);
  const pointcut = make_pointcut(trace, cut, infos);
  const namespaces = {
    __proto__: null,
    advice: ADVICE_IDENTIFIER,
    parameters: PARAMETERS_IDENTIFIER,
    callee: CALLEE_IDENTIFIER};
  const block2 = Instrument(block1, {__proto__:null, serials, show, local, pointcut, namespaces});
  return block2;};

const test = (local, code1, trace, code2, code3) => (
  Lang._match_block(
    instrument(local, true, trace, code1),
    Lang.PARSE_BLOCK(code2),
    Assert),
  Lang._match_block(
    instrument(local, false, trace, code1),
    Lang.PARSE_BLOCK(code3),
    Assert));

const trap = (name, ...args) => `(
  #Reflect.get(${ADVICE_IDENTIFIER}, ${JSON.stringify(name)})
  (
    @${ADVICE_IDENTIFIER}
    ${ArrayLite.join(ArrayLite.map(args, (arg) => `, ${arg}`), "")}))`;

const parameter_array_object = {
  "program": ["this"],
  "function": ["callee", "arguments", "this", "new.target"],
  "method": ["callee", "arguments", "this"],
  "constructor": ["callee", "arguments", "new.target"],
  "arrow": ["callee", "arguments"],
  "catch": ["error"],
  "eval": [],
  "lone": [],
  "do": [],
  "then": [],
  "else": [],
  "try": [],
  "finally": []};

const block = (tag, cut, callee, identifiers, statements) => `{
  try {
    ${(
      identifiers.length ?
      `let ${identifiers.join(", ")};` :
      ``)}
    ${callee ? `callee = ${callee};` : ``}
    ${(
      cut ?
      (
        parameter_array_object[tag].length > 0 ?
        `(
          ${PARAMETERS_IDENTIFIER} = {__proto__: null ${parameter_array_object[tag].map((parameter) => `, [${JSON.stringify(show(parameter))}]: ${parameter}`).join("")}},
          ${parameter_array_object[tag].reduce(
            (code, parameter) => `(${code}, ${parameter} = #Reflect.get(${PARAMETERS_IDENTIFIER}, ${JSON.stringify(show(parameter))}))`,
            trap("enter", JSON.stringify(tag), `#Array.of(${cut.labels.map(show).map(JSON.stringify).join(", ")})`, PARAMETERS_IDENTIFIER, `#Array.of(${identifiers.filter((identifier) => !identifier.startsWith(CALLEE_IDENTIFIER)).map(show).map(JSON.stringify).join(", ")})`, String(cut.serial)))});` :
        `${trap("enter", JSON.stringify(tag), `#Array.of(${cut.labels.map(show).map(JSON.stringify).join(", ")})`, `{__proto__:null}`, `#Array.of(${identifiers.filter((identifier) => !identifier.startsWith(CALLEE_IDENTIFIER)).map(show).map(JSON.stringify).join(", ")})`, String(cut.serial))};`) :
      `void 0;`)}
    ${statements}
    ${cut ? trap("completion", JSON.stringify(tag), String(cut.serial)) : `void 0`}; }
  catch {
    throw ${cut ? trap("failure", JSON.stringify(tag), "error", String(cut.serial)) : "error"}; }
  finally {
    ${cut ? trap("leave", JSON.stringify(tag), String(cut.serial)) : "void 0"}; } }`;

// Atomic Statement //
test(
  false,
  `{
      debugger;
      break foo;
      continue bar;
      123;
      return 456;}`,
  [
    ["enter", "program", [], {__proto__: null, "@this":null}, [], "BLOCK1"],
    ["debugger", "Debugger1"],
    ["break", show("foo"), "Break1"],
    ["continue", show("bar"), "Continue1"],
    ["primitive", 123, "primitive1"],
    ["drop", null, "Lift1"],
    ["primitive", 456, "primitive2"],
    ["return", null, "Return1"],
    ["completion", "program", "BLOCK1"],
    ["failure", "program", null, "BLOCK1"],
    ["leave", "program", "BLOCK1"]],
  `{
      return () => {
        let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
        ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
        ${block("program", {serial:0, labels:[]}, null, [], `
          ${trap("debugger", "1")};
          debugger;
          ${trap("break", JSON.stringify(show("foo")), "2")};
          break foo;
          ${trap("continue", JSON.stringify(show("bar")), "3")};
          continue bar;
          ${trap("drop", trap("primitive", "123", "5"), "4")};
          return ${trap("return", trap("primitive", "456", "7"), "6")};`)} }; }`,
  `{
      return () => {
        let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
        ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
        ${block("program", null, null, [], `
            void 0;
            debugger;
            void 0;
            break foo;
            void 0;
            continue bar;
            123;
            return 456;`)} }; }`);

// Compound Statement //
test(
  false,
  `{
      k1: l1: { 1; }
      k2: l2: if (2) { 3; } else { 4; }
      k3: l3: while (5) { 6; }
      k4: l4: try { 7; } catch { 8; } finally { 9; }
      return 10; }`,
  [
    // Begin //
    ["enter", "program", [], {__proto__: null, "@this":null}, [], "BLOCK1"],
    // Lone //
    ["enter", "lone", [show("k1"), show("l1")], {__proto__:null}, [], "BLOCK2"],
    ["primitive", 1, "primitive1"],
    ["drop", null, "Lift1"],
    ["completion", "lone", "BLOCK2"],
    ["failure", "lone", null, "BLOCK2"],
    ["leave", "lone", "BLOCK2"],
    // If //
    ["primitive", 2, "primitive2"],
    ["test", null, "If1"],
    ["enter", "then", [show("k2"), show("l2")], {__proto__:null}, [], "BLOCK3"],
    ["primitive", 3, "primitive3"],
    ["drop", null, "Lift2"],
    ["completion", "then", "BLOCK3"],
    ["failure", "then", null, "BLOCK3"],
    ["leave", "then", "BLOCK3"],
    ["enter", "else", [show("k2"), show("l2")], {__proto__:null}, [], "BLOCK4"],
    ["primitive", 4, "primitive4"],
    ["drop", null, "Lift3"],
    ["completion", "else", "BLOCK4"],
    ["failure", "else", null, "BLOCK4"],
    ["leave", "else", "BLOCK4"],
    // While //
    ["primitive", 5, "primitive5"],
    ["test", null, "While1"],
    ["enter", "do", [show("k3"), show("l3")], {__proto__:null}, [], "BLOCK5"],
    ["primitive", 6, "primitive6"],
    ["drop", null, "Lift4"],
    ["completion", "do", "BLOCK5"],
    ["failure", "do", null, "BLOCK5"],
    ["leave", "do", "BLOCK5"],
    // Try //
    ["enter", "try", [show("k4"), show("l4")], {__proto__:null}, [], "BLOCK6"],
    ["primitive", 7, "primitive7"],
    ["drop", null, "Lift5"],
    ["completion", "try", "BLOCK6"],
    ["failure", "try", null, "BLOCK6"],
    ["leave", "try", "BLOCK6"],
    ["enter", "catch", [show("k4"), show("l4")], {__proto__:null, ["@error"]: null}, [], "BLOCK7"],
    ["primitive", 8, "primitive8"],
    ["drop", null, "Lift6"],
    ["completion", "catch", "BLOCK7"],
    ["failure", "catch", null, "BLOCK7"],
    ["leave", "catch", "BLOCK7"],
    ["enter", "finally", [show("k4"), show("l4")], {__proto__:null}, [], "BLOCK8"],
    ["primitive", 9, "primitive9"],
    ["drop", null, "Lift7"],
    ["completion", "finally", "BLOCK8"],
    ["failure", "finally", null, "BLOCK8"],
    ["leave", "finally", "BLOCK8"],
    // Return //
    ["primitive", 10, "primitive10"],
    ["return", null, "Return1"],
    // End //
    ["completion", "program", "BLOCK1"],
    ["failure", "program", null, "BLOCK1"],
    ["leave", "program", "BLOCK1"]],
  `{
      return () => {
        let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
        ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
        ${block("program", {serial:0, labels:[]}, null, [], `
          k1: l1:
            ${block("lone", {serial:2, labels:["k1", "l1"]}, null, [], `
              ${trap("drop", trap("primitive", "1", "4"), "3")};`)}
          k2: l2: if (${trap("test", trap("primitive", "2", "6"), "5")})
            ${block("then", {serial:7, labels:["k2", "l2"]}, null, [], `
              ${trap("drop", trap("primitive", "3", "9"), "8")};`)}
            else ${block("else", {serial:10, labels:["k2", "l2"]}, null, [], `
              ${trap("drop", trap("primitive", "4", "12"), "11")};`)}
          k3: l3: while (${trap("test", trap("primitive", "5", "14"), "13")})
            ${block("do", {serial:15, labels:["k3", "l3"]}, null, [], `
              ${trap("drop", trap("primitive", "6", "17"), "16")};`)}
          k4: l4: try
            ${block("try", {serial:19, labels:["k4", "l4"]}, null, [], `
              ${trap("drop", trap("primitive", "7", "21"), "20")};`)}
            catch ${block("catch", {serial:22, labels:["k4", "l4"]}, null, [], `
              ${trap("drop", trap("primitive", "8", "24"), "23")};`)}
            finally ${block("finally", {serial:25, labels:["k4", "l4"]}, null, [], `
              ${trap("drop", trap("primitive", "9", "27"), "26")};`)}
          return ${trap("return", trap("primitive", "10", "29"), "28")};`)} }; }`,
  `{
      return () => {
        let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
        ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
        ${block("program", null, null, [], `
          k1: l1:
            ${block("lone", null, null, [], `1;`)}
          k2: l2: if (2)
            ${block("then", null, null, [], `3;`)}
            else ${block("else", null, null, [], `4;`)}
          k3: l3: while (5)
            ${block("do", null, null, [], `6;`)}
          k4: l4: try
            ${block("try", null, null, [], `7;`)}
            catch ${block("catch", null, null, [], `8;`)}
            finally ${block("finally", null, null, [], `9;`)}
          return 10;`)} }; }`);

// Expression //
test(
  false,
  `{
    let x;
    #global;
    x;
    throw (x = 1);
    eval(2);
    (x = 3, 4);
    (5 ? 6 : 7);
    !8;
    (9 + 10);
    new 11(12, 13);
    14(@15, 16, 17);
    {__proto__:18, [19]:20, [21]:22};
    return 23;}`,
  [
    // Begin //
    ["enter", "program", [], {__proto__: null, [show("this")]:null}, [show("x")], "BLOCK1"],
    // builtin //
    ["builtin", "global", null, "builtin1"],
    ["drop", null, "Lift1"],
    // read //
    ["read", show("x"), null, "read1"],
    ["drop", null, "Lift2"],
    // throw && write //
    ["primitive", 1, "primitive1"],
    ["write", show("x"), null, "write1"],
    ["primitive", void 0, "write1"],
    ["throw", null, "throw1"],
    // eval //
    ["primitive", 2, "primitive2"],
    ["eval", null, "eval1"],
    ["drop", null, "Lift4"],
    // sequence && write //
    ["primitive", 3, "primitive3"],
    ["write", show("x"), null, "write2"],
    ["primitive", 4, "primitive4"],
    ["drop", null, "Lift5"],
    // conditional //
    ["primitive", 5, "primitive5"],
    ["test", null, "conditional1"],
    ["primitive", 6, "primitive6"],
    ["drop", null, "Lift6"],
    ["primitive", 7, "primitive7"],
    ["drop", null, "Lift6"],
    // unary //
    ["primitive", 8, "primitive8"],
    ["unary", "!", null, "unary1"],
    ["drop", null, "Lift7"],
    // binary //
    ["primitive", 9, "primitive9"],
    ["primitive", 10, "primitive10"],
    ["binary", "+", null, null, "binary1"],
    ["drop", null, "Lift8"],
    // construct //
    ["primitive", 11, "primitive11"],
    ["primitive", 12, "primitive12"],
    ["primitive", 13, "primitive13"],
    ["construct", null, [null, null], "construct1"],
    ["drop", null, "Lift9"],
    // apply //
    ["primitive", 14, "primitive14"],
    ["primitive", 15, "primitive15"],
    ["primitive", 16, "primitive16"],
    ["primitive", 17, "primitive17"],
    ["apply", null, null, [null, null], "apply1"],
    ["drop", null, "Lift10"],
    // object //
    ["primitive", 18, "primitive18"],
    ["primitive", 19, "primitive19"],
    ["primitive", 20, "primitive20"],
    ["primitive", 21, "primitive21"],
    ["primitive", 22, "primitive22"],
    ["object", null, [[null, null], [null, null]], "object1"],
    ["drop", null, "Lift11"],
    // return //
    ["primitive", 23, "primitive23"],
    ["return", null, "Return1"],
    // End //
    ["completion", "program", "BLOCK1"],
    ["failure", "program", null, "BLOCK1"],
    ["leave", "program", "BLOCK1"]],
  `{
    return () => {
      let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
      ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
      ${block("program", {serial:0, labels:[]}, null, ["x"], `
        ${trap("drop",
          trap("builtin", JSON.stringify("global"), "#global", 2), 1)};
        ${trap("drop",
          trap("read", JSON.stringify(show("x")), "x", 4), 3)};
        throw ${trap("throw", `(
          x = ${trap("write", JSON.stringify(show("x")),
            trap("primitive", "1", 8), 7)},
          ${trap("primitive", "void 0", 7)})`, 6)};
        ${trap("drop", `eval(
          ${trap("eval", trap("primitive", 2, 11), 10)})`, 9)};
        (
          x = ${trap("write", JSON.stringify(show("x")),
            trap("primitive", 3, 15), 14)},
          ${trap("drop",
            trap("primitive", 4, 16), 12)});
        (
          ${trap("test",
            trap("primitive", 5, 19), 18)} ?
          ${trap("drop",
            trap("primitive", 6, 20), 17)} :
          ${trap("drop",
            trap("primitive", 7, 21), 17)});
        ${trap("drop",
          trap("unary", JSON.stringify("!"),
            trap("primitive", 8, 24), 23), 22)};
        ${trap("drop",
          trap("binary", JSON.stringify("+"),
            trap("primitive", 9, 27),
            trap("primitive", 10, 28), 26), 25)};
        ${trap("drop",
          trap("construct",
            trap("primitive", 11, 31),
            `#Array.of(
              ${trap("primitive", 12, 32)},
              ${trap("primitive", 13, 33)})`, 30), 29)};
        ${trap("drop",
          trap("apply",
            trap("primitive", 14, 36),
            trap("primitive", 15, 37),
            `#Array.of(
              ${trap("primitive", 16, 38)},
              ${trap("primitive", 17, 39)})`, 35), 34)};
        ${trap("drop",
          trap("object",
            trap("primitive", 18, 42),
            `#Array.of(
              #Array.of(
                ${trap("primitive", 19, 43)},
                ${trap("primitive", 20, 44)}),
              #Array.of(
                ${trap("primitive", 21, 45)},
                ${trap("primitive", 22, 46)}))`, 41), 40)};
        return ${trap("return",
          trap("primitive", 23, 48), 47)};`)}};}`,
  `{
    return () => {
      let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
      ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
      ${block("program", null, null, ["x"], `
        #global;
        x;
        throw (x = 1, void 0);
        eval(2);
        (x = 3, 4);
        (5 ? 6 : 7);
        !8;
        (9 + 10);
        new 11(12, 13);
        14(@15, 16, 17);
        {__proto__:18, [19]:20, [21]:22};
        return 23;`)}};}`);

// Closure && Eval //
test(
  true,
  `{
    () => {
      return 1;};
    method () {
      return 2;};
    constructor () {
      return 3;};
    function () {
      return 4;};
    return 5;}`,
  [
    // Begin //
    ["enter", "eval", [], {__proto__: null}, [], "BLOCK1"],
    // arrow //
    ["enter", "arrow", [], {__proto__:null, [show("callee")]:null, [show("arguments")]:null}, [], "BLOCK2"],
    ["primitive", 1, "primitive1"],
    ["return", null, "Return1"],
    ["completion", "arrow", "BLOCK2"],
    ["failure", "arrow", null, "BLOCK2"],
    ["leave", "arrow", "BLOCK2"],
    ["closure", "arrow", null, "arrow1"],
    ["drop", null, "Lift1"],
    // method //
    ["enter", "method", [], {__proto__:null, [show("callee")]:null, [show("arguments")]:null, [show("this")]:null}, [], "BLOCK3"],
    ["primitive", 2, "primitive2"],
    ["return", null, "Return2"],
    ["completion", "method", "BLOCK3"],
    ["failure", "method", null, "BLOCK3"],
    ["leave", "method", "BLOCK3"],
    ["closure", "method", null, "method1"],
    ["drop", null, "Lift2"],
    // constructor //
    ["enter", "constructor", [], {__proto__:null, [show("callee")]:null, [show("arguments")]:null, [show("new.target")]:null}, [], "BLOCK4"],
    ["primitive", 3, "primitive3"],
    ["return", null, "Return3"],
    ["completion", "constructor", "BLOCK4"],
    ["failure", "constructor", null, "BLOCK4"],
    ["leave", "constructor", "BLOCK4"],
    ["closure", "constructor", null, "constructor1"],
    ["drop", null, "Lift3"],
    // function //
    ["enter", "function", [], {__proto__:null, [show("callee")]:null, [show("arguments")]:null, [show("new.target")]:null, [show("this")]:null}, [], "BLOCK5"],
    ["primitive", 4, "primitive4"],
    ["return", null, "Return4"],
    ["completion", "function", "BLOCK5"],
    ["failure", "function", null, "BLOCK5"],
    ["leave", "function", "BLOCK5"],
    ["closure", "function", null, "function1"],
    ["drop", null, "Lift4"],
    // Return //
    ["primitive", 5, "primitive5"],
    ["return", null, "Return5"],
    // End //
    ["completion", "eval", "BLOCK1"],
    ["failure", "eval", null, "BLOCK1"],
    ["leave", "eval", "BLOCK1"]],
  `{
    return () => {
      let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
      ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
      ${block("eval", {serial:0, labels:[]}, null, [CALLEE_IDENTIFIER + "0", CALLEE_IDENTIFIER + "1", CALLEE_IDENTIFIER + "2", CALLEE_IDENTIFIER + "3"], `
        ${trap("drop", `(
          ${CALLEE_IDENTIFIER}0 = ${trap("closure", JSON.stringify("arrow"), `
            () => ${block("arrow", {serial:3, labels:[]}, CALLEE_IDENTIFIER + "0", [], `
              return ${trap("return",
                trap("primitive", 1, 5), 4)};`)}`, 2)},
          ${CALLEE_IDENTIFIER}0)`, 1)};
        ${trap("drop", `(
          ${CALLEE_IDENTIFIER}1 = ${trap("closure", JSON.stringify("method"), `
            method () ${block("method", {serial:8, labels:[]}, CALLEE_IDENTIFIER + "1", [], `
              return ${trap("return",
                trap("primitive", 2, 10), 9)};`)}`, 7)},
          ${CALLEE_IDENTIFIER}1)`, 6)};
        ${trap("drop", `(
          ${CALLEE_IDENTIFIER}2 = ${trap("closure", JSON.stringify("constructor"), `
            constructor () ${block("constructor", {serial:13, labels:[]}, CALLEE_IDENTIFIER + "2", [], `
              return ${trap("return",
                trap("primitive", 3, 15), 14)};`)}`, 12)},
          ${CALLEE_IDENTIFIER}2)`, 11)};
        ${trap("drop", `(
          ${CALLEE_IDENTIFIER}3 = ${trap("closure", JSON.stringify("function"), `
            function () ${block("function", {serial:18, labels:[]}, CALLEE_IDENTIFIER + "3", [], `
              return ${trap("return",
                trap("primitive", 4, 20), 19)};`)}`, 17)},
          ${CALLEE_IDENTIFIER}3)`, 16)};
        return ${trap("return",
          trap("primitive", 5, 22), 21)};`)}};}`,
  `{
    return () => {
      let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
      ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
      ${block("program", null, null, [CALLEE_IDENTIFIER + "0", CALLEE_IDENTIFIER + "1", CALLEE_IDENTIFIER + "2", CALLEE_IDENTIFIER + "3"], `
        (
          ${CALLEE_IDENTIFIER}0 = () => ${block("arrow", null, CALLEE_IDENTIFIER + "0", [], `
            return 1;`)},
          ${CALLEE_IDENTIFIER}0);
        (
          ${CALLEE_IDENTIFIER}1 = method () ${block("method", null, CALLEE_IDENTIFIER + "1", [], `
            return 2;`)},
          ${CALLEE_IDENTIFIER}1);
        (
          ${CALLEE_IDENTIFIER}2 = constructor () ${block("constructor", null, CALLEE_IDENTIFIER + "2", [], `
            return 3;`)},
          ${CALLEE_IDENTIFIER}2);
        (
          ${CALLEE_IDENTIFIER}3 = function () ${block("function", null, CALLEE_IDENTIFIER + "3", [], `
            return 4;`)},
          ${CALLEE_IDENTIFIER}3);
        return 5;`)}};}`);

// Constant Pointcut & Local //
Lang._match_block(
  Instrument(
    Lang.PARSE_BLOCK(`{
      123;
      return #global;}`),
    {
      __proto__:null,
      serials: new Map(),
      show: show,
      local: true,
      pointcut: {
        __proto__: null,
        primitive: true,
        builtin: false},
      namespaces: {
        __proto__: null,
        advice: ADVICE_IDENTIFIER,
        parameters: PARAMETERS_IDENTIFIER,
        callee: CALLEE_IDENTIFIER}}),
  Lang.PARSE_BLOCK(`{
    return () => {
      let ${ADVICE_IDENTIFIER}, ${PARAMETERS_IDENTIFIER};
      ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
      ${block("eval", null, null, [], `
        ${trap("primitive", 123, "void 0")};
        return #global;`)}};}`),
  Assert);

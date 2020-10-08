"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Stratum = require("./stratum.js");
const Instrument = require("./instrument.js");

const ADVICE_IDENTIFIER = "ADV";

const PARAMETERS_IDENTIFIER = "PARAMS";

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
  const block2 = Instrument(block1, {__proto__: null, serials, local, pointcut});
  return block2;};

const test = (local, trace, code1, code2, code3) => (
  Lang._match_block(
    instrument(local, true, trace, code1),
    Lang.PARSE_BLOCK(code2),
    Assert),
  Lang._match_block(
    instrument(local, false, trace, code1),
    Lang.PARSE_BLOCK(code3),
    Assert));

const show = (identifier) => {
  if (Stratum._is_base(identifier)) {
    return Stratum._get_body(identifier);
  }
  if (Stratum._is_meta(identifier)) {
    return "#" + Stratum._get_body(identifier);
  }
  return "@" + identifier;
};

const trap = (name, ...args) => `(
  #Reflect.get(${ADVICE_IDENTIFIER}, ${JSON.stringify(name)})
  (
    @${ADVICE_IDENTIFIER}
    ${ArrayLite.join(ArrayLite.map(args, (arg) => `, ${arg}`), "")}))`;

const parameter_array_object = {
  "program": ["this"],
  "function": ["new.target", "this", "arguments"],
  "method": ["this", "arguments"],
  "constructor": ["new.target", "arguments"],
  "arrow": ["arguments"],
  "catch": ["error"],
  "eval": [],
  "lone": [],
  "do": [],
  "then": [],
  "else": [],
  "try": [],
  "finally": []};

const block = (tag, cut, identifiers, statements) => `{
  try {
    let ${[PARAMETERS_IDENTIFIER].concat(identifiers).join(", ")};
    ${PARAMETERS_IDENTIFIER} = {__proto__: null ${parameter_array_object[tag].map((parameter) => `, [${JSON.stringify(show(parameter))}]: ${parameter}`).join("")}};
    ${cut ? trap("enter", JSON.stringify(tag), `#Array.of(${cut.labels.map(show).map(JSON.stringify).join(", ")})`, PARAMETERS_IDENTIFIER, `#Array.of(${identifiers.map(show).map(JSON.stringify).join(", ")})`, String(cut.serial)) : "void 0"};
    ${statements}
    ${cut ? trap("completion", JSON.stringify(tag), String(cut.serial)) : `void 0`}; }
  catch {
    throw ${cut ? trap("failure", JSON.stringify(tag), "error", String(cut.serial)) : "error"}; }
  finally {
    ${cut ? trap("leave", JSON.stringify(tag), String(cut.serial)) : "void 0"}; } }`;

// Atomic Statement //
test(
  false,
  [
    ["enter", "program", [], {__proto__: null, "@this":null}, [], "BLOCK1"],
    ["debugger", "Debugger1"],
    ["break", "foo", "Break1"],
    ["continue", "bar", "Continue1"],
    ["primitive", 123, "primitive1"],
    ["drop", null, "Lift1"],
    ["primitive", 456, "primitive2"],
    ["return", null, "Return1"],
    ["completion", "program", "BLOCK1"],
    ["failure", "program", null, "BLOCK1"],
    ["leave", "program", "BLOCK1"]],
  `{
      debugger;
      break ${Stratum._base("foo")};
      continue ${Stratum._base("bar")};
      123;
      return 456;}`,
  `{
      return () => {
        let ${ADVICE_IDENTIFIER};
        ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
        ${block("program", {serial:0, labels:[]}, [], `
          ${trap("debugger", "1")};
          debugger;
          ${trap("break", "\"foo\"", "2")};
          break ${Stratum._base("foo")};
          ${trap("continue", "\"bar\"", "3")};
          continue ${Stratum._base("bar")};
          ${trap("drop", trap("primitive", "123", "5"), "4")};
          return ${trap("return", trap("primitive", "456", "7"), "6")};`)} }; }`,
  `{
      return () => {
        let ${ADVICE_IDENTIFIER};
        ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
        ${block("program", null, [], `
            void 0;
            debugger;
            void 0;
            break ${Stratum._base("foo")};
            void 0;
            continue ${Stratum._base("bar")};
            123;
            return 456;`)} }; }`);

// Compound Statement //
test(
  false,
  [
    // Begin //
    ["enter", "program", [], {__proto__: null, "@this":null}, [], "BLOCK1"],
    // Lone //
    ["enter", "lone", ["k1", "l1"], {__proto__:null}, [], "BLOCK2"],
    ["primitive", 1, "primitive1"],
    ["drop", null, "Lift1"],
    ["completion", "lone", "BLOCK2"],
    ["failure", "lone", null, "BLOCK2"],
    ["leave", "lone", "BLOCK2"],
    // If //
    ["primitive", 2, "primitive2"],
    ["test", null, "If1"],
    ["enter", "then", ["k2", "l2"], {__proto__:null}, [], "BLOCK3"],
    ["primitive", 3, "primitive3"],
    ["drop", null, "Lift2"],
    ["completion", "then", "BLOCK3"],
    ["failure", "then", null, "BLOCK3"],
    ["leave", "then", "BLOCK3"],
    ["enter", "else", ["k2", "l2"], {__proto__:null}, [], "BLOCK4"],
    ["primitive", 4, "primitive4"],
    ["drop", null, "Lift3"],
    ["completion", "else", "BLOCK4"],
    ["failure", "else", null, "BLOCK4"],
    ["leave", "else", "BLOCK4"],
    // While //
    ["primitive", 5, "primitive5"],
    ["test", null, "While1"],
    ["enter", "do", ["k3", "l3"], {__proto__:null}, [], "BLOCK5"],
    ["primitive", 6, "primitive6"],
    ["drop", null, "Lift4"],
    ["completion", "do", "BLOCK5"],
    ["failure", "do", null, "BLOCK5"],
    ["leave", "do", "BLOCK5"],
    // Try //
    ["enter", "try", ["k4", "l4"], {__proto__:null}, [], "BLOCK6"],
    ["primitive", 7, "primitive7"],
    ["drop", null, "Lift5"],
    ["completion", "try", "BLOCK6"],
    ["failure", "try", null, "BLOCK6"],
    ["leave", "try", "BLOCK6"],
    ["enter", "catch", ["k4", "l4"], {__proto__:null, ["@error"]: null}, [], "BLOCK7"],
    ["primitive", 8, "primitive8"],
    ["drop", null, "Lift6"],
    ["completion", "catch", "BLOCK7"],
    ["failure", "catch", null, "BLOCK7"],
    ["leave", "catch", "BLOCK7"],
    ["enter", "finally", ["k4", "l4"], {__proto__:null}, [], "BLOCK8"],
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
      $k1: $l1: { 1; }
      $k2: $l2: if (2) { 3; } else { 4; }
      $k3: $l3: while (5) { 6; }
      $k4: $l4: try { 7; } catch { 8; } finally { 9; }
      return 10; }`,
  `{
      return () => {
        let ${ADVICE_IDENTIFIER};
        ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
        ${block("program", {serial:0, labels:[]}, [], `
          $k1: $l1:
            ${block("lone", {serial:2, labels:["$k1", "$l1"]}, [], `
              ${trap("drop", trap("primitive", "1", "4"), "3")};`)}
          $k2: $l2: if (${trap("test", trap("primitive", "2", "6"), "5")})
            ${block("then", {serial:7, labels:["$k2", "$l2"]}, [], `
              ${trap("drop", trap("primitive", "3", "9"), "8")};`)}
            else ${block("else", {serial:10, labels:["$k2", "$l2"]}, [], `
              ${trap("drop", trap("primitive", "4", "12"), "11")};`)}
          $k3: $l3: while (${trap("test", trap("primitive", "5", "14"), "13")})
            ${block("do", {serial:15, labels:["$k3", "$l3"]}, [], `
              ${trap("drop", trap("primitive", "6", "17"), "16")};`)}
          $k4: $l4: try
            ${block("try", {serial:19, labels:["$k4", "$l4"]}, [], `
              ${trap("drop", trap("primitive", "7", "21"), "20")};`)}
            catch ${block("catch", {serial:22, labels:["$k4", "$l4"]}, [], `
              ${trap("drop", trap("primitive", "8", "24"), "23")};`)}
            finally ${block("finally", {serial:25, labels:["$k4", "$l4"]}, [], `
              ${trap("drop", trap("primitive", "9", "27"), "26")};`)}
          return ${trap("return", trap("primitive", "10", "29"), "28")};`)} }; }`,
  `{
      return () => {
        let ${ADVICE_IDENTIFIER};
        ${ADVICE_IDENTIFIER} = #Reflect.get(arguments, 0);
        ${block("program", null, [], `
          $k1: $l1:
            ${block("lone", null, [], `1;`)}
          $k2: $l2: if (2)
            ${block("then", null, [], `3;`)}
            else ${block("else", null, [], `4;`)}
          $k3: $l3: while (5)
            ${block("do", null, [], `6;`)}
          $k4: $l4: try
            ${block("try", null, [], `7;`)}
            catch ${block("catch", null, [], `8;`)}
            finally ${block("finally", null, [], `9;`)}
          return 10;`)} }; }`);

//

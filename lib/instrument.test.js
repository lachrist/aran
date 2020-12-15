"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js")._toggle_debug_mode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Instrument = require("./instrument.js");

const callee_identifier = "CALLEE";
const namespace_prototype = {
  callee () {
    return callee_identifier + global.String(this.counter++);
  }
};
const is_not_namespace_identifier = (identifier) => !identifier.startsWith(callee_identifier);

const last = (...childeren) => [childeren[childeren.length - 1]];
const all = (...childeren) => childeren;
const all_but_first = (_, ...childeren) => childeren;
const none = () => [];

const show = {
  __proto__: null,
  identifier: (identifier) => "@" + identifier,
  label: (label) => "#" + label};

const callbacks = {
  __proto__: null,
  // Program //
  "_program": (preludes, block) => ArrayLite.concat(preludes, [block]),
  // Prelude //
  "_import": none,
  "_export": none,
  "_aggregate": none,
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
  "import": none,
  "export": all_but_first,
  "require": all,
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
    "aggregate",
    // Producers //
    "eval",
    "require",
    "import",
    "primitive",
    "read",
    "closure",
    "builtin",
    // Consumers //
    "code",
    "source",
    "export",
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

const instrument = (cut, trace, code) => {
  trace = trace.slice().reverse();
  const serials = new Map();
  const infos = [];
  const program1 = Lang._parse_program(code);
  const counters = {__proto__:null};
  Tree._dispatch(callbacks, {
    __proto__: null,
    serials,
    infos,
    counters
  }, program1);
  const pointcut = make_pointcut(trace, cut, infos);
  const namespace = {__proto__:namespace_prototype, counter:0};
  const program2 = Instrument(program1, {
    __proto__: null,
    source: "script",
    namespace,
    serials,
    show,
    pointcut
  });
  return program2;};

const test = (code1, trace, code2, code3) => (
  Lang._match_program(
    instrument(true, trace, code1),
    Lang._parse_program(code2),
    Assert),
  Lang._match_program(
    instrument(false, trace, code1),
    Lang._parse_program(code3),
    Assert));

const trap = (name, serial, ...args) => `(
  #Reflect.get(#aran.advice, ${JSON.stringify(name)})
  (
    @#aran.advice
    ${ArrayLite.join(
      ArrayLite.map(
        ArrayLite.concat(args, [global.String(serial)]),
        (arg) => `, ${arg}`), "")}))`;

const block = (tag, cut, callee, identifiers, statements) => (
  cut === null ?
  `{
    ${(
      identifiers.length ?
      `let ${identifiers.join(", ")};` :
      ``)}
    ${callee ? `#Reflect.set(input, "callee", ${callee});` : ``}
    ${statements}}` :
  `{
    try {
      ${(
        identifiers.length ?
        `let ${identifiers.join(", ")};` :
        ``)}
      ${callee ? `#Reflect.set(input, "callee", ${callee});` : ``}
      ${(
        `input = ${trap(
          "enter",
          cut.serial,
          JSON.stringify(tag),
          `{
            __proto__: null,
            module: #Array.of(${cut.module.map((trade) => `{__proto__: null,${global.JSON.stringify(trade).substring(1)}`)}),
            labels: #Array.of(${cut.labels.map(show.label).map(JSON.stringify).join(", ")}),
            identifiers: #Array.of(${identifiers.filter(is_not_namespace_identifier).map(show.identifier).map(JSON.stringify).join(", ")})}`,
          "input")};`)}
      ${statements}
      ${trap("completion", cut.serial, JSON.stringify(tag))}; }
    catch {
      throw ${trap("failure", cut.serial, JSON.stringify(tag), `#Reflect.get(input, "error")`)}; }
    finally {
      ${trap("leave", String(cut.serial), JSON.stringify(tag))}; } }`);

let counter = null;

// Prelude //
test(
  `
    import import1 from "source1";
    export export1;
    aggregate import2 from "source2" as export2;
    {}`,
  [
    [
      "enter",
      "script",
      {
        __proto__: null,
        module: [
          {
            __proto__: null,
            type: "import",
            import: "import1",
            source: "source1"},
          {
            __proto__: null,
            type: "export",
            export: "export1"},
          {
            __proto__: null,
            type: "aggregate",
            import: "import2",
            source: "source2",
            export: "export2"}],
        labels: [],
        identifiers: []},
      {__proto__:null},
      "BLOCK1"],
    ["completion", "script", "BLOCK1"],
    ["failure", "script", null, "BLOCK1"],
    ["leave", "script", "BLOCK1"]],
  `
    import import1 from "source1";
    export export1;
    aggregate import2 from "source2" as export2;
    ${block("script", {
      serial: 4,
      module: [
        {
          type: "import",
          import: "import1",
          source: "source1"},
        {
          type: "export",
          export: "export1"},
        {
          type: "aggregate",
          import: "import2",
          source: "source2",
          export: "export2"}],
      labels: [],
      identifiers: []}, null, [], ``)}`,
  `
    import import1 from "source1";
    export export1;
    aggregate import2 from "source2" as export2;
    ${block("script", null, null, [], ``)}`);

// Atomic Statement //
counter = 0;
test(
  `{
      debugger;
      break foo;
      continue bar;
      123;
      return 456; }`,
  [
    [
      "enter",
      "script",
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null},
      "BLOCK1"],
    ["debugger", "Debugger1"],
    ["break", show.label("foo"), "Break1"],
    ["continue", show.label("bar"), "Continue1"],
    ["primitive", 123, "primitive1"],
    ["drop", null, "Lift1"],
    ["primitive", 456, "primitive2"],
    ["return", null, "Return1"],
    ["completion", "script", "BLOCK1"],
    ["failure", "script", null, "BLOCK1"],
    ["leave", "script", "BLOCK1"]],
  `${block((counter++, "script"), {serial:counter++, module:[], labels:[]}, null, [], `
    ${trap("debugger", counter++)};
    debugger;
    ${trap("break", counter++, JSON.stringify(show.label("foo")))};
    break foo;
    ${trap("continue", counter++, JSON.stringify(show.label("bar")))};
    continue bar;
    ${trap("drop", counter++, trap("primitive", counter++, "123"))};
    return ${trap("return", counter++, trap("primitive", counter++, "456"))};`)}`,
  `${block("script", null, null, [], `
    debugger;
    break foo;
    continue bar;
    123;
    return 456;`)}`);

// Compound Statement //
counter = 0;
test(
  `{
      k1: l1: { 1; }
      k2: l2: if (2) { 3; } else { 4; }
      k3: l3: while (5) { 6; }
      k4: l4: try { 7; } catch { 8; } finally { 9; }
      return 10; }`,
  [
    // Begin //
    [
      "enter",
      "script",
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null},
      "BLOCK1"],
    // Lone //
    [
      "enter",
      "lone",
      {__proto__:null, module:[], labels:[show.label("k1"), show.label("l1")], identifiers:[]},
      {__proto__:null},
      "BLOCK2"],
    ["primitive", 1, "primitive1"],
    ["drop", null, "Lift1"],
    ["completion", "lone", "BLOCK2"],
    ["failure", "lone", null, "BLOCK2"],
    ["leave", "lone", "BLOCK2"],
    // If //
    ["primitive", 2, "primitive2"],
    ["test", null, "If1"],
    [
      "enter",
      "then",
      {__proto__:null, module:[], labels:[show.label("k2"), show.label("l2")], identifiers:[]},
      {__proto__:null},
      "BLOCK3"],
    ["primitive", 3, "primitive3"],
    ["drop", null, "Lift2"],
    ["completion", "then", "BLOCK3"],
    ["failure", "then", null, "BLOCK3"],
    ["leave", "then", "BLOCK3"],
    [
      "enter",
      "else",
      {__proto__:null, module:[], labels:[show.label("k2"), show.label("l2")], identifiers:[]},
      {__proto__:null},
      "BLOCK4"],
    ["primitive", 4, "primitive4"],
    ["drop", null, "Lift3"],
    ["completion", "else", "BLOCK4"],
    ["failure", "else", null, "BLOCK4"],
    ["leave", "else", "BLOCK4"],
    // While //
    ["primitive", 5, "primitive5"],
    ["test", null, "While1"],
    [
      "enter",
      "do",
      {__proto__:null, module:[], labels:[show.label("k3"), show.label("l3")], identifiers:[]},
      {__proto__:null},
      "BLOCK5"],
    ["primitive", 6, "primitive6"],
    ["drop", null, "Lift4"],
    ["completion", "do", "BLOCK5"],
    ["failure", "do", null, "BLOCK5"],
    ["leave", "do", "BLOCK5"],
    // Try //
    [
      "enter",
      "try",
      {__proto__:null, module:[], labels:[show.label("k4"), show.label("l4")], identifiers:[]},
      {__proto__:null},
      "BLOCK6"],
    ["primitive", 7, "primitive7"],
    ["drop", null, "Lift5"],
    ["completion", "try", "BLOCK6"],
    ["failure", "try", null, "BLOCK6"],
    ["leave", "try", "BLOCK6"],
    [
      "enter",
      "catch",
      {__proto__:null, module:[], labels:[show.label("k4"), show.label("l4")], identifiers:[]},
      {__proto__:null, "error":null},
      "BLOCK7"],
    ["primitive", 8, "primitive8"],
    ["drop", null, "Lift6"],
    ["completion", "catch", "BLOCK7"],
    ["failure", "catch", null, "BLOCK7"],
    ["leave", "catch", "BLOCK7"],
    [
      "enter",
      "finally",
      {__proto__:null, module:[], labels:[show.label("k4"), show.label("l4")], identifiers:[]},
      {__proto__:null},
      "BLOCK8"],
    ["primitive", 9, "primitive9"],
    ["drop", null, "Lift7"],
    ["completion", "finally", "BLOCK8"],
    ["failure", "finally", null, "BLOCK8"],
    ["leave", "finally", "BLOCK8"],
    // Return //
    ["primitive", 10, "primitive10"],
    ["return", null, "Return1"],
    // End //
    ["completion", "script", "BLOCK1"],
    ["failure", "script", null, "BLOCK1"],
    ["leave", "script", "BLOCK1"]],
  `${block((counter++, "script"), {serial:counter++, module:[], labels:[]}, null, [], `
    k1: l1:
      ${block((counter++, "lone"), {serial:counter++, module:[], labels:["k1", "l1"]}, null, [], `
        ${trap("drop", counter++, trap("primitive", counter++, "1"))};`)}
    k2: l2: if (${trap("test", counter++, trap("primitive", counter++, "2"))})
      ${block("then", {serial:counter++, module:[], labels:["k2", "l2"]}, null, [], `
        ${trap("drop", counter++, trap("primitive", counter++, "3"))};`)}
      else ${block("else", {serial:counter++, module:[], labels:["k2", "l2"]}, null, [], `
        ${trap("drop", counter++, trap("primitive", counter++, "4"))};`)}
    k3: l3: while (${trap("test", counter++, trap("primitive", counter++, "5"))})
      ${block("do", {serial:counter++, module:[], labels:["k3", "l3"]}, null, [], `
        ${trap("drop", counter++, trap("primitive", counter++, "6"))};`)}
    k4: l4: try
      ${block((counter++, "try"), {serial:counter++, module:[], labels:["k4", "l4"]}, null, [], `
        ${trap("drop", counter++, trap("primitive", counter++, "7"))};`)}
      catch ${block("catch", {serial:counter++, module:[], labels:["k4", "l4"]}, null, [], `
        ${trap("drop", counter++, trap("primitive", counter++, "8"))};`)}
      finally ${block("finally", {serial:counter++, module:[], labels:["k4", "l4"]}, null, [], `
        ${trap("drop", counter++, trap("primitive", counter++, "9"))};`)}
    return ${trap("return", counter++, trap("primitive", counter++, "10"))};`)}`,
  `${block("script", null, null, [], `
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
    return 10;`)}`);

// Expression //
counter = 0;
test(
  `{
    let x;
    #global;
    x;
    throw (x = 1);
    eval 2;
    (x = 3, 4);
    (5 ? 6 : 7);
    !8;
    (9 + 10);
    new 11(12, 13);
    14(@15, 16, 17);
    {__proto__:18, [19]:20, [21]:22};
    require 23;
    import specifier1 from "source";
    export specifier2 24;
    return 25; }`,
  [
    // Begin //
    [
      "enter",
      "script",
      {__proto__:null, module:[], labels:[], identifiers:[show.identifier("x")]},
      {__proto__:null},
      "BLOCK1"],
    // builtin //
    ["builtin", "global", null, "builtin1"],
    ["drop", null, "Lift1"],
    // read //
    ["read", show.identifier("x"), null, "read1"],
    ["drop", null, "Lift2"],
    // throw && write //
    ["primitive", 1, "primitive1"],
    ["write", show.identifier("x"), null, "write1"],
    ["primitive", void 0, "write1"],
    ["throw", null, "throw1"],
    // eval //
    ["primitive", 2, "primitive2"],
    ["code", null, "eval1"],
    ["eval", null, "eval1"],
    ["drop", null, "Lift4"],
    // sequence && write //
    ["primitive", 3, "primitive3"],
    ["write", show.identifier("x"), null, "write2"],
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
    // require //
    ["primitive", 23, "primitive23"],
    ["source", null, "require1"],
    ["require", null, "require1"],
    ["drop", null, "Lift12"],
    // import //
    ["import", "specifier1", "source", null, "import1"],
    ["drop", null, "Lift13"],
    // export //
    ["primitive", 24, "primitive24"],
    ["export", "specifier2", null, "export1"],
    // return //
    ["primitive", 25, "primitive25"],
    ["return", null, "Return1"],
    // End //
    ["completion", "script", "BLOCK1"],
    ["failure", "script", null, "BLOCK1"],
    ["leave", "script", "BLOCK1"]],
  `${block((counter++, "script"), {serial:counter++, module:[], labels:[]}, null, ["x"], `
    ${trap(
      "drop",
      counter++,
      trap("builtin", counter++, JSON.stringify("global"), "#global"))};
    ${trap(
      "drop",
      counter++,
      trap("read", counter++, JSON.stringify(show.identifier("x")), "x"))};
    throw ${trap(
      "throw",
      (counter++, counter++),
      `(
        x = ${trap(
          "write",
          counter++,
          JSON.stringify(show.identifier("x")),
          trap("primitive", counter++, 1))},
        ${trap("primitive", counter - 2, "void 0")})`)};
    ${trap(
      "drop",
      counter++,
      trap(
        "eval",
        counter++,
        `eval
          ${trap("code", counter - 1, trap("primitive", counter++, 2))}`))};
    (
      x = ${trap("write", (counter++, counter++, counter++), JSON.stringify(show.identifier("x")),
        trap("primitive", counter++, 3))},
      ${trap(
        "drop",
        counter - 4,
        trap("primitive", counter, 4))});
    (
      ${trap(
        "test",
        (counter++, counter++, counter++),
        trap("primitive", counter++, 5))} ?
      ${trap(
        "drop",
        counter - 3,
        trap("primitive", counter++, 6))} :
      ${trap(
        "drop",
        counter - 4,
        trap("primitive", counter++, 7))});
    ${trap(
      "drop",
      counter++,
      trap(
        "unary",
        counter++,
        JSON.stringify("!"),
        trap("primitive", counter++, 8)))};
    ${trap(
      "drop",
      counter++,
      trap(
        "binary",
        counter++,
        JSON.stringify("+"),
        trap("primitive", counter++, 9),
        trap("primitive", counter++, 10)))};
    ${trap(
      "drop",
      counter++,
      trap(
        "construct",
        counter++,
        trap("primitive", counter++, 11),
        `#Array.of(
          ${trap("primitive", counter++, 12)},
          ${trap("primitive", counter++, 13)})`))};
    ${trap(
      "drop",
      counter++,
      trap("apply",
        counter++,
        trap("primitive", counter++, 14),
        trap("primitive", counter++, 15),
        `#Array.of(
          ${trap("primitive", counter++, 16)},
          ${trap("primitive", counter++, 17)})`))};
    ${trap(
      "drop",
      counter++,
      trap("object",
        counter++,
        trap("primitive", counter++, 18),
        `#Array.of(
          #Array.of(
            ${trap("primitive", counter++, 19)},
            ${trap("primitive", counter++, 20)}),
          #Array.of(
            ${trap("primitive", counter++, 21)},
            ${trap("primitive", counter++, 22)}))`))};
    ${trap(
      "drop",
      counter++,
      trap(
        "require",
        counter++,
        `require
          ${trap(
            "source",
            counter - 1,
            trap("primitive", counter++, 23))}`))};
    ${trap(
      "drop",
      counter++,
      trap("import", counter++, JSON.stringify("specifier1"), JSON.stringify("source"), `import specifier1 from "source"`))};
    export specifier2 ${trap(
        "export",
        (counter++, counter++),
        JSON.stringify("specifier2"),
        trap("primitive", counter++, 24))};
    return ${trap(
      "return",
      counter++,
      trap("primitive", counter++, 25))};`)}`,
  `${block("script", null, null, ["x"], `
    #global;
    x;
    throw (x = 1, void 0);
    eval 2;
    (x = 3, 4);
    (5 ? 6 : 7);
    !8;
    (9 + 10);
    new 11(12, 13);
    14(@15, 16, 17);
    {__proto__:18, [19]:20, [21]:22};
    require 23;
    import specifier1 from "source";
    export specifier2 24;
    return 25;`)}`);

// Closure && Eval //
counter = 0;
test(
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
    [
      "enter",
      "script",
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null},
      "BLOCK1"],
    // arrow //
    [
      "enter",
      "arrow",
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null, "callee": null, "arguments": null},
      "BLOCK2"],
    ["primitive", 1, "primitive1"],
    ["return", null, "Return1"],
    ["completion", "arrow", "BLOCK2"],
    ["failure", "arrow", null, "BLOCK2"],
    ["leave", "arrow", "BLOCK2"],
    ["closure", "arrow", null, "arrow1"],
    ["drop", null, "Lift1"],
    // method //
    [
      "enter",
      "method",
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null, "callee": null, "arguments": null, "this":null},
      "BLOCK3"],
    ["primitive", 2, "primitive2"],
    ["return", null, "Return2"],
    ["completion", "method", "BLOCK3"],
    ["failure", "method", null, "BLOCK3"],
    ["leave", "method", "BLOCK3"],
    ["closure", "method", null, "method1"],
    ["drop", null, "Lift2"],
    // constructor //
    [
      "enter",
      "constructor",
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null, "callee": null, "arguments": null, "new.target":null},
      "BLOCK4"],
    ["primitive", 3, "primitive3"],
    ["return", null, "Return3"],
    ["completion", "constructor", "BLOCK4"],
    ["failure", "constructor", null, "BLOCK4"],
    ["leave", "constructor", "BLOCK4"],
    ["closure", "constructor", null, "constructor1"],
    ["drop", null, "Lift3"],
    // function //
    [
      "enter",
      "function",
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null, "callee": null, "arguments": null, "this":null, "new.target":null},
      "BLOCK5"],
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
    ["completion", "script", "BLOCK1"],
    ["failure", "script", null, "BLOCK1"],
    ["leave", "script", "BLOCK1"]],
  `${block(
    "script",
    {serial:(counter++, counter++), module:[], labels:[]},
    null,
    [callee_identifier + "0", callee_identifier + "1", callee_identifier + "2", callee_identifier + "3"],
    `${trap(
      "drop",
      counter++,
      `(
        ${callee_identifier}0 = ${trap(
          "closure",
          counter++,
          JSON.stringify("arrow"),
          `() => ${block(
            "arrow",
            {serial:counter++, module:[], labels:[]},
            callee_identifier + "0",
            [],
            `return ${trap(
              "return",
              counter++,
              trap("primitive", counter++, 1))};`)}`)},
        ${callee_identifier}0)`)};
    ${trap(
      "drop",
      counter++,
      `(
        ${callee_identifier}1 = ${trap(
          "closure",
          counter++,
          JSON.stringify("method"),
          `method () ${block(
            "method",
            {serial:counter++, module:[], labels:[]},
            callee_identifier + "1",
            [],
            `return ${trap(
              "return",
              counter++,
              trap("primitive", counter++, 2))};`)}`)},
        ${callee_identifier}1)`)};
    ${trap(
      "drop",
      counter++,
      `(
        ${callee_identifier}2 = ${trap(
          "closure",
          counter++,
          JSON.stringify("constructor"),
          `constructor () ${block(
            "constructor",
            {serial:counter++, module:[], labels:[]},
            callee_identifier + "2",
            [],
            `return ${trap(
              "return",
              counter++,
              trap("primitive", counter++, 3))};`)}`)},
        ${callee_identifier}2)`)};
    ${trap(
      "drop",
      counter++,
      `(
        ${callee_identifier}3 = ${trap(
          "closure",
          counter++,
          JSON.stringify("function"),
          `function () ${block(
            "function",
            {serial:counter++, module:[], labels:[]},
            callee_identifier + "3",
            [],
            `return ${trap(
              "return",
              counter++,
              trap("primitive", counter++, 4))};`)}`)},
        ${callee_identifier}3)`)};
    return ${trap(
      "return",
      counter++,
      trap("primitive", counter++, 5))};`)}`,
  `${block("script", null, null, [callee_identifier + "0", callee_identifier + "1", callee_identifier + "2", callee_identifier + "3"], `
    (
      ${callee_identifier}0 = () => ${block("arrow", null, callee_identifier + "0", [], `
        return 1;`)},
      ${callee_identifier}0);
    (
      ${callee_identifier}1 = method () ${block("method", null, callee_identifier + "1", [], `
        return 2;`)},
      ${callee_identifier}1);
    (
      ${callee_identifier}2 = constructor () ${block("constructor", null, callee_identifier + "2", [], `
        return 3;`)},
      ${callee_identifier}2);
    (
      ${callee_identifier}3 = function () ${block("function", null, callee_identifier + "3", [], `
        return 4;`)},
      ${callee_identifier}3);
    return 5;`)}`);

// Constant Pointcut //
Lang._match_program(
  Instrument(
    Lang._parse_program(`{
      123;
      return #global;}`),
    {
      __proto__:null,
      source: "script",
      serials: new Map(),
      show,
      pointcut: {
        __proto__: null,
        primitive: true,
        builtin: false},
      namespace: {__proto__:namespace_prototype, counter:0}}),
  Lang._parse_program(`
    ${block("script", null, null, [], `
      ${trap("primitive", "void 0", 123)};
      return #global;`)}`),
  Assert);

"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Instrument = require("./instrument.js");


const names = [
  // Informers //
  "debugger",
  "break",
  // Producers //
  "enter",
  "leave",
  "import",
  "primitive",
  "read",
  "closure",
  "intrinsic",
  // Consumers //
  "completion",
  "enclave_declare",
  "yield",
  "await",
  "export",
  "write",
  "test",
  "return",
  "throw",
  "drop",
  // Combiners //
  "eval",
  "require",
  "enclave_typeof",
  "enclave_read",
  "enclave_write",
  "enclave_super_member",
  "enclave_super_call",
  "unary",
  "binary",
  "object",
  "apply",
  "construct"];

const advice_identifier = "__ADVICE__";
// const callee_identifier = "CALLEE";
// const namespace = {"overwritten-callee":callee_identifier};
// const is_not_namespace_identifier = (identifier) => !identifier.startsWith(callee_identifier);
const cache_label = (identifier) => `CACHE_LABEL_${identifier}`;
const cache_variable = (identifier) => `CACHE_VARIABLE_${identifier}`;
const frame_identifier = "FRAME";
const completion_identifier = "COMPLETION";

const unmangle = {
  __proto__: null,
  label: (identifier) => ({label:identifier}),
  variable: (identifier) => ({variable:identifier})};

const mangle = {
  __proto__: null,
  label: ({label:identifier}) => identifier,
  variable: ({variable:identifier}) => identifier};

const objectify = (object) => `{
  __proto__: null${ArrayLite.join(
    ArrayLite.map(
      global.Reflect.ownKeys(object),
      (key) => `, ${key}: ${global.JSON.stringify(object[key])}`),
    "")}}`;

const instrument = (code, pointcut) => Instrument(
  Lang.parseProgram(code),
  {
    __proto__: null,
    source: "script",
    advice: advice_identifier,
    namespace: {
      frame: "FRAME",
      completion: "COMPLETION",
      instrument_callee: "CALLEE",
      label_cache: "LABEL_CACHE",
      variable_cache: "VARIABLE_CACHE"},
    serialize: (node) => node[0],
    unmangle,
    pointcut});

const instrument_trace = (code, cut, trace) => (
  trace = trace.slice().reverse(),
  instrument(
    code,
    (...args) => (
      Assert.ok(trace.length > 0),
      Assert.deepEqual(args, trace.pop()),
      cut)));

const test = (code1, trace, code2) => (
  Lang.match(
    instrument_trace(code1, true, trace),
    Lang.parseProgram(code2),
    Assert),
  Lang.match(
    instrument(code1, false, trace),
    Lang.parseProgram(code1),
    Assert));

const trap = (name, ...args) => `(
  #Reflect.get(enclave ${advice_identifier}, ${global.JSON.stringify(name)})
  (${ArrayLite.join(ArrayLite.concat([`@ enclave ${advice_identifier}`], args), ", ")}))`;

// const cache_label = (identifier) => `CACHE_LABEL_${identifier}`;
// const cache_variable = (identifier) => `CACHE_VARIABLE_${identifier}`;
const show_link = (link) => `{
  __proto__: null,
  type: ${global.JSON.stringify(link.type)}
  ${"import" in link ? `, import: ${global.JSON.stringify(link.import)}` : ``}
  ${"source" in link ? `, source: ${global.JSON.stringify(link.source)}` : ``}
  ${"export" in link ? `, export: ${global.JSON.stringify(link.export)}` : ``}}`

const block = (callee, callees, completion, sort, frame, statements) => `{
  let ${
    ArrayLite.join(
      ArrayLite.concat(
        ArrayLite.map(ArrayLite.map(frame.labels, mangle.label), cache_label),
        ArrayLite.map(ArrayLite.map(frame.variables, mangle.variable), cache_variable),
        [frame_identifier, completion.car]),
      ", ")};
    ${callee ? `#Reflect.set(input, "callee", ${callee});` : ``}
  ${ArrayLite.join(
    ArrayLite.concat(
      ArrayLite.map(
        frame.labels,
        (object) => `${cache_label(mangle.label(object))} = ${objectify(object)};`),
      ArrayLite.map(
        frame.variables,
        (object) => `${cache_variable(mangle.variable(object))} = ${objectify(object)};`)),
    "\n")}
  ${frame_identifier} = {
    __proto__: null,
    links: #Array.of(${ArrayLite.join(ArrayLite.map(frame.links, show_link), ", ")}),
    labels: #Array.of(${ArrayLite.join(ArrayLite.map(ArrayLite.map(frame.labels, mangle.label), cache_label), ", ")}),
    variables: #Array.of(${ArrayLite.join(ArrayLite.map(ArrayLite.map(frame.variables, mangle.variable), cache_variable), ", ")})};
  input = ${trap("enter", global.JSON.stringify(sort), frame_identifier, "input", `"Block"`)};
  try {
    ${(
      (frame.variables.length > 0 || callees.length > 0) ?
      `let ${ArrayLite.join(ArrayLite.concat(callees, ArrayLite.map(frame.variables, mangle.variable)), ", ")};` :
      ``)}
    ${statements} }
  catch {
    completion ${completion.car} = {
      __proto__: null,
      type: "throw",
      value: #Reflect.get(input, "error")}; }
  finally {
    ${completion.car} = ${trap("leave", global.JSON.stringify(sort), frame_identifier, completion.car, `"Block"`)};
    if (#Reflect.get(${completion.car}, "type") === "throw") {
      completion throw #Reflect.get(${completion.car}, "value"); }
    else {
      completion void 0; }
    ${(
      completion.cdr === null ?
      `
        if (#Reflect.get(${completion.car}, "type") === "return") {
          return #Reflect.get(${completion.car}, "value");
          completion void 0; }
        else {
          completion void 0; }
        completion void 0;` :
      `completion ${completion.cdr} = ${completion.car};`)} }
  ${(
    completion.cdr === null ?
    `completion #Reflect.get(${completion.car}, "value");` :
    `completion void 0;`)} }`;

//////////
// Link //
//////////
{
  const frame1 = {
    __proto__: null,
    links: [
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
    variables: []};
  test(
    `
      import import1 from "source1";
      export export1;
      aggregate import2 from "source2" as export2;
      {
        completion 123; }`,
    [
      ["enter", "script", frame1, null, "Block"],
      ["leave", "script", frame1, null, "Block"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 123, "PrimitiveExpression"]],
    `
      import import1 from "source1";
      export export1;
      aggregate import2 from "source2" as export2;
      ${block(
        null,
        [],
        {
          car: "COMPLETION",
          cdr: null},
        "script",
        frame1,
        `completion COMPLETION = {
          __proto__: null,
          type: "normal",
          value: ${trap(
            "completion",
            trap("primitive", 123, `"PrimitiveExpression"`),
            `"CompletionStatement"`)}};`)}`); }

//////////////////////
// Atomic Statement //
//////////////////////
{
  const frame1 = {__proto__:null, links:[], labels:[], variables:[]};
  const frame2 = {__proto__:null, links:[], labels:[unmangle.label("foo")], variables:[]};
  test(
    `{
      foo: {
        debugger;
        break foo;
        123;
        completion 456; }
      completion 789; }`,
    [
      ["enter", "script", frame1, null, "Block"],
      ["leave", "script", frame1, null, "Block"],
      ["enter", "lone", frame2, null, "Block"],
      ["leave", "lone", frame2, null, "Block"],
      ["debugger", "DebuggerStatement"],
      ["break", unmangle.label("foo"), "BreakStatement"],
      ["primitive", 123, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 456, "PrimitiveExpression"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 789, "PrimitiveExpression"]],
    `
      ${block(null, [], {car:"COMPLETION1", cdr:null}, "script", frame1, `
        foo: ${block(null, [], {car:"COMPLETION2", cdr:"COMPLETION1"}, "lone", frame2, `
          ${trap("debugger", `"DebuggerStatement"`)};
          debugger;
          ${trap("break", cache_label("foo"), `"BreakStatement"`)};
          COMPLETION2 = {
            __proto__: null,
            type: "break",
            target: ${cache_label("foo")}};
          break foo;
          ${trap(
            "drop",
            trap("primitive", "123", `"PrimitiveExpression"`),
            `"ExpressionStatement"`)};
          completion COMPLETION2 = {
            __proto__: null,
            type: "normal",
            value: ${trap(
              "completion",
              trap("primitive", "456", `"PrimitiveExpression"`),
              `"CompletionStatement"`)}};`)}
        completion COMPLETION1 = {
          __proto__: null,
          type: "normal",
          value: ${trap(
            "completion",
            trap("primitive", "789", `"PrimitiveExpression"`),
            `"CompletionStatement"`)}};`)}`); }

////////////////////////
// Compound Statement //
////////////////////////
{
    const frame1 = {
    __proto__: null,
    links: [],
    labels: [],
    variables: [] };
    const frame2 = {
    __proto__: null,
    links: [],
    labels: [
      unmangle.label("k"),
      unmangle.label("l")],
    variables:[]};
    const body = (sort, number) => `k: l: ${block(null, [], {car:"COMPLETION2", cdr:"COMPLETION1"}, sort, frame2, `
      completion COMPLETION2 = {
        __proto__: null,
        type: "normal",
        value: ${trap(
          "completion",
          trap("primitive", global.String(number), `"PrimitiveExpression"`),
          `"CompletionStatement"`)}};`)}`;
    test(
    `{
        k: l: { completion 1; }
        if (2) k: l: { completion 3; } else k: l: { completion 4; }
        while (5) k: l: { completion 6; }
        try k: l: { completion 7; } catch k: l: { completion 8; } finally k: l: { completion 9; }
        completion 10; }`,
    [
      // Begin //
      ["enter", "script", frame1, null, "Block"],
      ["leave", "script", frame1, null, "Block"],
      // Lone //
      ["enter", "lone", frame2, null, "Block"],
      ["leave", "lone", frame2, null, "Block"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 1, "PrimitiveExpression"],
      // If //
      ["test", "if", null, "IfStatement"],
      ["primitive", 2, "PrimitiveExpression"],
      ["enter", "then", frame2, null, "Block"],
      ["leave", "then", frame2, null, "Block"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 3, "PrimitiveExpression"],
      ["enter", "else", frame2, null, "Block"],
      ["leave", "else", frame2, null, "Block"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 4, "PrimitiveExpression"],
      // While //
      ["test", "while", null, "WhileStatement"],
      ["primitive", 5, "PrimitiveExpression"],
      ["enter", "do", frame2, null, "Block"],
      ["leave", "do", frame2, null, "Block"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 6, "PrimitiveExpression"],
      // Try //
      ["enter", "try", frame2, null, "Block"],
      ["leave", "try", frame2, null, "Block"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 7, "PrimitiveExpression"],
      ["enter", "catch", frame2, null, "Block"],
      ["leave", "catch", frame2, null, "Block"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 8, "PrimitiveExpression"],
      ["enter", "finally", frame2, null, "Block"],
      ["leave", "finally", frame2, null, "Block"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 9, "PrimitiveExpression"],
      // End //
      ["completion", null, "CompletionStatement"],
      ["primitive", 10, "PrimitiveExpression"]],
    `
      ${block(null, [], {car:"COMPLETION1", cdr:null}, "script", frame1, `
        ${body("lone", 1)}
        if (${trap("test", `"if"`, trap("primitive", "2", `"PrimitiveExpression"`), `"IfStatement"`)})
        /*then */ ${body("then", 3)}
        else ${body("else", 4)}
        while (${trap("test", `"while"`, trap("primitive", "5", `"PrimitiveExpression"`), `"WhileStatement"`)})
        /* do */ ${body("do", 6)}
        try ${body("try", 7)}
        catch ${body("catch", 8)}
        finally ${body("finally", 9)}
        completion COMPLETION1 = {
          __proto__: null,
          type: "normal",
          value: ${trap(
            "completion",
            trap("primitive", "10", `"PrimitiveExpression"`),
            `"CompletionStatement"`)}};`)}`); }

////////////////
// Expression //
////////////////
{
  const frame = {
    __proto__: null,
    links: [],
    labels: [],
    variables: [unmangle.variable("x")]};
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
      completion 25; }`,
    [
      // Begin //
      ["enter", "script", frame, null, "Block"],
      ["leave", "script", frame, null, "Block"],
      // intrinsic //
      ["intrinsic", "global", null, "IntrinsicExpression"],
      ["drop", null, "ExpressionStatement"],
      // read //
      ["read", unmangle.variable("x"), null, "ReadExpression"],
      ["drop", null, "ExpressionStatement"],
      // throw && write //
      ["throw", null, "ThrowExpression"],
      ["write", unmangle.variable("x"), null, "WriteExpression"],
      ["primitive", 1, "PrimitiveExpression"],
      ["primitive", void 0, "WriteExpression"],
      // eval //
      ["eval", null, null, "EvalExpression"],
      ["primitive", 2, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // sequence && write //
      ["write", unmangle.variable("x"), null, "WriteExpression"],
      ["primitive", 3, "PrimitiveExpression"],
      ["primitive", 4, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // conditional //
      ["test", "conditional", null, "ConditionalExpression"],
      ["primitive", 5, "PrimitiveExpression"],
      ["primitive", 6, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      ["primitive", 7, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // unary //
      ["unary", "!", null, "UnaryExpression"],
      ["primitive", 8, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // binary //
      ["binary", "+", null, null, "BinaryExpression"],
      ["primitive", 9, "PrimitiveExpression"],
      ["primitive", 10, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // construct //
      ["construct", null, [null, null], "ConstructExpression"],
      ["primitive", 11, "PrimitiveExpression"],
      ["primitive", 12, "PrimitiveExpression"],
      ["primitive", 13, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // apply //
      ["apply", null, null, [null, null], "ApplyExpression"],
      ["primitive", 14, "PrimitiveExpression"],
      ["primitive", 15, "PrimitiveExpression"],
      ["primitive", 16, "PrimitiveExpression"],
      ["primitive", 17, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // object //
      ["object", null, [[null, null], [null, null]], "ObjectExpression"],
      ["primitive", 18, "PrimitiveExpression"],
      ["primitive", 19, "PrimitiveExpression"],
      ["primitive", 20, "PrimitiveExpression"],
      ["primitive", 21, "PrimitiveExpression"],
      ["primitive", 22, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // require //
      ["require", null, null, "RequireExpression"],
      ["primitive", 23, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // import //
      ["import", "specifier1", "source", null, "ImportExpression"],
      ["drop", null, "ExpressionStatement"],
      // export //
      ["export", "specifier2", null, "ExportExpression"],
      ["primitive", 24, "PrimitiveExpression"],
      // completion //
      ["completion", null, "CompletionStatement"],
      ["primitive", 25, "PrimitiveExpression"]],
    `${block(null, [], {car:"COMPLETION1", cdr:null}, "script", frame, `
      ${trap(
        "drop",
        trap("intrinsic", `"global"`, "#global", `"IntrinsicExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap("read", cache_variable("x"), "x", `"ReadExpression"`),
        `"ExpressionStatement"`)};
      throw ${trap(
        "throw",
        trap(
          "primitive",
          `x = ${trap(
            "write",
            cache_variable("x"),
            trap("primitive", "1", `"PrimitiveExpression"`),
            `"WriteExpression"`)}`,
          `"WriteExpression"`),
        `"ThrowExpression"`)};
      ${trap(
        "drop",
        trap(
          "eval",
          trap("primitive", "2", `"PrimitiveExpression"`),
          `arrow () { completion eval #Reflect.get(#Reflect.get(input, "arguments"), 0); }`,
          `"EvalExpression"`),
        `"ExpressionStatement"`)};
      (
        x = ${
          trap(
            "write",
            cache_variable("x"),
            trap("primitive", "3", `"PrimitiveExpression"`),
            `"WriteExpression"`)},
        ${trap(
          "drop",
          trap("primitive", "4", `"PrimitiveExpression"`),
          `"ExpressionStatement"`)});
      (
        ${trap(
          "test",
          `"conditional"`,
          trap("primitive", "5", `"PrimitiveExpression"`),
          `"ConditionalExpression"`)} ?
        ${trap(
          "drop",
          trap("primitive", "6", `"PrimitiveExpression"`),
          `"ExpressionStatement"`)} :
        ${trap(
          "drop",
          trap("primitive", "7", `"PrimitiveExpression"`),
          `"ExpressionStatement"`)});
      ${trap(
        "drop",
        trap(
          "unary",
          `"!"`,
          trap("primitive", "8", `"PrimitiveExpression"`),
          `"UnaryExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap(
          "binary",
          `"+"`,
          trap("primitive", "9", `"PrimitiveExpression"`),
          trap("primitive", "10", `"PrimitiveExpression"`),
          `"BinaryExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap(
          "construct",
          trap("primitive", "11", `"PrimitiveExpression"`),
          `#Array.of(
            ${trap("primitive", "12", `"PrimitiveExpression"`)},
            ${trap("primitive", "13", `"PrimitiveExpression"`)})`,
          `"ConstructExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap("apply",
          trap("primitive", "14", `"PrimitiveExpression"`),
          trap("primitive", "15", `"PrimitiveExpression"`),
          `#Array.of(
            ${trap("primitive", "16", `"PrimitiveExpression"`)},
            ${trap("primitive", "17", `"PrimitiveExpression"`)})`,
          `"ApplyExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap("object",
          trap("primitive", "18", `"PrimitiveExpression"`),
          `#Array.of(
            #Array.of(
              ${trap("primitive", "19", `"PrimitiveExpression"`)},
              ${trap("primitive", "20", `"PrimitiveExpression"`)}),
            #Array.of(
              ${trap("primitive", "21", `"PrimitiveExpression"`)},
              ${trap("primitive", "22", `"PrimitiveExpression"`)}))`,
          `"ObjectExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap(
          "require",
          trap("primitive", "23", `"PrimitiveExpression"`),
          `arrow () { completion require #Reflect.get(#Reflect.get(input, "arguments"), 0); }`,
          `"RequireExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap(
          "import",
          `"specifier1"`,
          `"source"`,
          `import specifier1 from "source"`,
          `"ImportExpression"`),
        `"ExpressionStatement"`)};
      export specifier2 ${trap(
        "export",
        `"specifier2"`,
        trap("primitive", "24", `"PrimitiveExpression"`),
        `"ExportExpression"`)};
      completion COMPLETION1 = {
        __proto__: null,
        type: "normal",
        value: ${trap(
          "completion",
          trap("primitive", "25", `"PrimitiveExpression"`),
          `"CompletionStatement"`)}};`)}`); }

/////////////
// Closure //
/////////////
{
  const frame1 = {
    __proto__: null,
    links: [],
    labels: [],
    variables: [unmangle.variable("x")]};
  const frame2 = {
    __proto__: null,
    links: [],
    labels: [],
    variables: []};
  test(
    `{
      let x;
      async function* () {
        x;
        yield* 1;
        await 2;
        return 3;
        completion 4; };
      completion 5; }`,
    [
      ["enter", "script", frame1, null, "Block"],
      ["leave", "script", frame1, null, "Block"],
      ["closure", "function", true, true, null, "ClosureExpression"],
      ["enter", "function", frame2, null, "Block"],
      ["leave", "function", frame2, null, "Block"],
      // distant read //
      ["read", unmangle.variable("x"), null, "ReadExpression"],
      ["drop", null, "ExpressionStatement"],
      // yield //
      ["yield", true, null, "YieldExpression"],
      ["primitive", 1, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // await //
      ["await", null, "AwaitExpression"],
      ["primitive", 2, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // return //
      ["return", null, "ReturnStatement"],
      ["primitive", 3, "PrimitiveExpression"],
      // completion //
      ["completion", null, "CompletionStatement"],
      ["primitive", 4, "PrimitiveExpression"],
      // completion //
      ["drop", null, "ExpressionStatement"],
      ["completion", null, "CompletionStatement"],
      ["primitive", 5, "PrimitiveExpression"]],
    `${block(null, ["CALLEE"], {car:"COMPLETION1", cdr:null}, "script", frame1, `
      ${trap(
        "drop",
        `(
          CALLEE = ${trap(
            "closure",
            `"function"`,
            "true",
            "true",
            `async function * () ${block("CALLEE", [], {car:"COMPLETION2", cdr:null}, "function", frame2, `
              ${trap(
                "drop",
                trap(
                  "read",
                  cache_variable("x"),
                  "x",
                  `"ReadExpression"`),
                `"ExpressionStatement"`)};
              ${trap(
                "drop",
                `yield * ${trap(
                  "yield",
                  "true",
                  trap("primitive", "1", `"PrimitiveExpression"`),
                  `"YieldExpression"`)}`,
                `"ExpressionStatement"`)};
              ${trap(
                "drop",
                `await ${trap(
                  "await",
                  trap("primitive", "2", `"PrimitiveExpression"`),
                  `"AwaitExpression"`)}`,
                `"ExpressionStatement"`)};
              return COMPLETION2 = {
                __proto__: null,
                type: "return",
                value: ${trap(
                  "return",
                  trap("primitive", "3", `"PrimitiveExpression"`),
                  `"ReturnStatement"`)}};
              completion COMPLETION2 = {
                __proto__: null,
                type: "normal",
                value: ${trap(
                  "completion",
                  trap("primitive", "4", `"PrimitiveExpression"`),
                  `"CompletionStatement"`)}};`)}`,
            `"ClosureExpression"`)},
          CALLEE)`,
        `"ExpressionStatement"`)};
      completion COMPLETION1 = {
        __proto__: null,
        type: "normal",
        value: ${trap(
        "completion",
        trap("primitive", "5", `"PrimitiveExpression"`),
        `"CompletionStatement"`)}};`)}`); }

/////////////
// Enclave //
/////////////
{
  const frame = {
    __proto__: null,
    links: [],
    labels: [],
    variables: [] };
  test(
    `{
      enclave x;
      enclave typeof y;
      enclave z ?= 1;
      enclave t != 2;
      enclave super(...3);
      enclave super[4];
      enclave let x = 5;
      completion 6; }`,
    [
      ["enter", "script", frame, null, "Block"],
      ["leave", "script", frame, null, "Block"],
      // enclave-read //
      ["enclave_read", "x", null, "ReadEnclaveExpression"],
      ["drop", null, "ExpressionStatement"],
      // enclave-typeof //
      ["enclave_typeof", "y", null, "TypeofEnclaveExpression"],
      ["drop", null, "ExpressionStatement"],
      // enclave-write-normal //
      ["enclave_write", false, "z", null, null, "WriteEnclaveExpression"],
      ["primitive", 1, "PrimitiveExpression"],
      // enclave-write-strict //
      ["enclave_write", true, "t", null, null, "WriteEnclaveExpression"],
      ["primitive", 2, "PrimitiveExpression"],
      // enclave-super-call //
      ["enclave_super_call", null, null, "CallSuperEnclaveExpression"],
      ["primitive", 3, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // enclave-super-call //
      ["enclave_super_member", null, null, "MemberSuperEnclaveExpression"],
      ["primitive", 4, "PrimitiveExpression"],
      ["drop", null, "ExpressionStatement"],
      // enclave-declare //
      ["enclave_declare", "let", "x", null, "DeclareEnclaveStatement"],
      ["primitive", 5, "PrimitiveExpression"],
      // return //
      ["completion", null, "CompletionStatement"],
      ["primitive", 6, "PrimitiveExpression"]],
    `${block(null, [], {car:"COMPLETION", cdr:null}, "script", frame, `
      ${trap(
        "drop",
        trap(
          "enclave_read",
          `"x"`,
          `arrow () { completion enclave x; }`,
          `"ReadEnclaveExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap(
          "enclave_typeof",
          `"y"`,
          `arrow () { completion enclave typeof y; }`,
          `"TypeofEnclaveExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "enclave_write",
        false,
        `"z"`,
        trap("primitive", "1", `"PrimitiveExpression"`),
        `arrow () { completion enclave z ?= #Reflect.get(#Reflect.get(input, "arguments"), 0); }`,
        `"WriteEnclaveExpression"`)};
      ${trap(
        "enclave_write",
        true,
        `"t"`,
        trap("primitive", "2", `"PrimitiveExpression"`),
        `arrow () { completion enclave t != #Reflect.get(#Reflect.get(input, "arguments"), 0); }`,
        `"WriteEnclaveExpression"`)};
      ${trap(
        "drop",
        trap(
          "enclave_super_call",
          trap("primitive", "3", `"PrimitiveExpression"`),
          `arrow () { completion enclave super(...#Reflect.get(#Reflect.get(input, "arguments"), 0)); }`,
          `"CallSuperEnclaveExpression"`),
        `"ExpressionStatement"`)};
      ${trap(
        "drop",
        trap(
          "enclave_super_member",
          trap("primitive", "4", `"PrimitiveExpression"`),
          `arrow () { completion enclave super[#Reflect.get(#Reflect.get(input, "arguments"), 0)]; }`,
          `"MemberSuperEnclaveExpression"`),
        `"ExpressionStatement"`)};
      enclave let x = ${trap(
        "enclave_declare",
        `"let"`,
        `"x"`,
        trap("primitive", "5", `"PrimitiveExpression"`),
        `"DeclareEnclaveStatement"`)};
      completion COMPLETION = {
        __proto__: null,
        type: "normal",
        value: ${trap(
          "completion",
          trap("primitive", "6", `"PrimitiveExpression"`),
          `"CompletionStatement"`)}};`)}`); }

////////////////////
// Empty Pointcut //
////////////////////
ArrayLite.forEach(
  [
    false,
    0,
    null,
    [],
    {__proto__:null},
    global.Object.setPrototypeOf(
      global.Object.fromEntries(
        ArrayLite.map(
          names,
          (name) => [name, false])),
      null),
    global.Object.setPrototypeOf(
      global.Object.fromEntries(
        ArrayLite.map(
          names,
          (name) => [name, () => false])),
      null),
    new global.Set(),
    new global.Map(),
    new global.Map(
      ArrayLite.map(
        names,
        (name) => [name, false])),
    new Map(
      ArrayLite.map(
        names,
        (name) => [name, () => false]))],
  (pointcut) => Lang.match(
    instrument(`{ completion 123; }`, pointcut),
    Lang.parseProgram(`{ completion 123; }`),
    Assert));

///////////////////
// Full Pointcut //
///////////////////
ArrayLite.forEach(
  [
    true,
    1,
    names,
    new global.Set(names),
    global.Object.setPrototypeOf(
      global.Object.fromEntries(
        ArrayLite.map(
          names,
          (name) => [name, true]),
        null),
      null),
    global.Object.setPrototypeOf(
      global.Object.fromEntries(
        ArrayLite.map(
          names,
          (name) => [name, () => true])),
      null),
    new Map(
      ArrayLite.map(
        names,
        (name) => [name, true])),
    new Map(
      ArrayLite.map(
        names,
        (name) => [name, () => true]))],
  (pointcut) => Lang.match(
    instrument(`{ completion 123; }`, pointcut),
    Lang.parseProgram(
      block(null, [], {car:"COMPLETION", cdr:null}, "script", {__proto__: null, links: [], labels: [], variables: []}, `
        completion COMPLETION = {
          __proto__: null,
          type: "normal",
          value: ${trap(
            "completion",
            trap("primitive", "123", `"PrimitiveExpression"`),
            `"CompletionStatement"`)}};`)),
    Assert));

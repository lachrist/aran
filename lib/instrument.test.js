"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Instrument = require("./instrument.js");

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

// const remangle = {
//   __proto__: null,
//   label: ({label:identifier}) => `${cache_label(identifier)} = {__proto__:null, label:${global.JSON.stringify(identifier)}};`,
//   variable: ({variable:identifier}) => `${cache_variable(identifier)} = {__proto__:null, variable:${global.JSON.stringify(identifier)}};`};

const make_pointcut = (trace, cut, infos) => ArrayLite.reduce(
  [
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
    "construct"],
  (pointcut, name) => (
    pointcut[name] = function (...args) {
      console.log("yo", name, ...args);
      Assert.equal(this, pointcut);
      const actual = [name].concat(args);
      Assert.ok(trace.length > 0);
      const expected = trace.pop();
      Assert.deepEqual(actual, expected);
      return cut;},
    pointcut),
  {__proto__:null});

const instrument = (cut, trace, code) => {
  trace = trace.slice().reverse();
  const infos = [];
  const program1 = Lang.parseProgram(code);
  const pointcut = make_pointcut(trace, cut, infos);
  const program2 = Instrument(program1, {
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
    pointcut
  });
  return program2;};

const test = (code1, trace, code2) => (
  Lang.match(
    instrument(true, trace, code1),
    Lang.parseProgram(code2),
    Assert),
  Lang.match(
    instrument(false, trace, code1),
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

const block = (callee, completion, sort, frame, statements) => `{
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
        (object) => (console.log("wesh", objectify(object)), `${cache_label(mangle.label(object))} = ${objectify(object)};`)),
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
      frame.variables.length > 0 ?
      `let ${ArrayLite.join(ArrayLite.map(frame.variables, mangle.variable), ", ")};` :
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

let frame1 = null;
let frame2 = null;
let frame3 = null;

// Link //
frame1 = {
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
          `"CompletionStatement"`)}};`)}`);

// Atomic Statement //
frame1 = {__proto__:null, links:[], labels:[], variables:[]};
frame2 = {__proto__:null, links:[], labels:[unmangle.label("foo")], variables:[]};
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
  `${block(
    null,
    {
      car: "COMPLETION1",
      cdr: null},
    "script",
    frame1,
    `
      foo: ${block(
        null,
        {
          car: "COMPLETION2",
          cdr: "COMPLETION1"},
        "lone",
        frame2,
        `
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
          `"CompletionStatement"`)}};`)}`);

// Compound Statement //
// counter = 0;
test(
  `{
      k1: l1: { 1; }
      if (2) k2: l2: { 3; } else k2: l2: { 4; }
      while (5) k3: l3: { 6; }
      try k4: l4: { 7; } catch k4: l4: { 8; } finally k4: l4: { 9; }
      return 10; }`,
  [
    // Begin //
    [
      "enter",
      "script",
      {__proto__:null, links:[], labels:[], variables:[]},
      {__proto__:null},
      "Block1"],
    // Lone //
    [
      "enter",
      "lone",
      {__proto__:null, links:[], labels:[unmangle1.label("k1"), unmangle1.label("l1")], variables:[]},
      {__proto__:null},
      "Block2"],
    ["primitive", 1, "primitive1"],
    ["drop", null, "ExpressionStatement1"],
    ["completion", "lone", "Block2"],
    ["failure", "lone", null, "Block2"],
    ["leave", "lone", "Block2"],
    // If //
    ["primitive", 2, "primitive2"],
    ["test", null, "If1"],
    [
      "enter",
      "then",
      {__proto__:null, links:[], labels:[unmangle1.label("k2"), unmangle1.label("l2")], variables:[]},
      {__proto__:null},
      "Block3"],
    ["primitive", 3, "primitive3"],
    ["drop", null, "ExpressionStatement2"],
    ["completion", "then", "Block3"],
    ["failure", "then", null, "Block3"],
    ["leave", "then", "Block3"],
    [
      "enter",
      "else",
      {__proto__:null, links:[], labels:[unmangle1.label("k2"), unmangle1.label("l2")], variables:[]},
      {__proto__:null},
      "Block4"],
    ["primitive", 4, "primitive4"],
    ["drop", null, "ExpressionStatement3"],
    ["completion", "else", "Block4"],
    ["failure", "else", null, "Block4"],
    ["leave", "else", "Block4"],
    // While //
    ["primitive", 5, "primitive5"],
    ["test", null, "While1"],
    [
      "enter",
      "do",
      {__proto__:null, links:[], labels:[unmangle1.label("k3"), unmangle1.label("l3")], variables:[]},
      {__proto__:null},
      "Block5"],
    ["primitive", 6, "primitive6"],
    ["drop", null, "ExpressionStatement4"],
    ["completion", "do", "Block5"],
    ["failure", "do", null, "Block5"],
    ["leave", "do", "Block5"],
    // Try //
    [
      "enter",
      "try",
      {__proto__:null, links:[], labels:[unmangle1.label("k4"), unmangle1.label("l4")], variables:[]},
      {__proto__:null},
      "Block6"],
    ["primitive", 7, "primitive7"],
    ["drop", null, "ExpressionStatement5"],
    ["completion", "try", "Block6"],
    ["failure", "try", null, "Block6"],
    ["leave", "try", "Block6"],
    [
      "enter",
      "catch",
      {__proto__:null, links:[], labels:[unmangle1.label("k4"), unmangle1.label("l4")], variables:[]},
      {__proto__:null, "error":null},
      "Block7"],
    ["primitive", 8, "primitive8"],
    ["drop", null, "ExpressionStatement6"],
    ["completion", "catch", "Block7"],
    ["failure", "catch", null, "Block7"],
    ["leave", "catch", "Block7"],
    [
      "enter",
      "finally",
      {__proto__:null, links:[], labels:[unmangle1.label("k4"), unmangle1.label("l4")], variables:[]},
      {__proto__:null},
      "Block8"],
    ["primitive", 9, "primitive9"],
    ["drop", null, "ExpressionStatement7"],
    ["completion", "finally", "Block8"],
    ["failure", "finally", null, "Block8"],
    ["leave", "finally", "Block8"],
    // Return //
    ["primitive", 10, "primitive10"],
    ["return", null, "Return1"],
    // End //
    ["completion", "script", "Block1"],
    ["failure", "script", null, "Block1"],
    ["leave", "script", "Block1"]],
  `${block(null, "script", {links:[], labels:[], variables:[]}, (counter++, counter++), `
    ${block(null, "lone", {links:[], labels:["k1", "l1"], variables:[]}, (counter++, counter++), `
      ${trap("drop", counter++, trap("primitive", counter++, "1"))};`)}
    if (${trap("test", counter++, trap("primitive", counter++, "2"))})
      ${block(null, "then", {links:[], labels:["k2", "l2"], variables:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "3"))};`)}
      else ${block(null, "else", {links:[], labels:["k2", "l2"], variables:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "4"))};`)}
    while (${trap("test", counter++, trap("primitive", counter++, "5"))})
      ${block(null, "do", {links:[], labels:["k3", "l3"], variables:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "6"))};`)}
    try
      ${block(null, "try", {links:[], labels:["k4", "l4"], variables:[]}, (counter++, counter++), `
        ${trap("drop", counter++, trap("primitive", counter++, "7"))};`)}
      catch ${block(null, "catch", {links:[], labels:["k4", "l4"], variables:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "8"))};`)}
      finally ${block(null, "finally", {links:[], labels:["k4", "l4"], variables:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "9"))};`)}
    return ${trap("return", counter++, trap("primitive", counter++, "10"))};`)}`);

// Expression //
// counter = 0;
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
    await 25;
    yield * 26;
    return 27; }`,
  [
    // Begin //
    [
      "enter",
      "script",
      {__proto__:null, links:[], labels:[], variables:[unmangle1.identifier("x")]},
      {__proto__:null},
      "Block1"],
    // intrinsic //
    ["intrinsic", "global", null, "intrinsic1"],
    ["drop", null, "ExpressionStatement1"],
    // read //
    ["read", unmangle1.identifier("x"), null, "read1"],
    ["drop", null, "ExpressionStatement2"],
    // throw && write //
    ["primitive", 1, "primitive1"],
    ["write", unmangle1.identifier("x"), null, "write1"],
    ["primitive", void 0, "write1"],
    ["throw", null, "throw1"],
    // eval //
    ["primitive", 2, "primitive2"],
    ["eval", null, null, "eval1"],
    ["drop", null, "ExpressionStatement4"],
    // sequence && write //
    ["primitive", 3, "primitive3"],
    ["write", unmangle1.identifier("x"), null, "write2"],
    ["primitive", 4, "primitive4"],
    ["drop", null, "ExpressionStatement5"],
    // conditional //
    ["primitive", 5, "primitive5"],
    ["test", null, "conditional1"],
    ["primitive", 6, "primitive6"],
    ["drop", null, "ExpressionStatement6"],
    ["primitive", 7, "primitive7"],
    ["drop", null, "ExpressionStatement6"],
    // unary //
    ["primitive", 8, "primitive8"],
    ["unary", "!", null, "unary1"],
    ["drop", null, "ExpressionStatement7"],
    // binary //
    ["primitive", 9, "primitive9"],
    ["primitive", 10, "primitive10"],
    ["binary", "+", null, null, "binary1"],
    ["drop", null, "ExpressionStatement8"],
    // construct //
    ["primitive", 11, "primitive11"],
    ["primitive", 12, "primitive12"],
    ["primitive", 13, "primitive13"],
    ["construct", null, [null, null], "construct1"],
    ["drop", null, "ExpressionStatement9"],
    // apply //
    ["primitive", 14, "primitive14"],
    ["primitive", 15, "primitive15"],
    ["primitive", 16, "primitive16"],
    ["primitive", 17, "primitive17"],
    ["apply", null, null, [null, null], "apply1"],
    ["drop", null, "ExpressionStatement10"],
    // object //
    ["primitive", 18, "primitive18"],
    ["primitive", 19, "primitive19"],
    ["primitive", 20, "primitive20"],
    ["primitive", 21, "primitive21"],
    ["primitive", 22, "primitive22"],
    ["object", null, [[null, null], [null, null]], "object1"],
    ["drop", null, "ExpressionStatement11"],
    // require //
    ["primitive", 23, "primitive23"],
    // ["source", null, "require1"],
    ["require", null, null, "require1"],
    ["drop", null, "ExpressionStatement12"],
    // import //
    ["import", "specifier1", "source", null, "import1"],
    ["drop", null, "ExpressionStatement13"],
    // export //
    ["primitive", 24, "primitive24"],
    ["export", "specifier2", null, "export1"],
    // await //
    ["primitive", 25, "primitive25"],
    ["await", null, "await1"],
    ["drop", null, "ExpressionStatement15"],
    // yield //
    ["primitive", 26, "primitive26"],
    ["yield", true, null, "yield1"],
    ["drop", null, "ExpressionStatement16"],
    // return //
    ["primitive", 27, "primitive27"],
    ["return", null, "Return1"],
    // End //
    ["completion", "script", "Block1"],
    ["failure", "script", null, "Block1"],
    ["leave", "script", "Block1"]],
  `${block(null, "script", {links:[], labels:[], variables:["x"]}, (counter++, counter++), `
    ${trap(
      "drop",
      counter++,
      trap("intrinsic", counter++, JSON.stringify("global"), "#global"))};
    ${trap(
      "drop",
      counter++,
      trap("read", counter++, unmangle2.identifier("x"), "x"))};
    throw ${trap(
      "throw",
      (counter++, counter++),
      trap(
        "primitive",
        counter++,
        `x = ${trap(
          "write",
          counter - 1,
          unmangle2.identifier("x"),
          trap("primitive", counter++, 1))}`))};
    ${trap(
      "drop",
      counter++,
      trap(
        "eval",
        counter++,
        trap("primitive", counter++, 2),
        `arrow () { return eval #Reflect.get(#Reflect.get(input, "arguments"), 0); }`))};
    (
      x = ${trap("write", (counter++, counter++, counter++), unmangle2.identifier("x"),
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
        trap("primitive", counter++, 23),
        `arrow () { return require #Reflect.get(#Reflect.get(input, "arguments"), 0); }`))};
    ${trap(
      "drop",
      counter++,
      trap("import", counter++, JSON.stringify("specifier1"), JSON.stringify("source"), `import specifier1 from "source"`))};
    export specifier2 ${trap(
        "export",
        (counter++, counter++),
        JSON.stringify("specifier2"),
        trap("primitive", counter++, 24))};
    ${trap(
      "drop",
      counter++,
      `await ${trap(
        "await",
        counter++,
        trap("primitive", counter++, 25))}`)};
    ${trap(
      "drop",
      counter++,
      `yield * ${trap(
        "yield",
        counter++,
        "true",
        trap("primitive", counter++, 26))}`)};
    return ${trap(
      "return",
      counter++,
      trap("primitive", counter++, 27))};`)}`);

// Enclave //
// counter = 0;
test(
  `{
    enclave x;
    enclave typeof y;
    enclave z ?= 1;
    enclave t != 2;
    enclave super(...3);
    enclave super[4];
    enclave let x = 5;
    return 6; }`,
  [
    [
      "enter",
      "script",
      {__proto__:null, links:[], labels:[], variables:[]},
      {__proto__:null},
      "Block1"],
    // enclave-read //
    ["enclave_read", "x", null, "enclave_read1"],
    ["drop", null, "ExpressionStatement1"],
    // enclave-typeof //
    ["enclave_typeof", "y", null, "enclave_typeof1"],
    ["drop", null, "ExpressionStatement2"],
    // enclave-write-normal //
    ["primitive", 1, "primitive1"],
    ["enclave_write", false, "z", null, null, "enclave_write1"],
    // enclave-write-strict //
    ["primitive", 2, "primitive2"],
    ["enclave_write", true, "t", null, null, "enclave_write2"],
    // enclave-super-call //
    ["primitive", 3, "primitive3"],
    ["enclave_super_call", null, null, "enclave_super_call1"],
    ["drop", null, "ExpressionStatement5"],
    // enclave-super-call //
    ["primitive", 4, "primitive4"],
    ["enclave_super_member", null, null, "enclave_super_member1"],
    ["drop", null, "ExpressionStatement6"],
    // enclave-declare //
    ["primitive", 5, "primitive5"],
    ["enclave_declare", "let", "x", null, "EnclaveDeclare1"],
    // return //
    ["primitive", 6, "primitive6"],
    ["return", null, "Return1"],
    ["completion", "script", "Block1"],
    ["failure", "script", null, "Block1"],
    ["leave", "script", "Block1"]],
  `${block(null, "script", {links:[], labels:[], variables:[]}, (counter++, counter++), `
    ${trap(
      "drop",
      counter++,
      trap(
        "enclave_read",
        counter++,
        `"x"`,
        `arrow () { return enclave x; }`))};
    ${trap(
      "drop",
      counter++,
      trap(
        "enclave_typeof",
        counter++,
        `"y"`,
        `arrow () { return enclave typeof y; }`))};
    ${trap(
      "enclave_write",
      (counter++, counter++),
      false,
      `"z"`,
      trap("primitive", counter++, 1),
      `arrow () { return enclave z ?= #Reflect.get(#Reflect.get(input, "arguments"), 0); }`)};
    ${trap(
      "enclave_write",
      (counter++, counter++),
      true,
      `"t"`,
      trap("primitive", counter++, 2),
      `arrow () { return enclave t != #Reflect.get(#Reflect.get(input, "arguments"), 0); }`)};
    ${trap(
      "drop",
      counter++,
      trap(
        "enclave_super_call",
        counter++,
        trap("primitive", counter++, 3),
        `arrow () { return enclave super(...#Reflect.get(#Reflect.get(input, "arguments"), 0)); }`))};
    ${trap(
      "drop",
      counter++,
      trap(
        "enclave_super_member",
        counter++,
        trap("primitive", counter++, 4),
        `arrow () { return enclave super[#Reflect.get(#Reflect.get(input, "arguments"), 0)]; }`))};
    enclave let x = ${trap(
      "enclave_declare",
      counter++,
      `"let"`,
      `"x"`,
      trap("primitive", counter++, 5))};
    return ${trap(
      "return",
      counter++,
      trap("primitive", counter++, 6))};`)}`);

// Closure && Eval //
// counter = 0;
test(
  `{
    arrow () {
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
      {__proto__:null, links:[], labels:[], variables:[]},
      {__proto__:null},
      "Block1"],
    // arrow //
    [
      "enter",
      "arrow",
      {__proto__:null, links:[], labels:[], variables:[]},
      {__proto__:null, "callee": null, "arguments": null},
      "Block2"],
    ["primitive", 1, "primitive1"],
    ["return", null, "Return1"],
    ["completion", "arrow", "Block2"],
    ["failure", "arrow", null, "Block2"],
    ["leave", "arrow", "Block2"],
    ["closure", "arrow", false, false, null, "closure1"],
    ["drop", null, "ExpressionStatement1"],
    // method //
    [
      "enter",
      "method",
      {__proto__:null, links:[], labels:[], variables:[]},
      {__proto__:null, "callee": null, "arguments": null, "this":null},
      "Block3"],
    ["primitive", 2, "primitive2"],
    ["return", null, "Return2"],
    ["completion", "method", "Block3"],
    ["failure", "method", null, "Block3"],
    ["leave", "method", "Block3"],
    ["closure", "method", false, false, null, "closure2"],
    ["drop", null, "ExpressionStatement2"],
    // constructor //
    [
      "enter",
      "constructor",
      {__proto__:null, links:[], labels:[], variables:[]},
      {__proto__:null, "callee": null, "arguments": null, "new.target":null},
      "Block4"],
    ["primitive", 3, "primitive3"],
    ["return", null, "Return3"],
    ["completion", "constructor", "Block4"],
    ["failure", "constructor", null, "Block4"],
    ["leave", "constructor", "Block4"],
    ["closure", "constructor", false, false, null, "closure3"],
    ["drop", null, "ExpressionStatement3"],
    // function //
    [
      "enter",
      "function",
      {__proto__:null, links:[], labels:[], variables:[]},
      {__proto__:null, "callee": null, "arguments": null, "this":null, "new.target":null},
      "Block5"],
    ["primitive", 4, "primitive4"],
    ["return", null, "Return4"],
    ["completion", "function", "Block5"],
    ["failure", "function", null, "Block5"],
    ["leave", "function", "Block5"],
    ["closure", "function", false, false, null, "closure4"],
    ["drop", null, "ExpressionStatement4"],
    // Return //
    ["primitive", 5, "primitive5"],
    ["return", null, "Return5"],
    // End //
    ["completion", "script", "Block1"],
    ["failure", "script", null, "Block1"],
    ["leave", "script", "Block1"]],
  `${block(
    null,
    "script",
    {
      links: [],
      labels: [],
      variables: [callee_identifier + "0", callee_identifier + "1", callee_identifier + "2", callee_identifier + "3"]},
    (counter++, counter++),
    `${trap(
      "drop",
      counter++,
      `(
        ${callee_identifier}0 = ${trap(
          "closure",
          counter++,
          `"arrow"`,
          "false",
          "false",
          `arrow () ${block(
            callee_identifier + "0",
            "arrow",
            {links:[], labels:[], variables:[]},
            counter++,
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
          `"method"`,
          "false",
          "false",
          `method () ${block(
            callee_identifier + "1",
            "method",
            {links:[], labels:[], variables:[]},
            counter++,
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
          `"constructor"`,
          "false",
          "false",
          `constructor () ${block(
            callee_identifier + "2",
            "constructor",
            {links:[], labels:[], variables:[]},
            counter++,
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
          `"function"`,
          "false",
          "false",
          `function () ${block(
            callee_identifier + "3",
            "function",
            {links:[], labels:[], variables:[]},
            counter++,
            `return ${trap(
              "return",
              counter++,
              trap("primitive", counter++, 4))};`)}`)},
        ${callee_identifier}3)`)};
    return ${trap(
      "return",
      counter++,
      trap("primitive", counter++, 5))};`)}`);

// Empty Pointcut //
ArrayLite.forEach(
  [false, null, [], {__proto__:null}],
  (pointcut) => Lang.match(
    Instrument(
      Lang.parseProgram(`{ 123; }`),
      {
        __proto__: null,
        source: "script",
        serials: new Map(),
        unmangle: unmangle1,
        pointcut,
        namespace}),
    Lang.parseProgram(`{ 123; }`),
    Assert));

// Full Pointcut //
Lang.match(
  Instrument(
    Lang.parseProgram(`{ 123; }`),
    {
      __proto__:null,
      source: "script",
      serials: new Map(),
      unmangle: unmangle1,
      pointcut: true,
      namespace}),
  Lang.parseProgram(
    block(
      null,
      "script",
      {
        links: [],
        labels: [],
        variables: []},
      "void 0",
      `${trap(
        "drop",
        "void 0",
        trap("primitive", "void 0", 123))};`)),
  Assert);

// Array Pointcut //
Lang.match(
  Instrument(
    Lang.parseProgram(`{ 123; }`),
    {
      __proto__: null,
      source: "script",
      serials: new Map(),
      unmangle: unmangle1,
      pointcut: ["primitive"],
      namespace}),
  Lang.parseProgram(`{ ${trap("primitive", "void 0", 123)}; }`),
  Assert);

// Closure Pointcut //
{
  const trace = [];
  Lang.match(
    Instrument(
      Lang.parseProgram(`{ 123; }`),
      {
        __proto__:null,
        source: "script",
        serials: new Map(),
        unmangle: unmangle1,
        pointcut: function (...args) { return (
          Assert.deepEqual(this, void 0),
          trace[trace.length] = args,
          false); },
        namespace}),
    Lang.parseProgram(`{ 123; }`),
    Assert);
  Assert.deepEqual(
    trace,
    [
      [
        "enter",
        "script",
        {
          __proto__: null,
          links: [],
          labels: [],
          variables: []},
        {__proto__:null},
        void 0],
      ["primitive", 123, void 0],
      ["drop", null, void 0],
      ["completion", "script", void 0],
      ["failure", "script", null, void 0],
      ["leave", "script", void 0]]); }

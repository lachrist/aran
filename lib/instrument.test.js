"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");
const Lang = require("./lang");
const Instrument = require("./instrument.js");

const callee_identifier = "CALLEE";
const namespace = {"overwritten-callee":callee_identifier};
const is_not_namespace_identifier = (identifier) => !identifier.startsWith(callee_identifier);

const unmangle1 = {
  __proto__: null,
  identifier: (identifier) => ({identifier}),
  label: (label) => ({label})};

const unmangle2 = {
  __proto__: null,
  identifier: (identifier) => `{__proto__:null, identifier:${global.JSON.stringify(identifier)}}`,
  label: (label) => `{__proto__:null, label:${global.JSON.stringify(label)}}`};

const callbacks = {
  __proto__: null,
  // Program //
  Program: (links, block) => ArrayLite.concat(links, [block]),
  // Link //
  ImportLink: (specifier, source) => [],
  ExportLink: (specifier) => [],
  AggregateLink: (specifier, specifier, source) => [],
  // Branch //
  Branch: (labels, block) => [block],
  // Block //
  Block: (identifiers, statement) => [statement],
  // Statement //
  EnclaveDeclare: (kind, identifier, expression) => [expression],
  ExpressionStatement: (expression) => [expression],
  ReturnStatement: (expression) => [expression],
  BreakStatement: (identifier) => [],
  DebuggerStatement: () => [],
  ListStatement: (statements) => statements,
  BranchStatement: (branch) => [branch],
  IfStatement: (expression, branch1, branch2) => [expression, branch1, branch2],
  WhileStatement: (expression, branch) => [expression, branch],
  TryStatement: (branch1, branch2, branch3) => [branch1, branch2, branch3],
  // Expression //
  ImportExpression: (specifier, source) => [],
  ExportExpression: (specifier, expression) => [expression],
  RequireExpression: (expression) => [expression],
  ReadEnclaveExpression: (identifier) => [],
  TypeofEnclaveExpression: (identifier) => [],
  WriteEnclaveExpression: (identifier, expression) => [expression],
  CallSuperEnclaveExpression: (expression) => [expression],
  MemberSuperEnclaveExpression: (expression) => [expression],
  PrimitiveExpression: (primitive) => [],
  IntrinsicExpression: (intrinsic) => [],
  ReadExpression: (identifier) => [],
  AwaitExpression: (expression) => [expression],
  YieldExpression: (expression) => [expression],
  ClosureExpression: (sort, asynchronous, generator, block) => [block],
  WriteExpression: (identifier, expression) => [expression],
  SequenceExpression: (expression1, expression2) => [expression1, expression2],
  ConditionalExpression: (expression1, expression2, expression3) => [expression1, expression2, expression3],
  ThrowExpression: (expression) => [expression],
  EvalExpression: (expression) => [expression],
  UnaryExpression: (operator, expression) => [expression],
  BinaryExpression: (operator, expression1, expression2) => [expression1, expression2],
  ApplyExpression: (expression1, expression2, expressions) => [expression1, expression2].concat(expressions),
  ConstructExpression: (expression, expressions) => [expression].concat(expressions),
  ObjectExpression: (expression, properties) => [expression].concat(properties.flat())};

for (let name in callbacks) {
  const extract = callbacks[name];
  callbacks[name] = (context, node, ...fields) => (
    context.serials.set(node, context.infos.length),
    context.infos.push(
      (
        (
          name in context.counters ?
          context.counters[name]++ :
          context.counters[name] = 1),
        `${name}${context.counters[name]}`)),
    extract(...fields).forEach((node) => Tree.dispatch(context, node, callbacks))); }

const make_pointcut = (trace, cut, infos) => ArrayLite.reduce(
  [
    // Informers //
    "enter",
    "leave",
    "completion",
    "failure",
    "debugger",
    "break",
    "aggregate",
    // Producers //
    "import",
    "primitive",
    "read",
    "closure",
    "intrinsic",
    // Consumers //
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
  const program1 = Lang.parseProgram(code);
  const counters = {__proto__:null};
  Tree.dispatch({
    __proto__: null,
    serials,
    infos,
    counters
  }, program1, callbacks);
  const pointcut = make_pointcut(trace, cut, infos);
  const program2 = Instrument(program1, {
    __proto__: null,
    source: "script",
    namespace,
    serials,
    unmangle: unmangle1,
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

const trap = (name, serial, ...args) => `(
  #Reflect.get(#aran.advice, ${JSON.stringify(name)})
  (
    @#aran.advice
    ${ArrayLite.join(
      ArrayLite.map(
        ArrayLite.concat(args, [global.String(serial)]),
        (arg) => `, ${arg}`), "")}))`;

const block = (callee, sort, frame, serial, statements) => `{
  ${callee ? `#Reflect.set(input, "callee", ${callee});` : ``}
  try ${frame.labels.map((label) => label + ": ").join("")}{
    ${(
      frame.identifiers.length ?
      `let ${frame.identifiers.join(", ")};` :
      ``)}
    ${(
      `input = ${trap(
        "enter",
        serial,
        JSON.stringify(sort),
        `{
          __proto__: null,
          module: #Array.of(${frame.module.map((trade) => `{__proto__: null,${global.JSON.stringify(trade).substring(1)}`)}),
          labels: #Array.of(${frame.labels.map(unmangle2.label).join(", ")}),
          identifiers: #Array.of(${frame.identifiers.filter(is_not_namespace_identifier).map(unmangle2.identifier).join(", ")})}`,
        "input")};`)}
    ${statements}
    ${trap("completion", serial, JSON.stringify(sort))}; }
  catch {
    throw ${trap("failure", serial, JSON.stringify(sort), `#Reflect.get(input, "error")`)}; }
  finally {
    ${trap("leave", String(serial), JSON.stringify(sort))}; } }`;

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
            ImportExpression: "import1",
            source: "source1"},
          {
            __proto__: null,
            type: "export",
            ExportExpression: "export1"},
          {
            __proto__: null,
            type: "aggregate",
            ImportExpression: "import2",
            source: "source2",
            ExportExpression: "export2"}],
        labels: [],
        identifiers: []},
      {__proto__:null},
      "Block1"],
    ["completion", "script", "Block1"],
    ["failure", "script", null, "Block1"],
    ["leave", "script", "Block1"]],
  `
    import import1 from "source1";
    export export1;
    aggregate import2 from "source2" as export2;
    ${block(
      null,
      "script",
      {
        module: [
          {
            type: "import",
            ImportExpression: "import1",
            source: "source1"},
          {
            type: "export",
            ExportExpression: "export1"},
          {
            type: "aggregate",
            ImportExpression: "import2",
            source: "source2",
            ExportExpression: "export2"}],
        labels: [],
        identifiers: []},
      4,
      ``)}`);

// Atomic Statement //
counter = 0;
test(
  `{
      debugger;
      break foo;
      123;
      return 456; }`,
  [
    [
      "enter",
      "script",
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null},
      "Block1"],
    ["debugger", "Debugger1"],
    ["break", unmangle1.label("foo"), "Break1"],
    ["primitive", 123, "primitive1"],
    ["drop", null, "ExpressionStatement1"],
    ["primitive", 456, "primitive2"],
    ["return", null, "Return1"],
    ["completion", "script", "Block1"],
    ["failure", "script", null, "Block1"],
    ["leave", "script", "Block1"]],
  `${block(null, "script", {module:[], labels:[], identifiers:[]}, (counter++, counter++), `
    ${trap("debugger", counter++)};
    debugger;
    ${trap("break", counter++, unmangle2.label("foo"))};
    break foo;
    ${trap("drop", counter++, trap("primitive", counter++, "123"))};
    return ${trap("return", counter++, trap("primitive", counter++, "456"))};`)}`);

// Compound Statement //
counter = 0;
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
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null},
      "Block1"],
    // Lone //
    [
      "enter",
      "lone",
      {__proto__:null, module:[], labels:[unmangle1.label("k1"), unmangle1.label("l1")], identifiers:[]},
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
      {__proto__:null, module:[], labels:[unmangle1.label("k2"), unmangle1.label("l2")], identifiers:[]},
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
      {__proto__:null, module:[], labels:[unmangle1.label("k2"), unmangle1.label("l2")], identifiers:[]},
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
      {__proto__:null, module:[], labels:[unmangle1.label("k3"), unmangle1.label("l3")], identifiers:[]},
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
      {__proto__:null, module:[], labels:[unmangle1.label("k4"), unmangle1.label("l4")], identifiers:[]},
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
      {__proto__:null, module:[], labels:[unmangle1.label("k4"), unmangle1.label("l4")], identifiers:[]},
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
      {__proto__:null, module:[], labels:[unmangle1.label("k4"), unmangle1.label("l4")], identifiers:[]},
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
  `${block(null, "script", {module:[], labels:[], identifiers:[]}, (counter++, counter++), `
    ${block(null, "lone", {module:[], labels:["k1", "l1"], identifiers:[]}, (counter++, counter++), `
      ${trap("drop", counter++, trap("primitive", counter++, "1"))};`)}
    if (${trap("test", counter++, trap("primitive", counter++, "2"))})
      ${block(null, "then", {module:[], labels:["k2", "l2"], identifiers:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "3"))};`)}
      else ${block(null, "else", {module:[], labels:["k2", "l2"], identifiers:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "4"))};`)}
    while (${trap("test", counter++, trap("primitive", counter++, "5"))})
      ${block(null, "do", {module:[], labels:["k3", "l3"], identifiers:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "6"))};`)}
    try
      ${block(null, "try", {module:[], labels:["k4", "l4"], identifiers:[]}, (counter++, counter++), `
        ${trap("drop", counter++, trap("primitive", counter++, "7"))};`)}
      catch ${block(null, "catch", {module:[], labels:["k4", "l4"], identifiers:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "8"))};`)}
      finally ${block(null, "finally", {module:[], labels:["k4", "l4"], identifiers:[]}, counter++, `
        ${trap("drop", counter++, trap("primitive", counter++, "9"))};`)}
    return ${trap("return", counter++, trap("primitive", counter++, "10"))};`)}`);

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
    await 25;
    yield * 26;
    return 27; }`,
  [
    // Begin //
    [
      "enter",
      "script",
      {__proto__:null, module:[], labels:[], identifiers:[unmangle1.identifier("x")]},
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
  `${block(null, "script", {module:[], labels:[], identifiers:["x"]}, (counter++, counter++), `
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
counter = 0;
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
      {__proto__:null, module:[], labels:[], identifiers:[]},
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
  `${block(null, "script", {module:[], labels:[], identifiers:[]}, (counter++, counter++), `
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
counter = 0;
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
      {__proto__:null, module:[], labels:[], identifiers:[]},
      {__proto__:null},
      "Block1"],
    // arrow //
    [
      "enter",
      "arrow",
      {__proto__:null, module:[], labels:[], identifiers:[]},
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
      {__proto__:null, module:[], labels:[], identifiers:[]},
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
      {__proto__:null, module:[], labels:[], identifiers:[]},
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
      {__proto__:null, module:[], labels:[], identifiers:[]},
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
      module: [],
      labels: [],
      identifiers: [callee_identifier + "0", callee_identifier + "1", callee_identifier + "2", callee_identifier + "3"]},
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
            {module:[], labels:[], identifiers:[]},
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
            {module:[], labels:[], identifiers:[]},
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
            {module:[], labels:[], identifiers:[]},
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
            {module:[], labels:[], identifiers:[]},
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
        module: [],
        labels: [],
        identifiers: []},
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
          module: [],
          labels: [],
          identifiers: []},
        {__proto__:null},
        void 0],
      ["primitive", 123, void 0],
      ["drop", null, void 0],
      ["completion", "script", void 0],
      ["failure", "script", null, void 0],
      ["leave", "script", void 0]]); }

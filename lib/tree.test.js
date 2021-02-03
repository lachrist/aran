"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");

Assert.deepEqual(
  ArrayLite.includes(Tree.getIntrinsicEnumeration(), "eval"),
  true);

Assert.deepEqual(
  ArrayLite.includes(Tree.getIntrinsicEnumeration(), "foo"),
  false);

Tree.toggleDebugMode();

const test = (run, cases) => ArrayLite.forEach(
  cases,
  ([data, message], index) => (
    message === null ?
    Assert.doesNotThrow(
      () => run(data),
      `case #${index}`) :
    Assert.throws(
      () => run(data),
      new global.Error(message),
      `case #${index}`)));

////////////
// Atomic //
////////////

{

  const test_atomic = (type, run, cases) => test(
    run,
    ArrayLite.map(
      cases,
      ([data, message]) => [
        data,
        (
          message === null ?
          null :
          `Invalid atomic node: expected a ${type}, got ${message}`)]));

  // Enumeration //
  test_atomic(
    "Intrinsic",
    (data) => Tree.IntrinsicExpression(data),
    [
      [123, `123`],
      ["foo", `"foo"`],
      ["eval", null]]);
  test_atomic(
    "Sort",
    (data) => Tree.ClosureExpression(
      data,
      false,
      false,
      Tree.Block(
        [],
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(123)))),
    [
      [123, `123`],
      ["foo", `"foo"`],
      ["function", null],
      ["arrow", null],
      ["method", null],
      ["constructor", null]]);
  test_atomic(
    "Kind",
    (data) => Tree.DeclareEnclaveStatement(
      data,
      "foo",
      Tree.PrimitiveExpression(123)),
    [
      [123, `123`],
      ["foo", `"foo"`],
      ["let", null],
      ["const", null],
      ["var", null]]);
  test_atomic(
    "UnaryOperator",
    (data) => Tree.UnaryExpression(
      data,
      Tree.PrimitiveExpression(123)),
    [
      [123, `123`],
      ["foo", `"foo"`],
      ["typeof", null],
      ["!", null]]);
  test_atomic(
    "BinaryOperator",
    (data) => Tree.BinaryExpression(
      data,
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456)),
    [
      [123, `123`],
      ["foo", `"foo"`],
      ["in", null],
      ["+", null]]);
  // Boolean //
  test_atomic(
    "Asynchronous",
    (data) => Tree.ClosureExpression(
      "function",
      data,
      false,
      Tree.Block(
        [],
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(123)))),
    [
      [123, `123`],
      [false, null],
      [true, null]]);
  test_atomic(
    "Generator",
    (data) => Tree.ClosureExpression(
      "function",
      false,
      data,
      Tree.Block(
        [],
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(123)))),
    [
      [123, `123`],
      [false, null],
      [true, null]]);
  test_atomic(
    "Delegate",
    (data) => Tree.YieldExpression(
      data,
      Tree.PrimitiveExpression(123)),
    [
      [123, `123`],
      [false, null],
      [true, null]]);
  test_atomic(
    "Strict",
    (data) => Tree.WriteEnclaveExpression(
      data,
      "foo",
      Tree.PrimitiveExpression(123)),
    [
      [123, `123`],
      [false, null],
      [true, null]]);
  // String Infinite Subset //
  test_atomic(
    "Source",
    (data) => Tree.ImportExpression("specifier", data),
    [
      [123, `123`],
      ["foo bar", null]]);
  test_atomic(
    "Specifier",
    (data) => Tree.ImportExpression(data, "source"),
    [
      [123, `123`],
      ["foo bar", `"foo bar"`],
      ["new.target", `"new.target"`],
      ["function", null]]);
  test_atomic(
    "VariableIdentifier",
    (data) => Tree.ReadExpression(data),
    [
      [123, `123`],
      ["new.target", `"new.target"`],
      ["function", `"function"`],
      ["arrow", `"arrow"`],
      ["foo", null]]);
  test_atomic(
    "LabelIdentifier",
    (data) => Tree.BreakStatement(data),
    [
      [123, `123`],
      ["new.target", `"new.target"`],
      ["function", `"function"`],
      ["arrow", `"arrow"`],
      ["foo", null]]);
  test_atomic(
    "ReadableEnclaveVariableIdentifier",
    (data) => Tree.ReadEnclaveExpression(data),
    [
      [123, `123`],
      ["new.target", null],
      ["this", null],
      ["eval", null],
      ["arguments", null],
      ["function", `"function"`],
      ["arrow", null],
      ["foo", null]]);
  test_atomic(
    "WritableEnclaveVariableIdentifier",
    (data) => Tree.WriteEnclaveExpression(
      false,
      data,
      Tree.PrimitiveExpression(123)),
    [
      [123, `123`],
      ["new.target", `"new.target"`],
      ["import.meta", `"import.meta"`],
      ["this", `"this"`],
      ["eval", `"eval"`],
      ["arguments", `"arguments"`],
      ["function", `"function"`],
      ["arrow", null],
      ["foo", null]]);
  // Primitive //
  test_atomic(
    "Primitive",
    (data) => Tree.PrimitiveExpression(data),
    [
      [void 0, null],
      [null, null],
      [false, null],
      [true, null],
      [123, null],
      ["foo bar", null],
      [{}, `[object Object]`],
      [() => {}, `[object Function]`],
      [global.Symbol("foo"), `Symbol(foo)`]]); }

//////////
// Link //
//////////
// Aggregate //
test(
  ([specifier1, source, specifier2]) => Tree.AggregateLink(specifier1, source, specifier2),
  [
    [["foo", "bar", "qux"], null],
    [["foo", "bar", null], `The export specifier of an aggregate link cannot be null when it import specifier is not null`],
    [[null, "bar", null], null],
    [[null, "bar", "qux"], null]]);
// Import //
test(
  ([specifier1, specifier2]) => Tree.ModuleProgram(
    null,
    [
      Tree.ImportLink(specifier1, "source")],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ImportExpression(specifier2, "source")))),
  [
    [[null, null], null],
    [["foo", "foo"], null],
    [["foo", "bar"], `Illegal links`]]);
// Export //
test(
  ([specifier1, specifier2]) => Tree.ModuleProgram(
    null,
    [
      Tree.ExportLink(specifier1)], 
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.SequenceExpression(
          Tree.ExportExpression(
            specifier2,
            Tree.PrimitiveExpression(123)),
          Tree.PrimitiveExpression(456))))),
  [
    [[null, null], `Export specifier cannot be null`],
    [["foo", "foo"], null],
    [["foo", "bar"], `Illegal links`]]);

//////////////
// Variable //
//////////////
ArrayLite.forEach(
  [
    ([identifier1, identifier2, identifier3]) => Tree.EvalProgram(
      null,
      [identifier1],
      Tree.Block(
        [identifier2],
        Tree.CompletionStatement(
          Tree.ReadExpression(identifier3)))),
    ([identifier1, identifier2, identifier3]) => Tree.EvalProgram(
      null,
      [identifier1],
      Tree.Block(
        [identifier2],
        Tree.CompletionStatement(
          Tree.EvalExpression(
            [identifier3],
            Tree.PrimitiveExpression(123))))),
    ([identifier1, identifier2, identifier3]) => Tree.EvalProgram(
      null,
      [identifier1],
      Tree.Block(
        [identifier2],
        Tree.CompletionStatement(
          Tree.SequenceExpression(
            Tree.WriteExpression(
              identifier3,
              Tree.PrimitiveExpression(123)),
            Tree.PrimitiveExpression(456)))))],
  (run) => test(
    run,
    [
      [["foo", "bar", "qux"], `Program-unbound variable: qux`],
      [["qux", "bar", "qux"], null],
      [["foo", "qux", "qux"], null]]));

///////////
// Label //
///////////
test(
  ([identifier1, identifier2]) => Tree.ScriptProgram(
    null,
    Tree.ListStatement(
      [
        Tree.BranchStatement(
          Tree.Branch(
            [identifier1],
            Tree.Block(
              [],
              Tree.ListStatement(
                [
                  Tree.BreakStatement(identifier2),
                  Tree.CompletionStatement(
                    Tree.PrimitiveExpression(123))])))),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(456))])),
  [
    [["foo", "bar"], `Illegal labels`],
    [["foo", "foo"], null]]);
test(
  ([identifier1, identifier2, identifier3]) => Tree.ScriptProgram(
    null,
    Tree.ListStatement(
      [
        Tree.BranchStatement(
          Tree.Branch(
            [identifier1],
            Tree.Block(
              [],
              Tree.CompletionStatement(
                Tree.ClosureExpression(
                  "function",
                  false,
                  false,
                  Tree.Block(
                    [],
                    Tree.ListStatement(
                      [
                        Tree.BranchStatement(
                          Tree.Branch(
                            [identifier2],
                            Tree.Block(
                              [],
                              Tree.ListStatement(
                                [
                                  Tree.BreakStatement(identifier3),
                                  Tree.CompletionStatement(
                                    Tree.PrimitiveExpression(123))])))),
                        Tree.CompletionStatement(
                          Tree.PrimitiveExpression(456))]))))))),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(789))])),
  [
    [["foo", "bar", "qux"], `Closure-unbound label: qux`],
    [["qux", "foo", "qux"], `Closure-unbound label: qux`],
    [["foo", "qux", "qux"], null]]);

/////////////
// Closure //
/////////////
test(
  ([sort, asynchronous, generator]) => Tree.ClosureExpression(
    sort,
    asynchronous,
    generator,
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.PrimitiveExpression(123)))),
  [
    [["function", true, true], null],
    [["arrow", true, false], null],
    [["arrow", false, true], `Arrow closure expression cannot be generator`],
    [["method", true, false], null],
    [["method", false, true], `Method closure expression cannot be generator`],
    [["constructor", false, false], null],
    [["constructor", true, false], `Constructor closure expression cannot be asynchronous nor generator`],
    [["constructor", false, true], `Constructor closure expression cannot be asynchronous nor generator`]]);

///////////
// Await //
///////////
test(
  (asynchronous) => Tree.ScriptProgram(
    null,
    Tree.CompletionStatement(
      Tree.ClosureExpression(
        "function",
        asynchronous,
        false,
        Tree.Block(
          [],
          Tree.CompletionStatement(
            Tree.AwaitExpression(
              Tree.PrimitiveExpression(123))))))),
  [
    [true, null],
    [false, `Await expression inside non-asynchronous closure expression`]]);
test(
  (_) => Tree.ScriptProgram(
    null,
    Tree.CompletionStatement(
      Tree.AwaitExpression(
        Tree.PrimitiveExpression(123)))),
  [
    [null, `Illegal await`]]);

///////////
// Yield //
///////////
test(
  (generator) => Tree.ScriptProgram(
    null,
    Tree.CompletionStatement(
      Tree.ClosureExpression(
        "function",
        false,
        generator,
        Tree.Block(
          [],
          Tree.CompletionStatement(
            Tree.YieldExpression(
              false,
              Tree.PrimitiveExpression(123))))))),
  [
    [true, null],
    [false, `Yield expression inside non-generator closure expression`]]);
test(
  (_) => Tree.ScriptProgram(
    null,
    Tree.CompletionStatement(
      Tree.YieldExpression(
        false,
        Tree.PrimitiveExpression(123)))),
  [
    [null, `Illegal yield`]]);

////////////////
// Completion //
////////////////
test(
  ([constructor1, constructor2, constructor3]) => Tree.Block(
    [],
    Tree.ListStatement(
      [
        Tree.ListStatement(
          [
            Tree[constructor1](
              Tree.PrimitiveExpression(123)),
            Tree[constructor2](
              Tree.PrimitiveExpression(456))]),
        Tree.ListStatement(
          [
            Tree[constructor3](
              Tree.PrimitiveExpression(123))])])),
  [
    [["ExpressionStatement", "ExpressionStatement", "CompletionStatement"], null],
    [["ExpressionStatement", "CompletionStatement", "CompletionStatement"], `Completion statement should appear last`],
    [["CompletionStatement", "ExpressionStatement", "CompletionStatement"], `Completion statement should appear last`],
    [["ExpressionStatement", "ExpressionStatement", "ExpressionStatement"], `The last statement of a block must be a completion statement`]]);

////////////////
// Assignment //
////////////////
ArrayLite.forEach(
  [
    Tree.WriteExpression(
      "foo",
      Tree.PrimitiveExpression(123)),
    Tree.ExportExpression(
      "foo",
      Tree.PrimitiveExpression(123)),
    Tree.WriteEnclaveExpression(
      true,
      "foo",
      Tree.PrimitiveExpression(123))],
  (expression) => (
    test(
      (_) => Tree.ReturnStatement(expression),
      [
        [null, `Assignment expression should be dropped`]]),
    test(
      (_) => Tree.ExpressionStatement(expression),
      [
        [null, null]]),
    test(
      (_) => Tree.SequenceExpression(
        expression,
        Tree.PrimitiveExpression(456)),
      [
        [null, null]]),
    test(
      (_) => Tree.SequenceExpression(
        Tree.PrimitiveExpression(456),
        expression),
      [
        [null, null]]),
    test(
      (_) => Tree.ReturnStatement(
        Tree.SequenceExpression(
          Tree.PrimitiveExpression(456),
          expression)),
      [
        [null, `Assignment expression should be dropped`]]),
    test(
      (_) => Tree.ConditionalExpression(
        Tree.PrimitiveExpression(456),
        expression,
        Tree.PrimitiveExpression(789)),
      [
        [null, null]]),
    test(
      (_) => Tree.ConditionalExpression(
        Tree.PrimitiveExpression(456),
        Tree.PrimitiveExpression(789),
        expression),
      [
        [null, null]]),
    test(
      (_) => Tree.ReturnStatement(
        Tree.ConditionalExpression(
          Tree.PrimitiveExpression(456),
          expression,
          Tree.PrimitiveExpression(789))),
      [
        [null, `Assignment expression should be dropped`]]),
    test(
      (_) => Tree.ReturnStatement(
        Tree.ConditionalExpression(
          Tree.PrimitiveExpression(456),
          Tree.PrimitiveExpression(789),
          expression)),
      [
        [null, `Assignment expression should be dropped`]]),
    void 0));

/////////////
// Enclave //
/////////////

// root //
test(
  (enclave) => Tree.ScriptProgram(
    enclave,
    Tree.CompletionStatement(
      Tree.PrimitiveExpression(123))),
  [
    [null, null],
    ["strict-script", null],
    ["sloppy-script", null],
    ["strict-module", `Script program can only be in a script enclave`],
    ["strict-program", `Script program can only be in a script enclave`],
    ["sloppy-program", `Script program can only be in a script enclave`]]);
test(
  (enclave) => Tree.EvalProgram(
    enclave,
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.PrimitiveExpression(123)))),
    [
      [null, null],
      ["strict-script", `EvalProgram can not be in a module/script enclave`],
      ["sloppy-script", `EvalProgram can not be in a module/script enclave`],
      ["strict-module", `EvalProgram can not be in a module/script enclave`],
      ["strict-program", null],
      ["sloppy-program", null]]);
test(
  (enclave) => Tree.ModuleProgram(
    enclave,
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.PrimitiveExpression(123)))),
    [
      [null, null],
      ["strict-script", `ModuleProgram can only be in a module enclave`],
      ["sloppy-script", `ModuleProgram can only be in a module enclave`],
      ["strict-module", null],
      ["strict-program", `ModuleProgram can only be in a module enclave`],
      ["sloppy-program", `ModuleProgram can only be in a module enclave`]]);

// enclave_rigid_variable_array
test(
  (enclave) => Tree.ScriptProgram(
    enclave,
    Tree.ListStatement(
      [
        Tree.DeclareEnclaveStatement(
          "let",
          "x",
          Tree.PrimitiveExpression(123)),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(456))])),
  [
    [null, `Illegal enclave_rigid_variable_array for absent enclave`],
    ["sloppy-script", null],
    ["strict-script", null]]);
test(
  (_) => Tree.EvalProgram(
    null,
    [],
    Tree.Block(
      [],
      Tree.ListStatement(
        [
          Tree.DeclareEnclaveStatement(
            "let",
            "x",
            Tree.PrimitiveExpression(123)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(456))]))),
  [
    [null, `Cannot have rigid enclave variable declaration inside blocks`]]);

// enclave_loose_variable_array
test(
  (enclave) => Tree.EvalProgram(
    enclave,
    [],
    Tree.Block(
      [],
      Tree.ListStatement(
        [
          Tree.DeclareEnclaveStatement(
            "var",
            "x",
            Tree.PrimitiveExpression(123)),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(456))]))),
  [
    [null, `Illegal enclave_loose_variable_array for absent enclave`],
    ["sloppy-program", null],
    ["strict-program", `Illegal enclave_loose_variable_array for strict-program enclave`]]);
test(
  (_) => Tree.ScriptProgram(
    null,
    Tree.CompletionStatement(
      Tree.ClosureExpression(
        "function",
        false,
        false,
        Tree.Block(
          [],
          Tree.ListStatement(
            [
              Tree.DeclareEnclaveStatement(
                "var",
                "x",
                Tree.PrimitiveExpression(123)),
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(456))]))))),
  [
    [null, `loose enclave variable declaration in closure`]]);

// enclave_new_target
test(
  (enclave) => Tree.EvalProgram(
    enclave,
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ReadEnclaveExpression("new.target")))),
  [
    [null, `Illegal enclave_new_target for absent enclave`],
    ["sloppy-program", `Illegal enclave_new_target for sloppy-program enclave`],
    ["strict-program", `Illegal enclave_new_target for strict-program enclave`],
    ["sloppy-function", null],
    ["strict-function", null]]);
test(
  (sort) => Tree.EvalProgram(
    "sloppy-function",
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ClosureExpression(
          sort,
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.ReadEnclaveExpression("new.target"))))))),
  [
    ["arrow", null],
    ["function", `enclave new.target in non-arrow closure expression`]]);

// enclave_this
test(
  (enclave) => Tree.EvalProgram(
    enclave,
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ReadEnclaveExpression("this")))),
  [
    [null, `Illegal enclave_this for absent enclave`],
    ["sloppy-program", null],
    ["strict-program", null]]);
test(
  (sort) => Tree.EvalProgram(
    "sloppy-program",
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ClosureExpression(
          sort,
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.ReadEnclaveExpression("this"))))))),
  [
    ["arrow", null],
    ["function", `enclave this in non-arrow closure expression`]]);

// enclave_arguments
test(
  (enclave) => Tree.EvalProgram(
    enclave,
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ReadEnclaveExpression("arguments")))),
  [
    [null, `Illegal enclave_arguments for absent enclave`],
    ["sloppy-program", null],
    ["strict-program", null]]);
test(
  (sort) => Tree.EvalProgram(
    "sloppy-program",
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ClosureExpression(
          sort,
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.ReadEnclaveExpression("arguments"))))))),
  [
    ["arrow", null],
    ["function", `enclave arguments in non-arrow closure expression`]]);

// enclave_super_call
test(
  (enclave) => Tree.EvalProgram(
    enclave,
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.CallSuperEnclaveExpression(
          Tree.PrimitiveExpression(123))))),
  [
    [null, `Illegal enclave_super_call for absent enclave`],
    ["strict-constructor", `Illegal enclave_super_call for strict-constructor enclave`],
    ["strict-derived-constructor", null]]);
test(
  (sort) => Tree.EvalProgram(
    "strict-derived-constructor",
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ClosureExpression(
          sort,
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.CallSuperEnclaveExpression(
                Tree.PrimitiveExpression(123)))))))),
  [
    ["arrow", null],
    ["function", `enclave super(...) in non-arrow closure expression`]]);

// enclave_super_access
test(
  (enclave) => Tree.EvalProgram(
    enclave,
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.GetSuperEnclaveExpression(
          Tree.PrimitiveExpression(123))))),
  [
    [null, `Illegal enclave_super_access for absent enclave`],
    ["strict-constructor", null],
    ["strict-derived-constructor", null],
    ["strict-method", null],
    ["strict-function", `Illegal enclave_super_access for strict-function enclave`]]);
test(
  (sort) => Tree.EvalProgram(
    "strict-method",
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ClosureExpression(
          sort,
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.GetSuperEnclaveExpression(
                Tree.PrimitiveExpression(123)))))))),
  [
    ["arrow", null],
    ["function", `enclave super[...] in non-arrow closure expression`]]);

// enclave_variable_array
test(
  (enclave) => Tree.ScriptProgram(
    enclave,
    Tree.CompletionStatement(
      Tree.ReadEnclaveExpression("x"))),
  [
    [null, `Illegal enclave_variable_array for absent enclave`],
    ["strict-script", null],
    ["sloppy-script", null]]);

////////////
// Simple //
////////////
ArrayLite.forEach(
  ["Debug", "Normal"],
  (mode) => (
    Tree[`toggle${mode}Mode`](),
    Assert.doesNotThrow(
      () => (
        // Program //
        Tree.ScriptProgram(
          null,
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(123))),
        Tree.EvalProgram(
          null,
          [],
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(123)))),
        Tree.ModuleProgram(
          null,
          [],
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(123)))),
        // Link //
        Tree.ImportLink("foo", "bar"),
        Tree.ExportLink("foo"),
        Tree.AggregateLink("foo", "bar", "qux"),
        // Branch //
        Tree.Branch(
          [],
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(123)))),
        // Block //
        Tree.Block(
          [],
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(123))),
        // Statement >> Atomic //
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(123)),
        Tree.ReturnStatement(
          Tree.PrimitiveExpression(123)),
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(123)),
        Tree.BreakStatement("foo"),
        Tree.DebuggerStatement(),
        Tree.ListStatement([]),
        Tree.DeclareEnclaveStatement(
          "let",
          "foo",
          Tree.PrimitiveExpression(123)),
        // Statement >> Compound //
        Tree.BranchStatement(
          Tree.Branch(
            [],
            Tree.Block(
              [],
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(123))))),
        Tree.IfStatement(
          Tree.PrimitiveExpression(123),
          Tree.Branch(
            [],
            Tree.Block(
              [],
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(456)))),
          Tree.Branch(
            [],
            Tree.Block(
              [],
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(789))))),
        Tree.WhileStatement(
          Tree.PrimitiveExpression(123),
          Tree.Branch(
            [],
            Tree.Block(
              [],
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(456))))),
        Tree.TryStatement(
          Tree.Branch(
            [],
            Tree.Block(
              [],
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(123)))),
          Tree.Branch(
            [],
            Tree.Block(
              [],
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(456)))),
          Tree.Branch(
            [],
            Tree.Block(
              [],
              Tree.CompletionStatement(
                Tree.PrimitiveExpression(789))))),
        // Expression >> Producer //
        Tree.ImportExpression("foo", "bar"),
        Tree.PrimitiveExpression(123),
        Tree.IntrinsicExpression("eval"),
        Tree.ReadExpression("foo"),
        Tree.ReadEnclaveExpression("foo"),
        Tree.TypeofEnclaveExpression("foo"),
        Tree.ClosureExpression(
          "function",
          false,
          false,
          Tree.Block(
            [],
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(123)))),
        // Expression >> Consumer //
        Tree.EvalExpression(
          ["foo"],
          Tree.PrimitiveExpression(123)),
        Tree.AwaitExpression(
          Tree.PrimitiveExpression(123)),
        Tree.YieldExpression(
          false,
          Tree.PrimitiveExpression(123)),
        Tree.ExportExpression(
          "foo",
          Tree.PrimitiveExpression(123)),
        Tree.WriteExpression(
          "foo",
          Tree.PrimitiveExpression(123)),
        Tree.WriteEnclaveExpression(
          false,
          "foo",
          Tree.PrimitiveExpression(123)),
        Tree.SequenceExpression(
          Tree.PrimitiveExpression(123),
          Tree.PrimitiveExpression(456)),
        Tree.ConditionalExpression(
          Tree.PrimitiveExpression(123),
          Tree.PrimitiveExpression(456),
          Tree.PrimitiveExpression(789)),
        Tree.ThrowExpression(
          Tree.PrimitiveExpression(123)),
        // Expression >> Combiner //
        Tree.GetSuperEnclaveExpression(
          Tree.PrimitiveExpression(123)),
        Tree.SetSuperEnclaveExpression(
          Tree.PrimitiveExpression(123),
          Tree.PrimitiveExpression(456)),
        Tree.CallSuperEnclaveExpression(
          Tree.PrimitiveExpression(123)),
        Tree.RequireExpression(
          Tree.PrimitiveExpression(123)),
        Tree.ApplyExpression(
          Tree.PrimitiveExpression(123),
          Tree.PrimitiveExpression(456),
          [
            Tree.PrimitiveExpression(789)]),
        Tree.ConstructExpression(
          Tree.PrimitiveExpression(123),
          [
            Tree.PrimitiveExpression(456)]),
        Tree.UnaryExpression(
          "!",
          Tree.PrimitiveExpression(123)),
        Tree.BinaryExpression(
          "+",
          Tree.PrimitiveExpression(123),
          Tree.PrimitiveExpression(456)),
        Tree.ObjectExpression(
          Tree.PrimitiveExpression(123),
          [
            [
              Tree.PrimitiveExpression(456),
              Tree.PrimitiveExpression(789)]]),
        // Return //
        void 0)),
    void 0));

//////////////////////////////////////
// Build (Normale Mode) && Accessor //
//////////////////////////////////////

Tree.toggleNormalMode();

// dispatch && extract && allign //
{
  const context = "ctx";
  const result = "foobar";
  const test = (type, fields, _node) => (
    _node = global.Reflect.apply(Tree[type], global.undefined, fields),
    // dispatch //
    Assert.deepEqual(
      Tree.dispatch(
        context,
        _node,
        {
          __proto__: null,
          [type]: (...args) => (
            Assert.deepEqual(
              args,
              ArrayLite.concat([context, _node], fields)),
            result)},
        null),
      result),
    Assert.deepEqual(
      Tree.dispatch(
        context,
        _node,
        {__proto__: null},
        (...args) => (
          Assert.deepEqual(args, [context, _node, type]),
          result)),
      result),
    // extract //
    Assert.deepEqual(
      Tree.extract(
        context,
        _node,
        type,
        (...args) => (
          Assert.deepEqual(
            args,
            ArrayLite.concat([context, _node], fields)),
          result)),
      result),
    // allign //
    Assert.deepEqual(
      Tree.allign(
        context,
        _node,
        _node,
        {
          __proto__: null,
          [type]: (...args) => (
            Assert.deepEqual(
              args,
              ArrayLite.concat([context, _node, _node], fields, fields)),
            result)},
        null),
      result),
    Assert.deepEqual(
      Tree.allign(
        context,
        _node,
        _node,
        {__proto__: null},
        (...args) => (
          Assert.deepEqual(args, [context, _node, _node, type, type]),
          result)),
      result));
  // 0 //
  test("DebuggerStatement", []);
  // 1 //
  test("BreakStatement", ["l"]);
  // 2 //
  test("UnaryExpression", ["!", Tree.PrimitiveExpression(123)]);
  // 3 //
  test("BinaryExpression", ["+", Tree.PrimitiveExpression(123), Tree.PrimitiveExpression(456)]);
  // 4 //
  test("ClosureExpression", ["function", true, true, Tree.Block(["x"], Tree.CompletionStatement(Tree.PrimitiveExpression(123)))]);
  // 5 //
  Assert.throws(
    () => Tree.extract(
      "ctx",
      ["DummyType", 1, 2, 3, 4, 5],
      "DummyType",
      () => Assert.fail()),
    new global.Error(`Invalid node length for extract`));
  Assert.throws(
    () => Tree.dispatch(
      "ctx",
      ["DummyType", 1, 2, 3, 4, 5],
      {
        __proto__: null,
        "DummyType": () => Assert.fail()},
      null),
    new global.Error(`Invalid node length for dispatch`)); }

// match //
Assert.deepEqual(
  Tree.match("ctx", "foo", (...args) => (
    Assert.deepEqual(args, ["ctx", "foo"]),
    true)),
  true);
Assert.deepEqual(
  Tree.match("ctx", "foo",  (...args) => (
    Assert.deepEqual(args, ["ctx", "foo"]),
    false)),
  false);
Assert.deepEqual(
  Tree.match("ctx", "foo", "foo"),
  true);
Assert.deepEqual(
  Tree.match("ctx", "foo", "bar"),
  false);
Assert.deepEqual(
  Tree.match(
    "ctx",
    "foo",
    Tree.PrimitiveExpression(123)),
  false);
Assert.deepEqual(
  Tree.match(
    "ctx",
    Tree.PrimitiveExpression(123),
    "foo"),
  false);
Assert.deepEqual(
  Tree.match(
    "ctx",
    Tree.PrimitiveExpression(123),
    Tree.ReadExpression("x")),
  false);
Assert.deepEqual(
  Tree.match(
    "ctx",
    Tree.PrimitiveExpression(123),
    Tree.PrimitiveExpression(123)),
  true);

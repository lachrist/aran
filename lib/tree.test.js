"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");

// ////////////
// // Syntax //
// ////////////
// Tree.toggleDebugMode();
// // primitive //
// Tree.PrimitiveExpression(null);
// Tree.PrimitiveExpression(void 0);
// Tree.PrimitiveExpression(true);
// Tree.PrimitiveExpression(false);
// Tree.PrimitiveExpression(123);
// Tree.PrimitiveExpression(123n);
// Tree.PrimitiveExpression("foo");
// Assert.throws(
//   () => Tree.PrimitiveExpression(Symbol("foo")),
//   new global.Error(`Invalid atomic node: expected a Primitive, got Symbol(foo)`));
// Assert.throws(
//   () => Tree.PrimitiveExpression({}),
//   new global.Error(`Invalid atomic node: expected a Primitive, got [object Object]`));
// Assert.throws(
//   () => Tree.PrimitiveExpression(() => {}),
//   new global.Error(`Invalid atomic node: expected a Primitive, got [object Function]`));
// // label & identifier //
// [["LabelIdentifier", "BreakStatement"], ["VariableIdentifier", "ReadExpression"]].forEach(([type, constructor]) => {
//   Tree[constructor]("foo");
//   Assert.throws(
//     () => Tree[constructor]("eval"),
//     new global.Error(`Invalid atomic node: expected a ${type}, got "eval"`));
//   Assert.throws(
//     () => Tree[constructor](" foo"),
//     new global.Error(`Invalid atomic node: expected a ${type}, got " foo"`));
//   Assert.throws(
//     () => Tree[constructor]("foo "),
//     new global.Error(`Invalid atomic node: expected a ${type}, got "foo "`));
//   Assert.throws(
//     () => Tree[constructor]("foo bar"),
//     new global.Error(`Invalid atomic node: expected a ${type}, got "foo bar"`));
//   Assert.throws(
//     () => Tree[constructor]("0foo"),
//     new global.Error(`Invalid atomic node: expected a ${type}, got "0foo"`));
//   Assert.throws(
//     () => Tree[constructor]("in"),
//     new global.Error(`Invalid atomic node: expected a ${type}, got "in"`));
//   Assert.throws(
//     () => Tree[constructor](123),
//     new global.Error(`Invalid atomic node: expected a ${type}, got 123`)); });
// // Source && Specifier //
// Tree.ImportLink(null, "*foobar*");
// Tree.ImportLink("var", "*foobar*");
// // ReadableEnclaveVariableIdentifier //
// Tree.ReadEnclaveExpression("foo");
// Tree.ReadEnclaveExpression("eval");
// Tree.ReadEnclaveExpression("arguments");
// Assert.throws(
//   () => Tree.ReadEnclaveExpression("var"),
//   new global.Error(`Invalid atomic node: expected a ReadableEnclaveVariableIdentifier, got "var"`));
// // WritableEnclaveVariableIdentifier //
// Tree.WriteEnclaveExpression(
//   true,
//   "foo",
//   Tree.PrimitiveExpression(123));
// Assert.throws(
//   () => Tree.WriteEnclaveExpression(
//     true,
//     "eval",
//     Tree.PrimitiveExpression(123)),
//   new global.Error(`Invalid atomic node: expected a WritableEnclaveVariableIdentifier, got "eval"`));
// Assert.throws(
//   () => Tree.WriteEnclaveExpression(
//     true,
//     "arguments",
//     Tree.PrimitiveExpression(123)),
//   new global.Error(`Invalid atomic node: expected a WritableEnclaveVariableIdentifier, got "arguments"`));
// Assert.throws(
//   () => Tree.WriteEnclaveExpression(
//     true,
//     "var",
//     Tree.PrimitiveExpression(123)),
//   new global.Error(`Invalid atomic node: expected a WritableEnclaveVariableIdentifier, got "var"`));
// // Kind //
// Tree.DeclareEnclaveStatement(
//   "var",
//   "foo",
//   Tree.PrimitiveExpression(123));
// Tree.DeclareEnclaveStatement(
//   "let",
//   "foo",
//   Tree.PrimitiveExpression(123));
// Tree.DeclareEnclaveStatement(
//   "const",
//   "foo",
//   Tree.PrimitiveExpression(123));
// Assert.throws(
//   () => Tree.DeclareEnclaveStatement(
//     "bar",
//     "foo",
//     Tree.PrimitiveExpression(123)),
//   new global.Error(`Invalid atomic node: expected a Kind, got "bar"`));

////////////////////////
// Build (Debug Mode) //
////////////////////////
Tree.toggleDebugMode();

////////////
// Atomic //
////////////
// Specifier //
Assert.throws(
  () => Tree.ImportExpression(123, "source"),
  new global.Error(`Invalid atomic node: expected a Specifier, got 123`));
Assert.throws(
  () => Tree.ImportExpression("foo.bar", "source"),
  new global.Error(`Invalid atomic node: expected a Specifier, got "foo.bar"`));
// Source //
Assert.throws(
  () => Tree.ImportExpression("specifier", 123),
  new global.Error(`Invalid atomic node: expected a Source, got 123`));
// Primitive //
Assert.doesNotThrow(
  () => Tree.PrimitiveExpression(void 0));
Assert.doesNotThrow(
  () => Tree.PrimitiveExpression(null));
Assert.doesNotThrow(
  () => Tree.PrimitiveExpression(false));
Assert.doesNotThrow(
  () => Tree.PrimitiveExpression(true));
Assert.doesNotThrow(
  () => Tree.PrimitiveExpression("foo"));
Assert.doesNotThrow(
  () => Tree.PrimitiveExpression(123));
Assert.throws(
  () => Tree.PrimitiveExpression({}),
  new global.Error(`Invalid atomic node: expected a Primitive, got [object Object]`));
// Intrinsic //
Assert.throws(
  () => Tree.IntrinsicExpression("foobar"),
  new global.Error(`Invalid atomic node: expected a Intrinsic, got "foobar"`));
Assert.doesNotThrow(
  () => Tree.IntrinsicExpression("eval"));
// VariableIdentifier //
Assert.throws(
  () => Tree.ReadExpression(123),
  new global.Error(`Invalid atomic node: expected a VariableIdentifier, got 123`));
Assert.throws(
  () => Tree.ReadExpression("foo.bar"),
  new global.Error(`Invalid atomic node: expected a VariableIdentifier, got "foo.bar"`));
Assert.throws(
  () => Tree.ReadExpression("function"),
  new global.Error(`Invalid atomic node: expected a VariableIdentifier, got "function"`));
Assert.throws(
  () => Tree.ReadExpression("arrow"),
  new global.Error(`Invalid atomic node: expected a VariableIdentifier, got "arrow"`));
// LabelIdentifier //
Assert.throws(
  () => Tree.BreakStatement(123),
  new global.Error(`Invalid atomic node: expected a LabelIdentifier, got 123`));
Assert.throws(
  () => Tree.BreakStatement("foo.bar"),
  new global.Error(`Invalid atomic node: expected a LabelIdentifier, got "foo.bar"`));
Assert.throws(
  () => Tree.BreakStatement("function"),
  new global.Error(`Invalid atomic node: expected a LabelIdentifier, got "function"`));
Assert.throws(
  () => Tree.BreakStatement("arrow"),
  new global.Error(`Invalid atomic node: expected a LabelIdentifier, got "arrow"`));
// Closure (Sort && Asynchronous && Generator) //
Assert.doesNotThrow(
  () => Tree.ClosureExpression(
    "function",
    false,
    false,
    Tree.Block(
      Tree.CompletionStatement(
        Tree.PrimitiveExpression(123)))));
// Sort //
Assert.throws(
  () => Tree.ClosureExpression(
    "foo",
    false,
    false,
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.PrimitiveExpression(123)))),
  new global.Error(`Invalid atomic node: expected a Sort, got "foo"`));
// Asynchronous //
Assert.throws(
  () => Tree.ClosureExpression(
    "function",
    "foo",
    false,
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.PrimitiveExpression(123)))),
  new global.Error(`Invalid atomic node: expected a Asynchronous, got "foo"`));
// Generator //
Assert.throws(
  () => Tree.ClosureExpression(
    "function",
    false,
    "foo",
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.PrimitiveExpression(123)))),
  new global.Error(`Invalid atomic node: expected a Generator, got "foo"`));
// Delegate //
Assert.doesNotThrow(
  () => Tree.YieldExpression(
    false,
    Tree.PrimitiveExpression(123)),
Assert.throws(
  () => Tree.YieldExpression(
    "foo",
    Tree.PrimitiveExpression(123)),
  new global.Error(`Invalid atomic node: expected a Delegate, got "foo"`));
// Strict //
Assert.doesNotThrow(
  () => Tree.WriteEnclaveExpression(
    false,
    "x",
    Tree.PrimitiveExpression(123)));
Assert.throws(
  () => Tree.WriteEnclaveExpression(
    "foo",
    "x",
    Tree.PrimitiveExpression(123)),
  new global.Error(`Invalid atomic node: expected a Strict, got "foo"`));
// EnclaveReadIdentifier //

// EnclaveWriteIdentifier //

//////////
// Link //
//////////
// Aggregate //
Assert.doesNotThrow(
  () => Tree.AggregateLink("specifier1", "source", "specifier2"));
Assert.throws(
  () => Tree.AggregateLink("specifier1", "source", null),
  new global.Error(`The export specifier of an aggregate link cannot be null when it import specifier is not null`));
Assert.doesNotThrow(
  () => Tree.AggregateLink(null, "source", "specifier2"));
Assert.doesNotThrow(
  () => Tree.AggregateLink(null, "source", null));
// Import //
Assert.doesNotThrow(
  () => Tree.ImportLink(null, "source"));
Assert.throws(
  () => Tree.ModuleProgram(
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ImportExpression("specifier", "source")))),
  new global.Error(`Program-unbound link: import specifier from "source"`));
Assert.doesNotThrow(
  () => Tree.ModuleProgram(
    [
      Tree.ImportLink("specifier", "source")],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.ImportExpression("specifier", "source")))));
// Export //
Assert.throws(
  () => Tree.ExportLink(null),
  new global.Error(`Export specifier cannot be null`));
Assert.throws(
  () => Tree.ModuleProgram(
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.SequenceExpression(
          Tree.ExportExpression(
            "specifier",
            Tree.PrimitiveExpression(123)),
          Tree.PrimitiveExpression(456))))),
  new global.Error(`Program-unbound link: export specifier`));
Assert.doesNotThrow(
  () => Tree.ModuleProgram(
    [
      Tree.ExportLink("specifier")],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.SequenceExpression(
          Tree.ExportExpression(
            "specifier",
            Tree.PrimitiveExpression(123)),
          Tree.PrimitiveExpression(456))))));

///////////////////////
// Expression Atomic //
///////////////////////

//////////////
// Variable //
//////////////
ArrayLite.forEach(
  [
    Tree.ReadExpression("x"),
    Tree.SequenceExpression(
      Tree.WriteExpression(
        "x",
        Tree.PrimitiveExpression(123)),
      Tree.PrimitiveExpression(456))],
  (expression) => (
    Assert.throws(
      () => Tree.ScriptProgram(
        Tree.Block(
          [],
          Tree.CompletionStatement(expression))),
      new global.Error(`Program-unbound variable: x`)),
    Assert.doesNotThrow(
      () => Tree.ScriptProgram(
        Tree.Block(
          ["x"],
          Tree.CompletionStatement(expression)))),
    Assert.doesNotThrow(
      () => Tree.EvalProgram(
        ["x"],
        Tree.Block(
          [],
          Tree.CompletionStatement(expression)))),
    void 0));

///////////
// Label //
///////////
// Branch //
Assert.doesNotThrow(
  () => Tree.ScriptProgram(
    Tree.Block(
      [],
      Tree.ListStatement(
        [
          Tree.BranchStatement(
            Tree.Branch(
              ["l"],
              Tree.Block(
                [],
                Tree.ListStatement(
                  [
                    Tree.BreakStatement("l"),
                    Tree.CompletionStatement(
                      Tree.PrimitiveExpression(123))])))),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(456))]))));
// Program //
Assert.throws(
  () => Tree.ScriptProgram(
    Tree.Block(
      [],
      Tree.ListStatement(
        [
          Tree.BreakStatement("l"),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(123))]))),
  new global.Error(`Program-unbound label: l`));
// Closure //
Assert.throws(
  () => Tree.ClosureExpression(
    "function",
    true,
    false,
    Tree.Block(
      [],
      Tree.ListStatement(
        [
          Tree.BreakStatement("l"),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(123))]))),
  new global.Error(`Closure-unbound label: l`));

/////////////
// Closure //
/////////////
// ClosureExpression //
ArrayLite.forEach(
  [
    ["function", false, false, null],
    ["function", false, true, null],
    ["function", true, false, null],
    ["function", true, true, null],
    ["arrow", false, false, null],
    ["arrow", false, true, new global.Error(`Arrow closure expression cannot be generator`)],
    ["arrow", true, false, null],
    ["arrow", true, true, new global.Error(`Arrow closure expression cannot be generator`)],
    ["method", false, false, null],
    ["method", false, true, new global.Error(`Method closure expression cannot be generator`)],
    ["method", true, false, null],
    ["method", true, true, new global.Error(`Method closure expression cannot be generator`)],
    ["constructor", false, false, null],
    ["constructor", false, true, new global.Error(`Constructor closure expression cannot be asynchronous nor generator`)],
    ["constructor", true, false, new global.Error(`Constructor closure expression cannot be asynchronous nor generator`)],
    ["constructor", true, true, new global.Error(`Constructor closure expression cannot be asynchronous nor generator`)]],
  ([sort, asynchronous, generator, error]) => Assert[error === null ? "doesNotThrow" : "throws"](
    () => Tree.ClosureExpression(
      sort,
      asynchronous,
      generator,
      Tree.Block(
        [],
        Tree.CompletionStatement(
          Tree.PrimitiveExpression(123)))),
    ...(error === null ? [] : [error])));

////////////////////
// Await && Yield //
////////////////////
// Program //
Assert.throws(
  () => Tree.ScriptProgram(
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.AwaitExpression(
          Tree.PrimitiveExpression(123))))),
  new global.Error(`Await expression inside program`));
Assert.throws(
  () => Tree.ScriptProgram(
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.YieldExpression(
          false,
          Tree.PrimitiveExpression(123))))),
  new global.Error(`Yield expression inside program`));
// Closure //
Assert.doesNotThrow(
  () => Tree.ClosureExpression(
    "function",
    true,
    true,
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.SequenceExpression(
          Tree.AwaitExpression(
            Tree.PrimitiveExpression(123)),
          Tree.YieldExpression(
            false,
            Tree.PrimitiveExpression(456)))))));
Assert.throws(
  () => Tree.ClosureExpression(
    "function",
    false,
    false,
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.YieldExpression(
          false,
          Tree.PrimitiveExpression(456))))),
  new global.Error(`Yield expression inside non-generator closure expression`));
Assert.throws(
  () => Tree.ClosureExpression(
    "function",
    false,
    false,
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.AwaitExpression(
          Tree.PrimitiveExpression(456))))),
  new global.Error(`Await expression inside non-asynchronous closure expression`));

////////////////
// Completion //
////////////////
Assert.doesNotThrow(
  () => Tree.Block(
    [],
    Tree.ListStatement(
      [
        Tree.ListStatement(
          [
            Tree.ExpressionStatement(
              Tree.PrimitiveExpression(123)),
            Tree.ExpressionStatement(
              Tree.PrimitiveExpression(456))]),
        Tree.ListStatement(
          [
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(123))])])));
Assert.throws(
  () => Tree.Block(
    [],
    Tree.ListStatement(
      [
        Tree.ListStatement(
          [
            Tree.ExpressionStatement(
              Tree.PrimitiveExpression(123)),
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(456))]),
        Tree.ListStatement(
          [
            Tree.CompletionStatement(
              Tree.PrimitiveExpression(123))])])),
  new global.Error(`Completion statement should appear last`));
Assert.throws(
  () => Tree.Block(
    [],
    Tree.ListStatement(
      [
        Tree.ListStatement(
          [
            Tree.ExpressionStatement(
              Tree.PrimitiveExpression(123)),
            Tree.ExpressionStatement(
              Tree.PrimitiveExpression(456))]),
        Tree.ListStatement(
          [
            Tree.ExpressionStatement(
              Tree.PrimitiveExpression(123))])])),
  new global.Error(`The last statement of a block must be a completion statement`));

////////////////
// Assignment //
////////////////
// WriteExpression && ExportExpression && EnclaveWriteExpression //
ArrayLite.forEach(
  [
    Tree.WriteExpression(
      "x",
      Tree.PrimitiveExpression(123)),
    Tree.ExportExpression(
      "specifier",
      Tree.PrimitiveExpression(123)),
    Tree.WriteEnclaveExpression(
      true,
      "x",
      Tree.PrimitiveExpression(123))],
  (expression) => (
    Assert.throws(
      () => Tree.ReturnStatement(expression),
      new global.Error(`Assignment expression should be dropped`)),
    Assert.doesNotThrow(
      () => Tree.ExpressionStatement(expression)),
    Assert.doesNotThrow(
      () => Tree.SequenceExpression(
        expression,
        Tree.PrimitiveExpression(456))),
    void 0));


// // Program //
// ScriptProgram: (result) => checkout(result),
// EvalProgram: (indentifiers, result) => checkout(
//   {
//     __proto__: result,
//     variables: ArrayLite.filterOut(
//       result.variables,
//       (identifier) => ArrayLite.includes(identifiers, identifier))}),
// ModuleProgram: (results, result, _links) => checkout(
//   {
//     __proto__: result,
//     links: ArrayLite.filterOut(
//       result.links,
//       (link1) => ArrayLite.any(
//         results,
//         (result) => ArrayLite.any(
//           result.links,
//           (link2) => (
//             link1.type === links2.type &&
//             link1.specifier === link2.specifier &&
//             link1.source === link2.source))))}),
// // Link //
// ImportLink: (specifier, source) => ({
//   __proto__: empty,
//   links: [
//     {
//       __proto__: null,
//       type: "import",
//       specifier,
//       source}]}),
// ExportLink: (specifier) => (
//   Throw.assert(specifier !== null, null, `Export specifier cannot be null`),
//   {
//     __proto__: empty,
//     links: [
//       {
//         __proto__: null,
//         type: "export",
//         specifier}]}),
// AggregateLink: (specifier1, source, specifier2) => (
//   Throw.assert(specifier1 === null || specifier2 !== null, `Aggregate export specifier cannot be null when import specifier is not null`),
//   empty),
// // Branch //
// Branch: (identifiers, result) => ({
//   __proto__: result,
//   labels: ArrayLite.filterOut(
//     result.labels,
//     (identifier) => ArrayLite.includes(identifiers, identifier))}),
// // Block //
// Block: (identifiers, result) => (
//   Throw.assert(result.completion, null, `The last statement of a block must be a completion statement`),
//   ({
//     __proto__: result,
//     completion: false,
//     variables: ArrayLite.filterOut(
//       result.variables,
//       (identifier) => ArrayLite.includes(identifiers, identifier))})),
// // Statement >> Atomic //
// ExpressionStatement: (result) => check_not_assignment(result),
// ReturnStatement: (result) => check_not_assignment(result),
// CompletionStatement: (result) => check_not_assignment(result),
// BreakStatement: (label) => ({__proto__:empty, labels:[label]}),
// DebuggerStatement: () => empty,
// ListStatement: (results) => ArrayLite.reduce(results, combine_list, empty),
// DeclareEnclaveStatement: (kind, identifier, result) => check_not_assignment(result),
// // Statement >> Compound //
// BranchStatement: (result) => result,
// IfStatement: (result1, result2, result3) => combine(
//   check_not_assignment(result1),
//   combine(result2, result3)),
// WhileStatement: (result1, result2) => combine(
//   check_not_assignment(result1),
//   result2),
// TryStatement: (result1, result2, result3) => combine(
//   result1,
//   combine(result2, result3)),
// 
// // Expression >> Consumer //
// AwaitExpression: (result) => combine(
//   check_not_assignment(result),
//   {
//     __proto__: empty,
//     await: true}),
// YieldExpression: (delegate, result) => combine(
//   check_not_assignment(result),
//   {
//     __proto__: empty,
//     yield: true}),
// ExportExpression: (specifier, result) => (
//   Throw.assert(specifier !== null, null, `Export specifier cannot be null`),
//   combine(
//     check_not_assignment(result),
//     {
//       __proto__: empty,
//       assignment: true,
//       links: [
//         {
//           __proto__: null,
//           type: "export",
//           specifier}]})),
// WriteExpression: (identifier, result) => combine(
//   check_not_assignment(result),
//   {
//     __proto__: empty,
//     assignment: true,
//     variables: [identifier]}),
// WriteEnclaveExpression: (strict, identifier, result) => combine(
//   check_not_assignment(result),
//   {
//     __proto__: empty,
//     assignment: true}),
// SequenceExpression: (result1, result2) => combine(result1, result2),
// ConditionalExpression: (result1, result2, result3) => combine(
//   check_not_assignment(result1),
//   combine(result2, result3)),
// ThrowExpression: (result) => check_not_assignment(result),
// // Expression >> Combiner //
// MemberSuperEnclaveExpression: (result) => check_not_assignment(result),
// CallSuperEnclaveExpression: (result) => check_not_assignment(result),
// EvalExpression: (result) => check_not_assignment(result),
// RequireExpression: (result) => check_not_assignment(result),
// ApplyExpression: (result1, result2, results) => check_not_assignment(
//   combine(
//     result1,
//     combine(
//       result2,
//       ArrayLite.reduce(results, combine, empty)))),
// ConstructExpression: (result, results) => check_not_assignment(
//   combine(
//     result,
//     ArrayLite.reduce(results, combine, empty))),
// UnaryExpression: (operator, result) => check_not_assignment(result),
// BinaryExpression: (operator, result1, result2) => check_not_assignment(
//   combine(result1, result2)),
// ObjectExpression: (result, resultss) => check_not_assignment(
//   combine(
//     result,
//     ArrayLite.reduce(
//       ArrayLite.map(resultss, combine_property),
//       combine,
//       empty)))}; }) ());

// // check_completion //
// Tree.Block(
//   ["x", "y"],
//   Tree.ListStatement(
//     [
//       Tree.BreakStatement("k"),
//       Tree.ListStatement(
//         [
//           Tree.BreakStatement("l"),
//           Tree.BreakStatement("m"),
//           Tree.ListStatement([])]),
//       Tree.ListStatement(
//         [
//           Tree.BreakStatement("n"),
//           Tree.CompletionStatement(
//             Tree.PrimitiveExpression(123))])]));
// // Wrong number of fields //
// Assert.throws(
//   () => Tree.DebuggerStatement("foo"),
//   new global.Error(`Wrong number of fields for DebuggerStatement: expected [], got: ["foo"]`));
// // Invalid node of predicate-based type //
// Tree.PrimitiveExpression(123);
// Tree.IntrinsicExpression("foo");
// Assert.throws(
//   () => Tree.PrimitiveExpression({__proto__:null}),
//   new global.Error(`Invalid atomic node: expected a Primitive, got [object Object]`));
// Assert.throws(
//   () => Tree.IntrinsicExpression(123),
//   new global.Error(`Invalid atomic node: expected a Intrinsic, got 123`));
// // Invalid node of enumeration-based type //
// Tree.UnaryExpression(
//   "!",
//   Tree.PrimitiveExpression(123));
// Assert.throws(
//   () => Tree.UnaryExpression(
//     "foo",
//     Tree.PrimitiveExpression(123)),
//   new global.Error(`Invalid atomic node: expected a UnaryOperator, got "foo"`));
// // Droppable Expression //
// Tree.SequenceExpression(
//   Tree.WriteExpression(
//     "x",
//     Tree.PrimitiveExpression(123)),
//   Tree.PrimitiveExpression(456));
// Tree.ExpressionStatement(
//   Tree.WriteExpression(
//     "x",
//     Tree.PrimitiveExpression(123)));
// Assert.throws(
//   () => Tree.UnaryExpression(
//     "!",
//     Tree.WriteExpression(
//       "x",
//       Tree.PrimitiveExpression(123))),
//   new global.Error(`Assignment expression should be directly dropped`));
// // Invalid node of identity-based type //
// Tree.UnaryExpression(
//   "!",
//   Tree.PrimitiveExpression(123));
// Assert.throws(
//   () => Tree.UnaryExpression("!", []),
//   new global.Error(`Invalid compound node: expected a Expression, got [object Array]`));
// // List Node & Tuple Node //
// Tree.ObjectExpression(
//   Tree.PrimitiveExpression(null),
//   [
//     [
//       Tree.PrimitiveExpression("foo"),
//       Tree.PrimitiveExpression(123)],
//     [
//       Tree.PrimitiveExpression("bar"),
//       Tree.PrimitiveExpression(456)]]);
// Assert.throws(
//   () => Tree.ObjectExpression(
//     Tree.PrimitiveExpression(null),
//     [
//       [
//         Tree.PrimitiveExpression("foo"),
//         Tree.PrimitiveExpression(123),
//       Tree.PrimitiveExpression("bar")]]),
//   new global.Error(`Length mismatch in array node: expected ["Expression","Expression"], got [[object Array],[object Array],[object Array]]`));
// Assert.throws(
//   () => Tree.ObjectExpression(
//     Tree.PrimitiveExpression(null),
//     [
//       [
//         Tree.PrimitiveExpression("foo"),
//         Tree.PrimitiveExpression(123)],
//       {
//         __proto__: null,
//         0: Tree.PrimitiveExpression("bar"),
//         1: Tree.PrimitiveExpression(456)}]),
//   new global.Error(`Invalid array node: expected a ["Expression","Expression"], got [object Object]`));
// // Block //
// Tree.BranchStatement(
//   Tree.Branch(
//     [],
//     Tree.Block(
//       [],
//       Tree.CompletionStatement(
//         Tree.PrimitiveExpression(123)))));
// // Immutable //
// Assert.throws(
//   () => Reflect.defineProperty(
//     Tree.PrimitiveExpression(123),
//     0,
//     {__proto__:null, value:"foo"}),
//   new global.Error("defineProperty on immutable node"));
// Assert.throws(
//   () => Reflect.setPrototypeOf(
//     Tree.PrimitiveExpression(123), null),
//   new global.Error("setPrototypeOf on immutable node"));

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

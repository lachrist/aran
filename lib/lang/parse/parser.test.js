"use strict";

const Parser = require("./parser.js");
const Assert = require("assert").strict;
const Tree = require("../../tree.js");

////////////////////////
// Label & Identifier //
////////////////////////

["Label", "Identifier"].forEach((rule) => {
  Assert.deepEqual(Parser.parse("foo", {startRule:rule}), "foo");
  // Assert.deepEqual(Parser.parse("\\u0066\\u006f\\u006f", {startRule:rule}), "foo");
  // Assert.deepEqual(Parser.parse("\\u{66}\\u{6f}\\u{6f}", {startRule:rule}), "foo");
  Assert.throws(() => Parser.parse("0foo", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("\\u{30}foo", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("\\u0030foo", {startRule:rule}), Parser.SyntaxError);
  Assert.deepEqual(Parser.parse("foo0", {startRule:rule}), "foo0");
  // Assert.deepEqual(Parser.parse("foo\\u{30}", {startRule:rule}), "foo0");
  // Assert.deepEqual(Parser.parse("foo\\u0030", {startRule:rule}), "foo0");
  Assert.throws(() => Parser.parse("debugger", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("eval", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("method", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("constructor", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("this", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("new.target", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("imort.meta", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("arguments", {startRule:rule}), Parser.SyntaxError);
});

// Assert.throws(() => Parser.parse("this", {startRule:"Label"}), Parser.SyntaxError);
// Assert.throws(() => Parser.parse("this", {startRule:"Declarable"}), Parser.SyntaxError);
// Assert.deepEqual(Parser.parse("this", {startRule:"Identifier"}), "this");
//
// Assert.throws(() => Parser.parse("new.target", {startRule:"Label"}), Parser.SyntaxError);
// Assert.throws(() => Parser.parse("new.target", {startRule:"Declarable"}), Parser.SyntaxError);
// Assert.deepEqual(Parser.parse("new.target", {startRule:"Identifier"}), "new.target");
//
// Assert.throws(() => Parser.parse("imort.meta", {startRule:"Label"}), Parser.SyntaxError);
// Assert.throws(() => Parser.parse("import.meta", {startRule:"Declarable"}), Parser.SyntaxError);
// Assert.deepEqual(Parser.parse("import.meta", {startRule:"Identifier"}), "import.meta");
//
// Assert.deepEqual(Parser.parse("arguments", {startRule:"Label"}), "arguments");
// Assert.throws(() => Parser.parse("arguments", {startRule:"Declarable"}), Parser.SyntaxError);
// Assert.deepEqual(Parser.parse("arguments", {startRule:"Identifier"}), "arguments");
//
// Assert.deepEqual(Parser.parse("callee", {startRule:"Label"}), "callee");
// Assert.throws(() => Parser.parse("callee", {startRule:"Declarable"}), Parser.SyntaxError);
// Assert.deepEqual(Parser.parse("callee", {startRule:"Identifier"}), "callee");
//
// Assert.deepEqual(Parser.parse("error", {startRule:"Label"}), "error");
// Assert.throws(() => Parser.parse("error", {startRule:"Declarable"}), Parser.SyntaxError);
// Assert.deepEqual(Parser.parse("error", {startRule:"Identifier"}), "error");

////////////
// Number //
////////////

// Integer //
Assert.deepEqual(Parser.parse("0", {startRule:"Number"}), 0);
Assert.deepEqual(Parser.parse("123", {startRule:"Number"}), 123);
Assert.deepEqual(Parser.parse("-123", {startRule:"Number"}), -123);
Assert.throws(() => Parser.parse("+123", {startRule:"Number"}), Parser.SyntaxError);
Assert.throws(() => Parser.parse("01", {startRule:"Number"}), Parser.SyntaxError);
// Fractional //
Assert.deepEqual(Parser.parse("123.456", {startRule:"Number"}), 123.456);
Assert.deepEqual(Parser.parse("-123.456", {startRule:"Number"}), -123.456);
Assert.throws(() => Parser.parse("123.", {startRule:"Number"}), Parser.SyntaxError);
// Exponent //
Assert.deepEqual(Parser.parse("123e2", {startRule:"Number"}), 123e2);
Assert.deepEqual(Parser.parse("123E2", {startRule:"Number"}), 123E2);
Assert.deepEqual(Parser.parse("123e-2", {startRule:"Number"}), 123e-2);
Assert.deepEqual(Parser.parse("123e+2", {startRule:"Number"}), 123e+2);
Assert.throws(() => Parser.parse("123e", {startRule:"Number"}), Parser.SyntaxError);

////////////
// BigInt //
////////////

Assert.deepEqual(Parser.parse("0n", {startRule:"BigInt"}), 0n);
Assert.deepEqual(Parser.parse("0000n", {startRule:"BigInt"}), 0n);
Assert.deepEqual(Parser.parse("123n", {startRule:"BigInt"}), 123n);

////////////
// String //
////////////

Assert.deepEqual(Parser.parse("\"foo\"", {startRule:"String"}), "foo");
Assert.deepEqual(Parser.parse("\"\\u0066\\u006f\\u006f\"", {startRule:"String"}), "foo");
Assert.throws(() => Parser.parse("\"\\u{66}\\u{6f}\\u{6f}\"", {startRule:"String"}), Parser.SyntaxError);

///////////
// Blank //
///////////

Assert.doesNotThrow(() => Parser.parse(" \n\t // yo \n \n\t /* yo */ \n\t", {startRule:"_"}));

////////////////
// Expression //
////////////////

// Primitive //
Assert.deepEqual(
  Parser.parse(
    " void 0 ", {startRule:"StartExpression"}),
    Tree.PrimitiveExpression(void 0));
Assert.deepEqual(
  Parser.parse(
    " null ", {startRule:"StartExpression"}),
    Tree.PrimitiveExpression(null));
Assert.deepEqual(
  Parser.parse(
    " null0 ", {startRule:"StartExpression"}),
    Tree.ReadExpression("null0"));
Assert.deepEqual(
  Parser.parse(
    " true ", {startRule:"StartExpression"}),
    Tree.PrimitiveExpression(true));
Assert.deepEqual(
  Parser.parse(
    " true0 ", {startRule:"StartExpression"}),
    Tree.ReadExpression("true0"));
Assert.deepEqual(
  Parser.parse(
    " false ", {startRule:"StartExpression"}),
    Tree.PrimitiveExpression(false));
Assert.deepEqual(
  Parser.parse(
    " false0 ", {startRule:"StartExpression"}),
    Tree.ReadExpression("false0"));
Assert.deepEqual(
  Parser.parse(
    " 123 ", {startRule:"StartExpression"}),
    Tree.PrimitiveExpression(123));
Assert.deepEqual(
  Parser.parse(
    " \"foo\" ",
    {startRule:"StartExpression"}),
  Tree.PrimitiveExpression("foo"));
// Intrinsic //
Assert.deepEqual(
  Parser.parse(
    " # \"foo\" ",
    {startRule:"StartExpression"}),
  Tree.IntrinsicExpression("foo"));
Assert.deepEqual(
  Parser.parse(
    " # foo . bar ",
    {startRule:"StartExpression"}),
  Tree.IntrinsicExpression("foo.bar"));
// Closure //
["arrow", "function", "method", "constructor"].forEach((sort) => {
  Assert.deepEqual(
    Parser.parse(
      ` ${sort} ( ) { let x ; completion 123 ; } `,
      {startRule:"StartExpression"}),
    Tree.ClosureExpression(
      sort,
      false,
      false,
      Tree.Block(
        ["x"],
        [],
        Tree.PrimitiveExpression(123))));
  Assert.deepEqual(
    Parser.parse(
      ` async ${sort} ( ) { let x ; completion 123 ; } `,
      {startRule:"StartExpression"}),
    Tree.ClosureExpression(
      sort,
      true,
      false,
      Tree.Block(
        ["x"],
        [],
        Tree.PrimitiveExpression(123))));
  Assert.deepEqual(
    Parser.parse(
      ` ${sort} * ( ) { let x ; completion 123 ; } `,
      {startRule:"StartExpression"}),
    Tree.ClosureExpression(
      sort,
      false,
      true,
      Tree.Block(
        ["x"],
        [],
        Tree.PrimitiveExpression(123))));
  Assert.deepEqual(
    Parser.parse(
      ` async ${sort} * ( ) { let x ; completion 123 ; } `,
      {startRule:"StartExpression"}),
    Tree.ClosureExpression(
      sort,
      true,
      true,
      Tree.Block(
        ["x"],
        [],
        Tree.PrimitiveExpression(123)))); });
// Import //
Assert.deepEqual(
  Parser.parse(
    " import var from \"source\" ",
    {startRule:"StartExpression"}),
  Tree.ImportExpression("var", "source"));
Assert.deepEqual(
  Parser.parse(
    " import * from \"source\" ",
    {startRule:"StartExpression"}),
  Tree.ImportExpression(null, "source"));
// Read //
Assert.deepEqual(
  Parser.parse(
    " foo ",
    {startRule:"StartExpression"}),
  Tree.ReadExpression("foo"));
// Export //
Assert.deepEqual(
  Parser.parse(
    " export var 123 ",
    {startRule:"StartExpression"}),
  Tree.ExportExpression(
    "var",
    Tree.PrimitiveExpression(123)));
// Write //
Assert.deepEqual(
  Parser.parse(
    " foo = 123 ",
    {startRule:"StartExpression"}),
  Tree.WriteExpression(
    "foo",
    Tree.PrimitiveExpression(123)));
// Enclave - Read //
Assert.deepEqual(
  Parser.parse(
    " enclave foo ",
    {startRule:"StartExpression"}),
  Tree.ReadEnclaveExpression("foo"));
// Enclave - Write //
Assert.deepEqual(
  Parser.parse(
    " enclave foo != 123 ",
    {startRule:"StartExpression"}),
  Tree.WriteEnclaveExpression(
    true,
    "foo",
    Tree.PrimitiveExpression(123)));
Assert.deepEqual(
  Parser.parse(
    " enclave foo ?= 123 ",
    {startRule:"StartExpression"}),
  Tree.WriteEnclaveExpression(
    false,
    "foo",
    Tree.PrimitiveExpression(123)));
// Enclave - SuperCall //
Assert.deepEqual(
  Parser.parse(
    " enclave super ( ... 123 ) ",
    {startRule:"StartExpression"}),
  Tree.SuperCallEnclaveExpression(
    Tree.PrimitiveExpression(123)));
// Enclave - SuperMember //
Assert.deepEqual(
  Parser.parse(
    " enclave super [ 123 ] ",
    {startRule:"StartExpression"}),
  Tree.SuperMemberEnclaveExpression(
    Tree.PrimitiveExpression(123)));

// Sequence //
Assert.deepEqual(
  Parser.parse(
    " ( 123 , 456 ) ",
    {startRule:"StartExpression"}),
  Tree.SequenceExpression(
    Tree.PrimitiveExpression(123),
    Tree.PrimitiveExpression(456)));
// Conditional //
Assert.deepEqual(
  Parser.parse(
    " ( 123 ? 456 : 789 ) ",
    {startRule:"StartExpression"}),
  Tree.ConditionalExpression(
    Tree.PrimitiveExpression(123),
    Tree.PrimitiveExpression(456),
    Tree.PrimitiveExpression(789)));
// Throw //
Assert.deepEqual(
  Parser.parse(
    " throw 123 ",
    {startRule:"StartExpression"}),
  Tree.ThrowExpression(
    Tree.PrimitiveExpression(123)));
Assert.deepEqual(
  Parser.parse(
    " throw0 ",
    {startRule:"StartExpression"}),
  Tree.ReadExpression("throw0"));
// Eval //
Assert.deepEqual(
  Parser.parse(
    " eval 123 ",
    {startRule:"StartExpression"}),
  Tree.EvalExpression(
    Tree.PrimitiveExpression(123)));
// Require //
Assert.deepEqual(
  Parser.parse(
    " require 123 ",
    {startRule:"StartExpression"}),
  Tree.RequireExpression(
    Tree.PrimitiveExpression(123)));
// Await //
Assert.deepEqual(
  Parser.parse(
    " await 123 ",
    {startRule:"StartExpression"}),
  Tree.AwaitExpression(
    Tree.PrimitiveExpression(123)));
// Yield //
Assert.deepEqual(
  Parser.parse(
    " yield * 123 ",
    {startRule:"StartExpression"}),
  Tree.YieldExpression(true, Tree.PrimitiveExpression(123)));
Assert.deepEqual(
  Parser.parse(
    " yield 123 ",
    {startRule:"StartExpression"}),
  Tree.YieldExpression(
    false,
    Tree.PrimitiveExpression(123)));
// Unary //
Assert.deepEqual(
  Parser.parse(
    " ! 123 ",
    {startRule:"StartExpression"}),
  Tree.UnaryExpression(
    "!",
    Tree.PrimitiveExpression(123)));
// Binary //
Assert.deepEqual(
  Parser.parse(
    " ( 123 * ( 456 + 789 ) ) ",
    {startRule:"StartExpression"}),
  Tree.BinaryExpression(
    "*",
    Tree.PrimitiveExpression(123),
    Tree.BinaryExpression(
      "+",
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789))));
// Construct //
Assert.deepEqual(
  Parser.parse(
    " new  123 ( ) ",
    {startRule:"StartExpression"}),
  Tree.ConstructExpression(
    Tree.PrimitiveExpression(123),
    []));
Assert.deepEqual(
  Parser.parse(
    " new  123 ( 456 , 789 ) ",
    {startRule:"StartExpression"}),
  Tree.ConstructExpression(
    Tree.PrimitiveExpression(123),
    [
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)]));
// Object //
Assert.deepEqual(
  Parser.parse(
    " { __proto__ : 12 , [ \"foo\" ] : 34 , bar : 56, \"qux\": 78 } ",
    {startRule:"StartExpression"}),
  Tree.ObjectExpression(
    Tree.PrimitiveExpression(12),
    [
      [
        Tree.PrimitiveExpression("foo"),
        Tree.PrimitiveExpression(34)],
      [
        Tree.PrimitiveExpression("bar"),
        Tree.PrimitiveExpression(56)],
      [
        Tree.PrimitiveExpression("qux"),
        Tree.PrimitiveExpression(78)]]));
// Apply //
Assert.deepEqual(
  Parser.parse(
    " 123 ( ) ",
    {startRule:"StartExpression"}),
  Tree.ApplyExpression(
    Tree.PrimitiveExpression(123),
    Tree.PrimitiveExpression(undefined),
    []));
Assert.deepEqual(
  Parser.parse(
    " 123 ( @ 456 , 789 ) ",
    {startRule:"StartExpression"}),
  Tree.ApplyExpression(
    Tree.PrimitiveExpression(123),
    Tree.PrimitiveExpression(456),
    [
      Tree.PrimitiveExpression(789)]));
Assert.deepEqual(
  Parser.parse(
    " 123 ( 456 , 789 ) ",
    {startRule:"StartExpression"}),
  Tree.ApplyExpression(
    Tree.PrimitiveExpression(123),
    Tree.PrimitiveExpression(undefined),
    [
      Tree.PrimitiveExpression(456),
      Tree.PrimitiveExpression(789)]));
Assert.deepEqual(
  Parser.parse(
    " 123 ( 456 ) ( 789 ) ",
    {startRule:"StartExpression"}),
  Tree.ApplyExpression(
    Tree.ApplyExpression(
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(undefined),
      [
        Tree.PrimitiveExpression(456)]),
    Tree.PrimitiveExpression(undefined),
    [
      Tree.PrimitiveExpression(789)]));
// Parenthesis //
Assert.deepEqual(
  Parser.parse(
    " ( 123 ) ",
    {startRule:"StartExpression"}),
  Tree.PrimitiveExpression(123));

///////////////
// Statement //
///////////////

// ExpressionStatement //
Assert.deepEqual(
  Parser.parse(
    " 123 ; ",
    {startRule:"StartStatement"}),
  Tree.ExpressionStatement(
    Tree.PrimitiveExpression(123)));
// Return //
Assert.deepEqual(
  Parser.parse(
    " return 123 ; ",
    {startRule:"StartStatement"}),
  Tree.ReturnStatement(
    Tree.PrimitiveExpression(123)));
Assert.deepEqual(
  Parser.parse(
    " return123 ; ",
    {startRule:"StartStatement"}),
  Tree.ExpressionStatement(
    Tree.ReadExpression("return123")));
// Break //
Assert.deepEqual(
  Parser.parse(
    " break foo ; ",
    {startRule:"StartStatement"}),
  Tree.BreakStatement("foo"));
Assert.deepEqual(
  Parser.parse(
    " breakfoo ; ",
    {startRule:"StartStatement"}),
  Tree.ExpressionStatement(
    Tree.ReadExpression("breakfoo")));
// Debugger //
Assert.deepEqual(
  Parser.parse(
    " debugger ; ",
    {startRule:"StartStatement"}),
  Tree.DebuggerStatement());
// Lone //
Assert.deepEqual(
  Parser.parse(
    " l : { let x ; completion 123 ; } ",
    {startRule:"StartStatement"}),
  Tree.BlockStatement(
    Tree.LabelBlock(
      ["l"],
      Tree.Block(
        ["x"],
        [],
        Tree.PrimitiveExpression(123)))));
Assert.deepEqual(
  Parser.parse(
    " { __proto__ : 123 } ; ",
    {startRule:"StartStatement"}),
  Tree.ExpressionStatement(
    Tree.ObjectExpression(
      Tree.PrimitiveExpression(123),
      [])));
// If //
Assert.deepEqual(
  Parser.parse(
    " if ( 123 ) l : { let x ; completion 456 ; } else m : { let y ; completion 789 ; } ",
    {startRule:"StartStatement"}),
  Tree.IfStatement(
    Tree.PrimitiveExpression(123),
    Tree.LabelBlock(
      ["l"],
      Tree.Block(
        ["x"],
        [],
        Tree.PrimitiveExpression(456))),
    Tree.LabelBlock(
      ["m"],
      Tree.Block(
        ["y"],
        [],
        Tree.PrimitiveExpression(789)))));
// While //
Assert.deepEqual(
  Parser.parse(
    " while ( 123 ) l : { let x ; completion 456 ; } ",
    {startRule:"StartStatement"}),
  Tree.WhileStatement(
    Tree.PrimitiveExpression(123),
    Tree.LabelBlock(
      ["l"],
      Tree.Block(
        ["x"],
        [],
        Tree.PrimitiveExpression(456)))));
// Try //
Assert.deepEqual(
  Parser.parse(
    " try l : { let x ; completion 123 ; } catch m : { let y ; completion 456 ; } finally n : { let z ; completion 789 ; } ",
    {startRule:"StartStatement"}),
  Tree.TryStatement(
    Tree.LabelBlock(
      ["l"],
      Tree.Block(
        ["x"],
        [],
        Tree.PrimitiveExpression(123))),
    Tree.LabelBlock(
      ["m"],
      Tree.Block(
        ["y"],
        [],
        Tree.PrimitiveExpression(456))),
    Tree.LabelBlock(
      ["n"],
      Tree.Block(
        ["z"],
        [],
        Tree.PrimitiveExpression(789)))));
// Bundle //
Assert.deepEqual(
  Parser.parse(
    " 123 ; 456 ; ",
    {startRule:"StartStatement"}),
  Tree.BundleStatement(
    [
      Tree.ExpressionStatement(
        Tree.PrimitiveExpression(123)),
      Tree.ExpressionStatement(
        Tree.PrimitiveExpression(456))]));
Assert.deepEqual(
  Parser.parse(
    " ",
    {startRule:"StartStatement"}),
  Tree.BundleStatement([]));
// EnclaveDeclare //
Assert.deepEqual(
  Parser.parse(
    " enclave var x = 123 ; ",
    {startRule:"StartStatement"}),
  Tree.DeclareEnclaveStatement(
    "var",
    "x",
    Tree.PrimitiveExpression(123)));

///////////
// Block //
///////////

Assert.deepEqual(
  Parser.parse(
    " { let x , y ; 123 ; 456 ; completion 789 ; } ",
    {startRule:"StartBlock"}),
  Tree.Block(
    ["x", "y"],
    [
      Tree.ExpressionStatement(
        Tree.PrimitiveExpression(123)),
      Tree.ExpressionStatement(
        Tree.PrimitiveExpression(456))],
    Tree.PrimitiveExpression(789)));
Assert.deepEqual(
  Parser.parse(
    " { 123 ; 456 ; completion 789 ; } ",
    {startRule:"StartBlock"}),
  Tree.Block(
    [],
    [
      Tree.ExpressionStatement(
        Tree.PrimitiveExpression(123)),
      Tree.ExpressionStatement(
        Tree.PrimitiveExpression(456))],
    Tree.PrimitiveExpression(789)));

//////////
// Link //
//////////

// Import //
Assert.deepEqual(
  Parser.parse(
    " import function from \"source\" ; ",
    {startRule:"StartLink"}),
  Tree.ImportLink("function", "source"));
Assert.deepEqual(
  Parser.parse(
    " import * from \"source\" ; ",
    {startRule:"StartLink"}),
  Tree.ImportLink(null, "source"));
// Export //
Assert.deepEqual(
  Parser.parse(
    " export function ; ",
    {startRule:"StartLink"}),
  Tree.ExportLink("function"));
// Aggregate //
Assert.deepEqual(
  Parser.parse(
    " aggregate * from \"source\" ; ",
    {startRule:"StartLink"}),
  Tree.AggregateLink(null, "source", null));
Assert.deepEqual(
  Parser.parse(
    " aggregate function from \"source\" as var ; ",
    {startRule:"StartLink"}),
  Tree.AggregateLink("function", "source", "var"));

/////////////
// Program //
/////////////

Assert.deepEqual(
  Parser.parse(
    `
      export function ;
      export var ;
      {
        let x ;
        123 ;
        completion 456 ; }`,
    {startRule:"StartProgram"}),
  Tree.Program(
    [
      Tree.ExportLink("function"),
      Tree.ExportLink("var")],
    Tree.Block(
      ["x"],
      [
        Tree.ExpressionStatement(
          Tree.PrimitiveExpression(123))],
      Tree.PrimitiveExpression(456))));

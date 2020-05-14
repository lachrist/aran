"use strict";

const Parser = require("./parser.js");
const Assert = require("assert").strict;

////////////////////////
// Label & Identifier //
////////////////////////

["Label", "Identifier"].forEach((rule) => {
  Assert.deepEqual(Parser.parse("foo", {startRule:rule}), "foo");
  Assert.deepEqual(Parser.parse("\\u0066\\u006f\\u006f", {startRule:rule}), "foo");
  Assert.deepEqual(Parser.parse("\\u{66}\\u{6f}\\u{6f}", {startRule:rule}), "foo");
  Assert.throws(() => Parser.parse("0foo", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("\\u{30}foo", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("\\u0030foo", {startRule:rule}), Parser.SyntaxError);
  Assert.deepEqual(Parser.parse("foo0", {startRule:rule}), "foo0");
  Assert.deepEqual(Parser.parse("foo\\u{30}", {startRule:rule}), "foo0");
  Assert.deepEqual(Parser.parse("foo\\u0030", {startRule:rule}), "foo0");
  if (rule === "Label") { 
    Assert.deepEqual(Parser.parse("eval", {startRule:"Label"}), "eval");
  } else {
    Assert.throws(() => Parser.parse("eval", {startRule:"Identifier"}), Parser.SyntaxError);
  }
});

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
Assert.deepEqual(Parser.parse(" void 0 ", {startRule:"StartExpression"}), ["primitive", void 0]);
Assert.deepEqual(Parser.parse(" null ", {startRule:"StartExpression"}), ["primitive", null]);
Assert.deepEqual(Parser.parse(" null0 ", {startRule:"StartExpression"}), ["read", "null0"]);
Assert.deepEqual(Parser.parse(" true ", {startRule:"StartExpression"}), ["primitive", true]);
Assert.deepEqual(Parser.parse(" true0 ", {startRule:"StartExpression"}), ["read", "true0"]);
Assert.deepEqual(Parser.parse(" false ", {startRule:"StartExpression"}), ["primitive", false]);
Assert.deepEqual(Parser.parse(" false0 ", {startRule:"StartExpression"}), ["read", "false0"]);
Assert.deepEqual(Parser.parse(" 123 ", {startRule:"StartExpression"}), ["primitive", 123]);
Assert.deepEqual(Parser.parse(" \"foo\" ", {startRule:"StartExpression"}), ["primitive", "foo"]);
// Builtin //
Assert.deepEqual(Parser.parse(" # \"foo\" ", {startRule:"StartExpression"}), ["builtin", "foo"]);
Assert.deepEqual(Parser.parse(" # foo . bar ", {startRule:"StartExpression"}), ["builtin", "foo.bar"]);
// Arrow //
Assert.deepEqual(Parser.parse(" ( ) => { } ", {startRule:"StartExpression"}), ["arrow", ["BLOCK", [], []]]);
// Function //
Assert.deepEqual(Parser.parse(" function ( ) { } ", {startRule:"StartExpression"}), ["function", ["BLOCK", [], []]]);
// Read //
Assert.deepEqual(Parser.parse(" foo ", {startRule:"StartExpression"}), ["read", "foo"]);
// Write //
Assert.deepEqual(Parser.parse(" ( foo = 123 ) ", {startRule:"StartExpression"}), ["write", "foo", ["primitive", 123]]);
// Sequence //
Assert.deepEqual(Parser.parse(" ( 123 , 456 ) ", {startRule:"StartExpression"}), ["sequence", ["primitive", 123], ["primitive", 456]]);
// Conditional //
Assert.deepEqual(Parser.parse(" ( 123 ? 456 : 789 ) ", {startRule:"StartExpression"}), ["conditional", ["primitive", 123], ["primitive", 456], ["primitive", 789]]);
// Throw //
Assert.deepEqual(Parser.parse(" throw 123 ", {startRule:"StartExpression"}), ["throw", ["primitive", 123]]);
Assert.deepEqual(Parser.parse(" throw0 ", {startRule:"StartExpression"}), ["read", "throw0"]);
// Eval //
Assert.deepEqual(Parser.parse(" eval ( 123 ) ", {startRule:"StartExpression"}), ["eval", [], ["primitive", 123]]);
Assert.deepEqual(Parser.parse(" eval ( 123 , § foo , § bar ) ", {startRule:"StartExpression"}), ["eval", ["foo", "bar"], ["primitive", 123]]);
// Unary //
Assert.deepEqual(Parser.parse(" ! 123 ", {startRule:"StartExpression"}), ["unary", "!", ["primitive", 123]]);
// Binary //
Assert.deepEqual(Parser.parse(" 123 * 456 + 789 ", {startRule:"StartExpression"}), ["binary", "*", ["primitive", 123], ["binary", "+", ["primitive", 456], ["primitive", 789]]]);
// Construct //
Assert.deepEqual(Parser.parse(" new  123 ( ) ", {startRule:"StartExpression"}), ["construct", ["primitive", 123], []]);
Assert.deepEqual(Parser.parse(" new  123 ( 456 , 789 ) ", {startRule:"StartExpression"}), ["construct", ["primitive", 123], [["primitive", 456], ["primitive", 789]]]);
// Object //
Assert.deepEqual(Parser.parse(" { __proto__ : 123 , [ \"foo\" ] : 456 , bar : 789 } ", {startRule:"StartExpression"}), ["object", ["primitive", 123], [[["primitive", "foo"], ["primitive", 456]], [["primitive", "bar"], ["primitive", 789]]]]);
// Apply //
Assert.deepEqual(Parser.parse(" 123 ( ) ", {startRule:"StartExpression"}), ["apply", ["primitive", 123], ["primitive", undefined], []]);
Assert.deepEqual(Parser.parse(" 123 ( @ 456 , 789 ) ", {startRule:"StartExpression"}), ["apply", ["primitive", 123], ["primitive", 456], [["primitive", 789]]]);
Assert.deepEqual(Parser.parse(" 123 ( 456 , 789 ) ", {startRule:"StartExpression"}), ["apply", ["primitive", 123], ["primitive", undefined], [["primitive", 456], ["primitive", 789]]]);
Assert.deepEqual(Parser.parse(" 123 ( 456 ) ( 789 ) ", {startRule:"StartExpression"}), ["apply", ["apply", ["primitive", 123], ["primitive", undefined], [["primitive", 456]]], ["primitive", undefined], [["primitive", 789]]]);
// Parenthesis //
Assert.deepEqual(Parser.parse(" ( 123 ) ", {startRule:"StartExpression"}), ["primitive", 123]);

///////////////
// Statement //
///////////////

// Lift //
Assert.deepEqual(Parser.parse(" 123 ; ", {startRule:"StartStatement"}), [["Lift", ["primitive", 123]]]);
// Return //
Assert.deepEqual(Parser.parse(" return 123 ; ", {startRule:"StartStatement"}), [["Return", ["primitive", 123]]]);
Assert.deepEqual(Parser.parse(" return123 ; ", {startRule:"StartStatement"}), [["Lift", ["read", "return123"]]]);
// Break //
Assert.deepEqual(Parser.parse(" break foo ; ", {startRule:"StartStatement"}), [["Break", "foo"]]);
Assert.deepEqual(Parser.parse(" breakfoo ; ", {startRule:"StartStatement"}), [["Lift", ["read", "breakfoo"]]]);
// Continue //
Assert.deepEqual(Parser.parse(" continue foo ; ", {startRule:"StartStatement"}), [["Continue", "foo"]]);
Assert.deepEqual(Parser.parse(" continuefoo ; ", {startRule:"StartStatement"}), [["Lift", ["read", "continuefoo"]]]);
// Debugger //
Assert.deepEqual(Parser.parse("  debugger ; ", {startRule:"StartStatement"}), [["Debugger"]]);
// Lone //
Assert.deepEqual(Parser.parse(" foo : bar : { let x ; } ", {startRule:"StartStatement"}), [["Lone", ["foo", "bar"], ["BLOCK", ["x"], []]]]);
Assert.deepEqual(Parser.parse(" { __proto__ : 123 } ; ", {startRule:"StartStatement"}), [["Lift", ["object", ["primitive", 123], []]]]);
// If //
Assert.deepEqual(Parser.parse(" foo : bar : if ( 123 ) { let x ; } else { let y ; } ", {startRule:"StartStatement"}), [["If", ["foo", "bar"], ["primitive", 123], ["BLOCK", ["x"], []], ["BLOCK", ["y"], []]]]);
// While //
Assert.deepEqual(Parser.parse(" foo : bar : while ( 123 ) { let x ; } ", {startRule:"StartStatement"}), [["While", ["foo", "bar"], ["primitive", 123], ["BLOCK", ["x"], []]]]);
// Try //
Assert.deepEqual(Parser.parse(" foo : bar : try { let x ; } catch { let y ; } finally { let z ; } ", {startRule:"StartStatement"}), [["Try", ["foo", "bar"], ["BLOCK", ["x"], []], ["BLOCK", ["y"], []], ["BLOCK", ["z"], []]]]);

///////////
// Block //
///////////

Assert.deepEqual(Parser.parse("{ let x , y ; 123 ; 456 ; } ", {startRule:"StartBlock"}), ["BLOCK", ["x", "y"], [["Lift", ["primitive", 123]], ["Lift", ["primitive", 456]]]]);
Assert.deepEqual(Parser.parse("{ 123 ; 456 ; } ", {startRule:"StartBlock"}), ["BLOCK", [], [["Lift", ["primitive", 123]], ["Lift", ["primitive", 456]]]]);

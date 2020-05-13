
// pegjs --trace --allowed-start-rules Label,Identifier,String,Number,Block,Statement,Expression parser.pegjs

const Parser = require("./aran.js");
const Assert = require("assert").strict;

Assert.deepEqual(Parser.parse(" new  123 ( )", {startRule:"Expression"}), ["construct", ["primitive", 123], []]);

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

////////////////
// Expression //
////////////////

// Primitive //
Assert.deepEqual(Parser.parse("void 0", {startRule:"Expression"}), ["primitive", void 0]);
Assert.deepEqual(Parser.parse(" null", {startRule:"Expression"}), ["primitive", null]);
Assert.deepEqual(Parser.parse(" null0", {startRule:"Expression"}), ["read", "null0"]);
Assert.deepEqual(Parser.parse(" true", {startRule:"Expression"}), ["primitive", true]);
Assert.deepEqual(Parser.parse(" true0", {startRule:"Expression"}), ["read", "true0"]);
Assert.deepEqual(Parser.parse(" false", {startRule:"Expression"}), ["primitive", false]);
Assert.deepEqual(Parser.parse(" false0", {startRule:"Expression"}), ["read", "false0"]);
Assert.deepEqual(Parser.parse(" 123", {startRule:"Expression"}), ["primitive", 123]);
Assert.deepEqual(Parser.parse(" \"foo\"", {startRule:"Expression"}), ["primitive", "foo"]);
// Builtin //
Assert.deepEqual(Parser.parse(" # \"foo\"", {startRule:"Expression"}), ["builtin", "foo"]);
// Arrow //
Assert.deepEqual(Parser.parse(" ( ) => { }", {startRule:"Expression"}), ["arrow", ["BLOCK", [], []]]);
// Function //
Assert.deepEqual(Parser.parse(" function ( ) { }", {startRule:"Expression"}), ["function", ["BLOCK", [], []]]);
// Read //
Assert.deepEqual(Parser.parse(" foo", {startRule:"Expression"}), ["read", "foo"]);
// Write //
Assert.deepEqual(Parser.parse(" ( foo = 123 )", {startRule:"Expression"}), ["write", "foo", ["primitive", 123]]);
// Sequence //
Assert.deepEqual(Parser.parse(" ( 123 , 456 )", {startRule:"Expression"}), ["sequence", ["primitive", 123], ["primitive", 456]]);
// Conditional //
Assert.deepEqual(Parser.parse(" ( 123 ? 456 : 789 )", {startRule:"Expression"}), ["conditional", ["primitive", 123], ["primitive", 456], ["primitive", 789]]);
// Throw //
Assert.deepEqual(Parser.parse(" throw 123", {startRule:"Expression"}), ["throw", ["primitive", 123]]);
Assert.deepEqual(Parser.parse(" throw0", {startRule:"Expression"}), ["read", "throw0"]);
// Eval //
Assert.deepEqual(Parser.parse(" eval ( 123 )", {startRule:"Expression"}), ["eval", [], ["primitive", 123]]);

Assert.deepEqual(Parser.parse(" eval ( § foo , § bar , 123 )", {startRule:"Expression"}), ["eval", ["foo", "bar"], ["primitive", 123]]);
// Unary //
Assert.deepEqual(Parser.parse(" ! 123", {startRule:"Expression"}), ["unary", "!", ["primitive", 123]]);
// Binary //
Assert.deepEqual(Parser.parse(" ( 123 + 456 )", {startRule:"Expression"}), ["binary", "+", ["primitive", 123], ["primitive", 456]]);
// Construct //
Assert.deepEqual(Parser.parse(" new  123 ( )", {startRule:"Expression"}), ["construct", ["primitive", 123], []]);
Assert.deepEqual(Parser.parse(" new  123 ( 456 , 789 )", {startRule:"Expression"}), ["construct", ["primitive", 123], [["primitive", 456], ["primitive", 789]]]);
// Object //
Assert.deepEqual(Parser.parse(" { __proto__ : 123 , [ 456 ] : 789 }", {startRule:"Expression"}), ["object", ["primitive", 123], [[["primitive", 456], ["primitive", 789]]]]);
// Apply //
Assert.deepEqual(Parser.parse("  123 ( )", {startRule:"Expression"}), ["apply", ["primitive", 123], ["primitive", undefined], []]);
Assert.deepEqual(Parser.parse(" 123 ( @ 456 , 789 )", {startRule:"Expression"}), ["apply", ["primitive", 123], ["primitive", 456], [["primitive", 789]]]);
Assert.deepEqual(Parser.parse(" 123 ( 456 , 789 )", {startRule:"Expression"}), ["apply", ["primitive", 123], ["primitive", undefined], [["primitive", 456], ["primitive", 789]]]);

///////////////
// Statement //
///////////////

// Lift //
Assert.deepEqual(Parser.parse("  123 ;", {startRule:"Statement"}), ["Lift", ["primitive", 123]]);
// Return //
Assert.deepEqual(Parser.parse("  return 123 ;", {startRule:"Statement"}), ["Return", ["primitive", 123]]);
Assert.deepEqual(Parser.parse("  return123 ;", {startRule:"Statement"}), ["Lift", ["read", "return123"]]);
// Break //
Assert.deepEqual(Parser.parse("  break foo ;", {startRule:"Statement"}), ["Break", "foo"]);
Assert.deepEqual(Parser.parse("  breakfoo ;", {startRule:"Statement"}), ["Lift", ["read", "breakfoo"]]);
// Continue //
Assert.deepEqual(Parser.parse("  continue foo ;", {startRule:"Statement"}), ["Continue", "foo"]);
Assert.deepEqual(Parser.parse("  continuefoo ;", {startRule:"Statement"}), ["Lift", ["read", "continuefoo"]]);
// Debugger //
Assert.deepEqual(Parser.parse("  debugger ;", {startRule:"Statement"}), ["Debugger"]);
// Lone //
Assert.deepEqual(Parser.parse(" foo : bar : { let x ; }", {startRule:"Statement"}), ["Lone", ["foo", "bar"], ["BLOCK", ["x"], []]]);
Assert.deepEqual(Parser.parse("  { __proto__ : 123 } ;", {startRule:"Statement"}), ["Lift", ["object", ["primitive", 123], []]]);
// If //
Assert.deepEqual(Parser.parse(" foo : bar : if ( 123 ) { let x ; } else { let y ; }", {startRule:"Statement"}), ["If", ["foo", "bar"], ["primitive", 123], ["BLOCK", ["x"], []], ["BLOCK", ["y"], []]]);
// While //
Assert.deepEqual(Parser.parse(" foo : bar : while ( 123 ) { let x ; }", {startRule:"Statement"}), ["While", ["foo", "bar"], ["primitive", 123], ["BLOCK", ["x"], []]]);
// Try //
Assert.deepEqual(Parser.parse(" foo : bar : try { let x ; } catch { let y ; } finally { let z ; }", {startRule:"Statement"}), ["Try", ["foo", "bar"], ["BLOCK", ["x"], []], ["BLOCK", ["y"], []], ["BLOCK", ["z"], []]]);

///////////
// Block //
///////////

Assert.deepEqual(Parser.parse("{ let x , y ; 123 ; 456 ; }", {startRule:"Block"}), ["BLOCK", ["x", "y"], [["Lift", ["primitive", 123]], ["Lift", ["primitive", 456]]]]);
Assert.deepEqual(Parser.parse("{ 123 ; 456 ; }", {startRule:"Block"}), ["BLOCK", [], [["Lift", ["primitive", 123]], ["Lift", ["primitive", 456]]]]);

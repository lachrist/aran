"use strict";

const Parser = require("./parser.js");
const Assert = require("assert").strict;
const Tree = require("../../tree.js");

////////////////////////
// Label & Identifier //
////////////////////////

["Label", "Identifier", "Declarable"].forEach((rule) => {
  Assert.deepEqual(Parser.parse("foo", {startRule:rule}), "foo");
  Assert.deepEqual(Parser.parse("\\u0066\\u006f\\u006f", {startRule:rule}), "foo");
  Assert.deepEqual(Parser.parse("\\u{66}\\u{6f}\\u{6f}", {startRule:rule}), "foo");
  Assert.throws(() => Parser.parse("0foo", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("\\u{30}foo", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("\\u0030foo", {startRule:rule}), Parser.SyntaxError);
  Assert.deepEqual(Parser.parse("foo0", {startRule:rule}), "foo0");
  Assert.deepEqual(Parser.parse("foo\\u{30}", {startRule:rule}), "foo0");
  Assert.deepEqual(Parser.parse("foo\\u0030", {startRule:rule}), "foo0");
  Assert.throws(() => Parser.parse("debugger", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("eval", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("method", {startRule:rule}), Parser.SyntaxError);
  Assert.throws(() => Parser.parse("constructor", {startRule:rule}), Parser.SyntaxError);
});

Assert.throws(() => Parser.parse("this", {startRule:"Label"}), Parser.SyntaxError);
Assert.throws(() => Parser.parse("this", {startRule:"Declarable"}), Parser.SyntaxError);
Assert.deepEqual(Parser.parse("this", {startRule:"Identifier"}), "this");

Assert.throws(() => Parser.parse("new.target", {startRule:"Label"}), Parser.SyntaxError);
Assert.throws(() => Parser.parse("new.target", {startRule:"Declarable"}), Parser.SyntaxError);
Assert.deepEqual(Parser.parse("new.target", {startRule:"Identifier"}), "new.target");

Assert.throws(() => Parser.parse("imort.meta", {startRule:"Label"}), Parser.SyntaxError);
Assert.throws(() => Parser.parse("import.meta", {startRule:"Declarable"}), Parser.SyntaxError);
Assert.deepEqual(Parser.parse("import.meta", {startRule:"Identifier"}), "import.meta");

Assert.deepEqual(Parser.parse("arguments", {startRule:"Label"}), "arguments");
Assert.throws(() => Parser.parse("arguments", {startRule:"Declarable"}), Parser.SyntaxError);
Assert.deepEqual(Parser.parse("arguments", {startRule:"Identifier"}), "arguments");

Assert.deepEqual(Parser.parse("callee", {startRule:"Label"}), "callee");
Assert.throws(() => Parser.parse("callee", {startRule:"Declarable"}), Parser.SyntaxError);
Assert.deepEqual(Parser.parse("callee", {startRule:"Identifier"}), "callee");

Assert.deepEqual(Parser.parse("error", {startRule:"Label"}), "error");
Assert.throws(() => Parser.parse("error", {startRule:"Declarable"}), Parser.SyntaxError);
Assert.deepEqual(Parser.parse("error", {startRule:"Identifier"}), "error");

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
Assert.deepEqual(Parser.parse(" void 0 ", {startRule:"StartExpression"}), Tree.primitive(void 0));
Assert.deepEqual(Parser.parse(" null ", {startRule:"StartExpression"}), Tree.primitive(null));
Assert.deepEqual(Parser.parse(" null0 ", {startRule:"StartExpression"}), Tree.read("null0"));
Assert.deepEqual(Parser.parse(" true ", {startRule:"StartExpression"}), Tree.primitive(true));
Assert.deepEqual(Parser.parse(" true0 ", {startRule:"StartExpression"}), Tree.read("true0"));
Assert.deepEqual(Parser.parse(" false ", {startRule:"StartExpression"}), Tree.primitive(false));
Assert.deepEqual(Parser.parse(" false0 ", {startRule:"StartExpression"}), Tree.read("false0"));
Assert.deepEqual(Parser.parse(" 123 ", {startRule:"StartExpression"}), Tree.primitive(123));
Assert.deepEqual(Parser.parse(" \"foo\" ", {startRule:"StartExpression"}), Tree.primitive("foo"));
// Builtin //
Assert.deepEqual(Parser.parse(" # \"foo\" ", {startRule:"StartExpression"}), Tree.builtin("foo"));
Assert.deepEqual(Parser.parse(" # foo . bar ", {startRule:"StartExpression"}), Tree.builtin("foo.bar"));
// Arrow //
Assert.deepEqual(Parser.parse(" ( ) => { } ", {startRule:"StartExpression"}), Tree.arrow(Tree.BLOCK([], [])));
// Function //
Assert.deepEqual(Parser.parse(" function ( ) { } ", {startRule:"StartExpression"}), Tree.function(Tree.BLOCK([], [])));
// Constructor //
Assert.deepEqual(Parser.parse(" constructor ( ) { } ", {startRule:"StartExpression"}), Tree.constructor(Tree.BLOCK([], [])));
// Method //
Assert.deepEqual(Parser.parse(" method ( ) { } ", {startRule:"StartExpression"}), Tree.method(Tree.BLOCK([], [])));
// Read //
Assert.deepEqual(Parser.parse(" foo ", {startRule:"StartExpression"}), Tree.read("foo"));
// Write //
Assert.deepEqual(Parser.parse(" ( foo = 123 ) ", {startRule:"StartExpression"}), Tree.write("foo", Tree.primitive(123)));
// Sequence //
Assert.deepEqual(Parser.parse(" ( 123 , 456 ) ", {startRule:"StartExpression"}), Tree.sequence(Tree.primitive(123), Tree.primitive(456)));
// Conditional //
Assert.deepEqual(Parser.parse(" ( 123 ? 456 : 789 ) ", {startRule:"StartExpression"}), Tree.conditional(Tree.primitive(123), Tree.primitive(456), Tree.primitive(789)));
// Throw //
Assert.deepEqual(Parser.parse(" throw 123 ", {startRule:"StartExpression"}), Tree.throw(Tree.primitive(123)));
Assert.deepEqual(Parser.parse(" throw0 ", {startRule:"StartExpression"}), Tree.read("throw0"));
// Eval //
Assert.deepEqual(Parser.parse(" eval 123 ", {startRule:"StartExpression"}), Tree.eval(Tree.primitive(123)));
// Require //
Assert.deepEqual(Parser.parse(" require 123 ", {startRule:"StartExpression"}), Tree.require(Tree.primitive(123)));
// Import //
Assert.deepEqual(Parser.parse(" import \"foo\" ", {startRule:"StartExpression"}), Tree.import("foo"));
// Unary //
Assert.deepEqual(Parser.parse(" ! 123 ", {startRule:"StartExpression"}), Tree.unary("!", Tree.primitive(123)));
// Binary //
Assert.deepEqual(Parser.parse(" ( 123 * ( 456 + 789 ) ) ", {startRule:"StartExpression"}), Tree.binary("*", Tree.primitive(123), Tree.binary("+", Tree.primitive(456), Tree.primitive(789))));
// Construct //
Assert.deepEqual(Parser.parse(" new  123 ( ) ", {startRule:"StartExpression"}), Tree.construct(Tree.primitive(123), []));
Assert.deepEqual(Parser.parse(" new  123 ( 456 , 789 ) ", {startRule:"StartExpression"}), Tree.construct(Tree.primitive(123), [Tree.primitive(456), Tree.primitive(789)]));
// Object //
Assert.deepEqual(Parser.parse(" { __proto__ : 123 , [ \"foo\" ] : 456 , bar : 789 } ", {startRule:"StartExpression"}), Tree.object(Tree.primitive(123), [[Tree.primitive("foo"), Tree.primitive(456)], [Tree.primitive("bar"), Tree.primitive(789)]]));
// Apply //
Assert.deepEqual(Parser.parse(" 123 ( ) ", {startRule:"StartExpression"}), Tree.apply(Tree.primitive(123), Tree.primitive(undefined), []));
Assert.deepEqual(Parser.parse(" 123 ( @ 456 , 789 ) ", {startRule:"StartExpression"}), Tree.apply(Tree.primitive(123), Tree.primitive(456), [Tree.primitive(789)]));
Assert.deepEqual(Parser.parse(" 123 ( 456 , 789 ) ", {startRule:"StartExpression"}), Tree.apply(Tree.primitive(123), Tree.primitive(undefined), [Tree.primitive(456), Tree.primitive(789)]));
Assert.deepEqual(Parser.parse(" 123 ( 456 ) ( 789 ) ", {startRule:"StartExpression"}), Tree.apply(Tree.apply(Tree.primitive(123), Tree.primitive(undefined), [Tree.primitive(456)]), Tree.primitive(undefined), [Tree.primitive(789)]));
// Parenthesis //
Assert.deepEqual(Parser.parse(" ( 123 ) ", {startRule:"StartExpression"}), Tree.primitive(123));

///////////////
// Statement //
///////////////

// Lift //
Assert.deepEqual(Parser.parse(" 123 ; ", {startRule:"StartStatement"}), Tree.Lift(Tree.primitive(123)));
// Return //
Assert.deepEqual(Parser.parse(" return 123 ; ", {startRule:"StartStatement"}), Tree.Return(Tree.primitive(123)));
Assert.deepEqual(Parser.parse(" return123 ; ", {startRule:"StartStatement"}), Tree.Lift(Tree.read("return123")));
// Break //
Assert.deepEqual(Parser.parse(" break foo ; ", {startRule:"StartStatement"}), Tree.Break("foo"));
Assert.deepEqual(Parser.parse(" breakfoo ; ", {startRule:"StartStatement"}), Tree.Lift(Tree.read("breakfoo")));
// Continue //
Assert.deepEqual(Parser.parse(" continue foo ; ", {startRule:"StartStatement"}), Tree.Continue("foo"));
Assert.deepEqual(Parser.parse(" continuefoo ; ", {startRule:"StartStatement"}), Tree.Lift(Tree.read("continuefoo")));
// Debugger //
Assert.deepEqual(Parser.parse(" debugger ; ", {startRule:"StartStatement"}), Tree.Debugger());
// Aggregate //
Assert.deepEqual(Parser.parse(" aggregate \"foo\" ; ", {startRule:"StartStatement"}), Tree.Aggregate("foo"));
// Export //
Assert.deepEqual(Parser.parse(" export function 123 ; ", {startRule:"StartStatement"}), Tree.Export("function", Tree.primitive(123)));
// Lone //
Assert.deepEqual(Parser.parse(" foo : bar : { let x ; } ", {startRule:"StartStatement"}), Tree.Lone(["foo", "bar"], Tree.BLOCK(["x"], [])));
Assert.deepEqual(Parser.parse(" { __proto__ : 123 } ; ", {startRule:"StartStatement"}), Tree.Lift(Tree.object(Tree.primitive(123), [])));
// If //
Assert.deepEqual(Parser.parse(" foo : bar : if ( 123 ) { let x ; } else { let y ; } ", {startRule:"StartStatement"}), Tree.If(["foo", "bar"], Tree.primitive(123), Tree.BLOCK(["x"], []), Tree.BLOCK(["y"], [])));
// While //
Assert.deepEqual(Parser.parse(" foo : bar : while ( 123 ) { let x ; } ", {startRule:"StartStatement"}), Tree.While(["foo", "bar"], Tree.primitive(123), Tree.BLOCK(["x"], [])));
// Try //
Assert.deepEqual(Parser.parse(" foo : bar : try { let x ; } catch { let y ; } finally { let z ; } ", {startRule:"StartStatement"}), Tree.Try(["foo", "bar"], Tree.BLOCK(["x"], []), Tree.BLOCK(["y"], []), Tree.BLOCK(["z"], [])));
// Bundle //
Assert.deepEqual(Parser.parse(" 123 ; 456 ; ", {startRule:"StartStatement"}), Tree.Bundle([Tree.Lift(Tree.primitive(123)), Tree.Lift(Tree.primitive(456))]));
Assert.deepEqual(Parser.parse(" ", {startRule:"StartStatement"}), Tree.Bundle([]));

///////////
// Block //
///////////

Assert.deepEqual(Parser.parse("{ let x , y ; 123 ; 456 ; } ", {startRule:"StartBlock"}), Tree.BLOCK(["x", "y"], [Tree.Lift(Tree.primitive(123)), Tree.Lift(Tree.primitive(456))]));
Assert.deepEqual(Parser.parse("{ 123 ; 456 ; } ", {startRule:"StartBlock"}), Tree.BLOCK([], [Tree.Lift(Tree.primitive(123)), Tree.Lift(Tree.primitive(456))]));

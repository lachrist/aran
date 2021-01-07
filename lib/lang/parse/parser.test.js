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
Assert.deepEqual(Parser.parse(" void 0 ", {startRule:"StartExpression"}), Tree.primitive(void 0));
Assert.deepEqual(Parser.parse(" null ", {startRule:"StartExpression"}), Tree.primitive(null));
Assert.deepEqual(Parser.parse(" null0 ", {startRule:"StartExpression"}), Tree.read("null0"));
Assert.deepEqual(Parser.parse(" true ", {startRule:"StartExpression"}), Tree.primitive(true));
Assert.deepEqual(Parser.parse(" true0 ", {startRule:"StartExpression"}), Tree.read("true0"));
Assert.deepEqual(Parser.parse(" false ", {startRule:"StartExpression"}), Tree.primitive(false));
Assert.deepEqual(Parser.parse(" false0 ", {startRule:"StartExpression"}), Tree.read("false0"));
Assert.deepEqual(Parser.parse(" 123 ", {startRule:"StartExpression"}), Tree.primitive(123));
Assert.deepEqual(Parser.parse(" \"foo\" ", {startRule:"StartExpression"}), Tree.primitive("foo"));
// Intrinsic //
Assert.deepEqual(Parser.parse(" # \"foo\" ", {startRule:"StartExpression"}), Tree.intrinsic("foo"));
Assert.deepEqual(Parser.parse(" # foo . bar ", {startRule:"StartExpression"}), Tree.intrinsic("foo.bar"));
// Closure //
["arrow", "function", "method", "constructor"].forEach((sort) => {
  Assert.deepEqual(Parser.parse(` ${sort} ( ) l: { let x; } `, {startRule:"StartExpression"}), Tree.closure(sort, false, false, Tree.BLOCK(["l"], ["x"], [])));
  Assert.deepEqual(Parser.parse(` async ${sort} ( ) l: { let x; } `, {startRule:"StartExpression"}), Tree.closure(sort, true, false, Tree.BLOCK(["l"], ["x"], [])));
  Assert.deepEqual(Parser.parse(` ${sort} * ( ) l: { let x; } `, {startRule:"StartExpression"}), Tree.closure(sort, false, true, Tree.BLOCK(["l"], ["x"], [])));
  Assert.deepEqual(Parser.parse(` async ${sort} * ( ) l: { let x; } `, {startRule:"StartExpression"}), Tree.closure(sort, true, true, Tree.BLOCK(["l"], ["x"], [])));

});
// Import //
Assert.deepEqual(Parser.parse(" import var from \"source\" ", {startRule:"StartExpression"}), Tree.import("var", "source"));
Assert.deepEqual(Parser.parse(" import * from \"source\" ", {startRule:"StartExpression"}), Tree.import(null, "source"));
// Read //
Assert.deepEqual(Parser.parse(" foo ", {startRule:"StartExpression"}), Tree.read("foo"));
// Export //
Assert.deepEqual(Parser.parse(" export var 123 ", {startRule:"StartExpression"}), Tree.export("var", Tree.primitive(123)));
// Write //
Assert.deepEqual(Parser.parse(" foo = 123 ", {startRule:"StartExpression"}), Tree.write("foo", Tree.primitive(123)));
// Enclave - Read //
Assert.deepEqual(Parser.parse(" enclave foo ", {startRule:"StartExpression"}), Tree.enclave_read("foo"));
// Enclave - Write //
Assert.deepEqual(Parser.parse(" enclave foo != 123 ", {startRule:"StartExpression"}), Tree.enclave_write(true, "foo", Tree.primitive(123)));
Assert.deepEqual(Parser.parse(" enclave foo ?= 123 ", {startRule:"StartExpression"}), Tree.enclave_write(false, "foo", Tree.primitive(123)));
// Enclave - SuperCall //
Assert.deepEqual(Parser.parse(" enclave super ( ... 123 ) ", {startRule:"StartExpression"}), Tree.enclave_super_call(Tree.primitive(123)));
// Enclave - SuperMember //
Assert.deepEqual(Parser.parse(" enclave super [ 123 ] ", {startRule:"StartExpression"}), Tree.enclave_super_member(Tree.primitive(123)));

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
// Await //
Assert.deepEqual(Parser.parse(" await 123 ", {startRule:"StartExpression"}), Tree.await(Tree.primitive(123)));
// Yield //
Assert.deepEqual(Parser.parse(" yield * 123 ", {startRule:"StartExpression"}), Tree.yield(true, Tree.primitive(123)));
Assert.deepEqual(Parser.parse(" yield 123 ", {startRule:"StartExpression"}), Tree.yield(false, Tree.primitive(123)));
// Unary //
Assert.deepEqual(Parser.parse(" ! 123 ", {startRule:"StartExpression"}), Tree.unary("!", Tree.primitive(123)));
// Binary //
Assert.deepEqual(Parser.parse(" ( 123 * ( 456 + 789 ) ) ", {startRule:"StartExpression"}), Tree.binary("*", Tree.primitive(123), Tree.binary("+", Tree.primitive(456), Tree.primitive(789))));
// Construct //
Assert.deepEqual(Parser.parse(" new  123 ( ) ", {startRule:"StartExpression"}), Tree.construct(Tree.primitive(123), []));
Assert.deepEqual(Parser.parse(" new  123 ( 456 , 789 ) ", {startRule:"StartExpression"}), Tree.construct(Tree.primitive(123), [Tree.primitive(456), Tree.primitive(789)]));
// Object //
Assert.deepEqual(Parser.parse(" { __proto__ : 12 , [ \"foo\" ] : 34 , bar : 56, \"qux\": 78 } ", {startRule:"StartExpression"}), Tree.object(Tree.primitive(12), [[Tree.primitive("foo"), Tree.primitive(34)], [Tree.primitive("bar"), Tree.primitive(56)], [Tree.primitive("qux"), Tree.primitive(78)]]));
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
// Debugger //
Assert.deepEqual(Parser.parse(" debugger ; ", {startRule:"StartStatement"}), Tree.Debugger());
// Lone //
Assert.deepEqual(Parser.parse(" l : { let x ; } ", {startRule:"StartStatement"}), Tree.Lone(Tree.BLOCK(["l"], ["x"], [])));
Assert.deepEqual(Parser.parse(" { __proto__ : 123 } ; ", {startRule:"StartStatement"}), Tree.Lift(Tree.object(Tree.primitive(123), [])));
// If //
Assert.deepEqual(Parser.parse(" if ( 123 ) l : { let x ; } else m : { let y ; } ", {startRule:"StartStatement"}), Tree.If(Tree.primitive(123), Tree.BLOCK(["l"], ["x"], []), Tree.BLOCK(["m"], ["y"], [])));
// While //
Assert.deepEqual(Parser.parse(" while ( 123 ) l : { let x ; } ", {startRule:"StartStatement"}), Tree.While(Tree.primitive(123), Tree.BLOCK(["l"], ["x"], [])));
// Try //
Assert.deepEqual(Parser.parse(" try l : { let x ; } catch m : { let y ; } finally n : { let z ; } ", {startRule:"StartStatement"}), Tree.Try(Tree.BLOCK(["l"], ["x"], []), Tree.BLOCK(["m"], ["y"], []), Tree.BLOCK(["n"], ["z"], [])));
// Bundle //
Assert.deepEqual(Parser.parse(" 123 ; 456 ; ", {startRule:"StartStatement"}), Tree.Bundle([Tree.Lift(Tree.primitive(123)), Tree.Lift(Tree.primitive(456))]));
Assert.deepEqual(Parser.parse(" ", {startRule:"StartStatement"}), Tree.Bundle([]));

///////////
// Block //
///////////

Assert.deepEqual(Parser.parse("k : l : { let x , y ; 123 ; 456 ; } ", {startRule:"StartBlock"}), Tree.BLOCK(["k", "l"], ["x", "y"], [Tree.Lift(Tree.primitive(123)), Tree.Lift(Tree.primitive(456))]));
Assert.deepEqual(Parser.parse("{ 123 ; 456 ; } ", {startRule:"StartBlock"}), Tree.BLOCK([], [], [Tree.Lift(Tree.primitive(123)), Tree.Lift(Tree.primitive(456))]));

/////////////
// Prelude //
/////////////

// Import //
Assert.deepEqual(Parser.parse(" import function from \"source\" ; ", {startRule:"StartPrelude"}), Tree._import("function", "source"));
Assert.deepEqual(Parser.parse(" import * from \"source\" ; ", {startRule:"StartPrelude"}), Tree._import(null, "source"));
// Export //
Assert.deepEqual(Parser.parse(" export function ; ", {startRule:"StartPrelude"}), Tree._export("function"));
// Aggregate //
Assert.deepEqual(Parser.parse(" aggregate * from \"source\" ; ", {startRule:"StartPrelude"}), Tree._aggregate(null, "source", null));
Assert.deepEqual(Parser.parse(" aggregate function from \"source\" as var ; ", {startRule:"StartPrelude"}), Tree._aggregate("function", "source", "var"));

/////////////
// Program //
/////////////

Assert.deepEqual(
  Parser.parse(
    `
      export function ;
      export var ;
      l : { let x; 123; }`,
    {startRule:"StartProgram"}),
  Tree._program(
    [
      Tree._export("function"),
      Tree._export("var")],
    Tree.BLOCK(
      ["l"],
      ["x"],
      [
        Tree.Lift(
          Tree.primitive(123))])));

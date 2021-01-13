"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

const Tree = require("./tree.js");

const callbacks = {
  __proto__: null,
  // Program //
  _program: () => { Assert.fail() },
  // Prelude //
  ImportLink: () => { Assert.fail() },
  ExportLink: () => { Assert.fail() },
  AggregateLink: () => { Assert.fail() },
  // Block //
  Block: () => { Assert.fail() },
  // Statement - Blockless //
  ExpressionStatement: () => { Assert.fail() },
  ReturnStatement: () => { Assert.fail() },
  BreakStatement: () => { Assert.fail() },
  DebuggerStatement: () => { Assert.fail() },
  BundleStatement: () => { Assert.fail() },
  // Statement - Blockfull //
  ExpressionStatement: () => { Assert.fail() },
  IfStatement: () => { Assert.fail() },
  WhileStatement: () => { Assert.fail() },
  TryStatement: () => { Assert.fail() },
  // Expression - Producers //
  ImportExpression: () => { Assert.fail() },
  PrimitiveExpression: () => { Assert.fail() },
  IntrinsicExpression: () => { Assert.fail() },
  ClosureExpression: () => { Assert.fail() },
  ReadExpression: () => { Assert.fail() },
  // Expression - Consumers //
  AwaitExpression: () => { Assert.fail() },
  YieldExpression: () => { Assert.fail() },
  ExportExpression: () => { Assert.fail() },
  WriteExpression: () => { Assert.fail() },
  SequenceExpression: () => { Assert.fail() },
  ConditionalExpression: () => { Assert.fail() },
  ThrowExpression: () => { Assert.fail() },
  // Expression - Consumer - Producer //
  EvalExpression: () => { Assert.fail() },
  RequireExpression: () => { Assert.fail() },
  // Expression - Combiners //
  ApplyExpression: () => { Assert.fail() },
  ConstructExpression: () => { Assert.fail() },
  UnaryExpression: () => { Assert.fail() },
  BinaryExpression: () => { Assert.fail() },
  ObjectExpression: () => { Assert.fail() }
};

////////////
// Syntax //
////////////
Tree.toggleDebugMode();
// primitive //
Tree.PrimitiveExpression(null);
Tree.PrimitiveExpression(void 0);
Tree.PrimitiveExpression(true);
Tree.PrimitiveExpression(false);
Tree.PrimitiveExpression(123);
Tree.PrimitiveExpression(123n);
Tree.PrimitiveExpression("foo");
Assert.throws(
  () => Tree.PrimitiveExpression(Symbol("foo")),
  new Error(`Invalid atomic node: expected a Primitive, got Symbol(foo)`));
Assert.throws(
  () => Tree.PrimitiveExpression({}),
  new Error(`Invalid atomic node: expected a Primitive, got [object Object]`));
Assert.throws(
  () => Tree.PrimitiveExpression(() => {}),
  new Error(`Invalid atomic node: expected a Primitive, got [object Function]`));
// label & identifier //
[["Label", "BreakStatement"], ["Identifier", "ReadExpression"]].forEach(([type, constructor]) => {
  Tree[constructor]("foo");
  Assert.throws(
    () => Tree[constructor]("eval"),
    new Error(`Invalid atomic node: expected a ${type}, got "eval"`));
  Assert.throws(
    () => Tree[constructor](" foo"),
    new Error(`Invalid atomic node: expected a ${type}, got " foo"`));
  Assert.throws(
    () => Tree[constructor]("foo "),
    new Error(`Invalid atomic node: expected a ${type}, got "foo "`));
  Assert.throws(
    () => Tree[constructor]("foo bar"),
    new Error(`Invalid atomic node: expected a ${type}, got "foo bar"`));
  Assert.throws(
    () => Tree[constructor]("0foo"),
    new Error(`Invalid atomic node: expected a ${type}, got "0foo"`));
  Assert.throws(
    () => Tree[constructor]("in"),
    new Error(`Invalid atomic node: expected a ${type}, got "in"`));
  Assert.throws(
    () => Tree[constructor](123),
    new Error(`Invalid atomic node: expected a ${type}, got 123`)); });
// Source && Specifier //
Tree.ImportLink(null, "*foobar*");
Tree.ImportLink("var", "*foobar*");
// ReadEnclaveIdentifier //
Tree.ReadEnclaveExpression("foo");
Tree.ReadEnclaveExpression("eval");
Tree.ReadEnclaveExpression("arguments");
Assert.throws(
  () => Tree.ReadEnclaveExpression("var"),
  new Error(`Invalid atomic node: expected a ReadEnclaveIdentifier, got "var"`));
// WriteEnclaveIdentifier //
Tree.WriteEnclaveExpression(
  true,
  "foo",
  Tree.PrimitiveExpression(123));
Assert.throws(
  () => Tree.WriteEnclaveExpression(
    true,
    "eval",
    Tree.PrimitiveExpression(123)),
  new Error(`Invalid atomic node: expected a WriteEnclaveIdentifier, got "eval"`));
Assert.throws(
  () => Tree.WriteEnclaveExpression(
    true,
    "arguments",
    Tree.PrimitiveExpression(123)),
  new Error(`Invalid atomic node: expected a WriteEnclaveIdentifier, got "arguments"`));
Assert.throws(
  () => Tree.WriteEnclaveExpression(
    true,
    "var",
    Tree.PrimitiveExpression(123)),
  new Error(`Invalid atomic node: expected a WriteEnclaveIdentifier, got "var"`));
// Kind //
Tree.DeclareEnclaveStatement(
  "var",
  "foo",
  Tree.PrimitiveExpression(123));
Tree.DeclareEnclaveStatement(
  "let",
  "foo",
  Tree.PrimitiveExpression(123));
Tree.DeclareEnclaveStatement(
  "const",
  "foo",
  Tree.PrimitiveExpression(123));
Assert.throws(
  () => Tree.DeclareEnclaveStatement(
    "bar",
    "foo",
    Tree.PrimitiveExpression(123)),
  new Error(`Invalid atomic node: expected a Kind, got "bar"`));

////////////////////////
// Build (Debug Mode) //
////////////////////////
Tree.toggleDebugMode();
// Bundle //
Assert.deepEqual(
  Tree.LabelBlock(
    ["k", "l"],
    Tree.Block(
      ["x", "y"],
      [
        Tree.BundleStatement([
          Tree.BreakStatement("k"),
          Tree.BundleStatement([
            Tree.BreakStatement("l"),
            Tree.BreakStatement("m"),
            Tree.BundleStatement([])])]),
        Tree.BundleStatement([
          Tree.BreakStatement("n")])],
      Tree.PrimitiveExpression(123))),
  Tree.LabelBlock(
    ["k", "l"],
    Tree.Block(
      ["x", "y"],
      [
        Tree.BreakStatement("k"),
        Tree.BreakStatement("l"),
        Tree.BreakStatement("m"),
        Tree.BreakStatement("n")],
      Tree.PrimitiveExpression(123))));
// Wrong number of fields //
Assert.throws(
  () => Tree.DebuggerStatement("foo"),
  new Error(`Wrong number of fields for DebuggerStatement: expected [], got: ["foo"]`));
// Invalid node of predicate-based type //
Tree.PrimitiveExpression(123);
Tree.IntrinsicExpression("foo");
Assert.throws(
  () => Tree.PrimitiveExpression({__proto__:null}),
  new Error(`Invalid atomic node: expected a Primitive, got [object Object]`));
Assert.throws(
  () => Tree.IntrinsicExpression(123),
  new Error(`Invalid atomic node: expected a Intrinsic, got 123`));
// Invalid node of enumeration-based type //
Tree.UnaryExpression(
  "!",
  Tree.PrimitiveExpression(123));
Assert.throws(
  () => Tree.UnaryExpression(
    "foo",
    Tree.PrimitiveExpression(123)),
  new Error(`Invalid atomic node: expected a Unary, got "foo"`));
// Invalid node of identity-based type //
Tree.UnaryExpression(
  "!",
  Tree.PrimitiveExpression(123));
Assert.throws(
  () => Tree.UnaryExpression("!", []),
  new Error(`Invalid compound node: expected a Expression, got [object Array]`));
// List Node & Tuple Node //
Tree.ObjectExpression(
  Tree.PrimitiveExpression(null),
  [
    [
      Tree.PrimitiveExpression("foo"),
      Tree.PrimitiveExpression(123)],
    [
      Tree.PrimitiveExpression("bar"),
      Tree.PrimitiveExpression(456)]]);
Assert.throws(
  () => Tree.ObjectExpression(
    Tree.PrimitiveExpression(null),
    [
      [
        Tree.PrimitiveExpression("foo"),
        Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression("bar")]]),
  new Error(`Length mismatch in array node: expected ["Expression","Expression"], got [[object Array],[object Array],[object Array]]`));
Assert.throws(
  () => Tree.ObjectExpression(
    Tree.PrimitiveExpression(null),
    [
      [
        Tree.PrimitiveExpression("foo"),
        Tree.PrimitiveExpression(123)],
      {
        __proto__: null,
        0: Tree.PrimitiveExpression("bar"),
        1: Tree.PrimitiveExpression(456)}]),
  new Error(`Invalid array node: expected a ["Expression","Expression"], got [object Object]`));
// Block //
Tree.BlockStatement(
  Tree.LabelBlock(
    [],
    Tree.Block(
      [],
      [],
      Tree.PrimitiveExpression(123))));
// Immutable //
Assert.throws(
  () => Reflect.defineProperty(
    Tree.PrimitiveExpression(123),
    0,
    {__proto__:null, value:"foo"}),
  new Error("defineProperty on immutable node"));
Assert.throws(
  () => Reflect.setPrototypeOf(
    Tree.PrimitiveExpression(123), null),
  new Error("setPrototypeOf on immutable node"));

//////////////////////////////////////
// Build (Normale Mode) && Accessor //
//////////////////////////////////////

Tree.toggleNormalMode();

// Dispatch && Extract //
{
  const context = "ctx";
  const result = "foobar";
  const test = (node, name, callback) => (
    Assert.deepEqual(
      Tree.dispatch(
        context,
        node,
        {
          __proto__: callbacks,
          [name]: callback }),
      result),
    Assert.deepEqual(
      Tree.extract(
        context,
        node,
        name,
        callback),
      result));
  // 1 //
  test(
    Tree.DebuggerStatement(),
    "DebuggerStatement",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.DebuggerStatement()]),
      result));
  // 2 && construct Bundle //
  test(
    Tree.BundleStatement(
      [
        Tree.BundleStatement(
          [
            Tree.BreakStatement("l")]),
        Tree.BreakStatement("m")]),
    "BundleStatement",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.BundleStatement(
            [
              Tree.BreakStatement("l"),
              Tree.BreakStatement("m")]),
          [
            Tree.BreakStatement("l"),
            Tree.BreakStatement("m")]]),
      result));
  // 3 //
  test(
    Tree.UnaryExpression(
      "!",
      Tree.PrimitiveExpression(123)),
    "UnaryExpression",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.UnaryExpression(
            "!",
            Tree.PrimitiveExpression(123)),
          "!",
          Tree.PrimitiveExpression(123)]),
      result));
  // 4 //
  test(
    Tree.BinaryExpression(
      "+",
      Tree.PrimitiveExpression(123),
      Tree.PrimitiveExpression(456)),
    "BinaryExpression",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.BinaryExpression(
            "+",
            Tree.PrimitiveExpression(123),
            Tree.PrimitiveExpression(456)),
          "+",
          Tree.PrimitiveExpression(123),
          Tree.PrimitiveExpression(456)]),
      result));
  // 5 //
  test(
    Tree.ClosureExpression(
      "arrow",
      false,
      false,
      Tree.Block(["l"], ["x"], [])),
    "ClosureExpression",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.ClosureExpression(
            "arrow",
            false,
            false,
            Tree.Block(["l"], ["x"], [])),
          "arrow",
          false,
          false,
          Tree.Block(["l"], ["x"], [])]),
      result)); }
// 6 //
Assert.throws(
  () => Tree.extract(
    "ctx",
    ["dummy-type", 1, 2, 3, 4, 5],
    "dummy-type",
    () => Assert.fail()),
  new global.Error(`Invalid node length for extract`));
Assert.throws(
  () => Tree.dispatch(
    "ctx",
    ["dummy-type", 1, 2, 3, 4, 5],
    {"dummy-type": () => Assert.fail()}),
  new global.Error(`Invalid node length for dispatch`));

// Match //
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

// Allign //
Assert.deepEqual(
  Tree.allign(
    "ctx",
    Tree.BreakStatement("l"),
    Tree.DebuggerStatement(),
    {
      __proto__: callbacks,
      __type_mismatch__: (...args) => (
        Assert.deepEqual(
          args,
          [
            "ctx",
            Tree.BreakStatement("l"),
            Tree.DebuggerStatement(),
            "BreakStatement",
            "DebuggerStatement"]),
        "foo")}),
  "foo");
Assert.deepEqual(
  Tree.allign(
    "ctx",
    Tree.BreakStatement("k"),
    Tree.BreakStatement("l"),
    {
      __proto__: callbacks,
      __type_mismatch__: () => Assert.fail(),
      BreakStatement: (...args) => (
        Assert.deepEqual(
          args,
          [
            "ctx",
            Tree.BreakStatement("k"),
            Tree.BreakStatement("l"),
            "k",
            "l"]),
        "foo")}),
  "foo");

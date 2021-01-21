"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Tree = require("./tree.js");

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
[["LabelIdentifier", "BreakStatement"], ["VariableIdentifier", "ReadExpression"]].forEach(([type, constructor]) => {
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
// ReadableEnclaveVariableIdentifier //
Tree.ReadEnclaveExpression("foo");
Tree.ReadEnclaveExpression("eval");
Tree.ReadEnclaveExpression("arguments");
Assert.throws(
  () => Tree.ReadEnclaveExpression("var"),
  new Error(`Invalid atomic node: expected a ReadableEnclaveVariableIdentifier, got "var"`));
// WritableEnclaveVariableIdentifier //
Tree.WriteEnclaveExpression(
  true,
  "foo",
  Tree.PrimitiveExpression(123));
Assert.throws(
  () => Tree.WriteEnclaveExpression(
    true,
    "eval",
    Tree.PrimitiveExpression(123)),
  new Error(`Invalid atomic node: expected a WritableEnclaveVariableIdentifier, got "eval"`));
Assert.throws(
  () => Tree.WriteEnclaveExpression(
    true,
    "arguments",
    Tree.PrimitiveExpression(123)),
  new Error(`Invalid atomic node: expected a WritableEnclaveVariableIdentifier, got "arguments"`));
Assert.throws(
  () => Tree.WriteEnclaveExpression(
    true,
    "var",
    Tree.PrimitiveExpression(123)),
  new Error(`Invalid atomic node: expected a WritableEnclaveVariableIdentifier, got "var"`));
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
// check_completion //
Tree.Block(
  ["x", "y"],
  Tree.ListStatement(
    [
      Tree.BreakStatement("k"),
      Tree.ListStatement(
        [
          Tree.BreakStatement("l"),
          Tree.BreakStatement("m"),
          Tree.ListStatement([])]),
      Tree.ListStatement(
        [
          Tree.BreakStatement("n"),
          Tree.CompletionStatement(
            Tree.PrimitiveExpression(123))])]));
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
  new Error(`Invalid atomic node: expected a UnaryOperator, got "foo"`));
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
Tree.BranchStatement(
  Tree.Branch(
    [],
    Tree.Block(
      [],
      Tree.CompletionStatement(
        Tree.PrimitiveExpression(123)))));
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

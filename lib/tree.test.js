"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("./tree.js")._toggle_debug_mode();

const Tree = require("./tree.js");

const callbacks = {
  __proto__: null,
  // Program //
  _program: () => { Assert.fail() },
  // Prelude //
  _import: () => { Assert.fail() },
  _export: () => { Assert.fail() },
  _aggregate: () => { Assert.fail() },
  // Block //
  BLOCK: () => { Assert.fail() },
  // Statement - Blockless //
  Lift: () => { Assert.fail() },
  Return: () => { Assert.fail() },
  Break: () => { Assert.fail() },
  Continue: () => { Assert.fail() },
  Debugger: () => { Assert.fail() },
  Bundle: () => { Assert.fail() },
  // Statement - Blockfull //
  Lone: () => { Assert.fail() },
  If: () => { Assert.fail() },
  While: () => { Assert.fail() },
  Try: () => { Assert.fail() },
  // Expression - Producers //
  import: () => { Assert.fail() },
  primitive: () => { Assert.fail() },
  intrinsic: () => { Assert.fail() },
  arrow: () => { Assert.fail() },
  constructor: () => { Assert.fail() },
  method: () => { Assert.fail() },
  function: () => { Assert.fail() },
  read: () => { Assert.fail() },
  // Expression - Consumers //
  export: () => { Assert.fail() },
  write: () => { Assert.fail() },
  sequence: () => { Assert.fail() },
  conditional: () => { Assert.fail() },
  throw: () => { Assert.fail() },
  // Expression - Consumer - Producer //
  eval: () => { Assert.fail() },
  require: () => { Assert.fail() },
  // Expression - Combiners //
  apply: () => { Assert.fail() },
  construct: () => { Assert.fail() },
  unary: () => { Assert.fail() },
  binary: () => { Assert.fail() },
  object: () => { Assert.fail() }
};

////////////
// Syntax //
////////////
Tree._toggle_debug_mode();
// primitive //
Tree.primitive(null);
Tree.primitive(void 0);
Tree.primitive(true);
Tree.primitive(false);
Tree.primitive(123);
Tree.primitive(123n);
Tree.primitive("foo");
Assert.throws(() => Tree.primitive(Symbol("foo")), new Error(`Invalid predicate-based atomic node: expected a primitive, got Symbol(foo)`));
Assert.throws(() => Tree.primitive({}), new Error(`Invalid predicate-based atomic node: expected a primitive, got [object Object]`));
Assert.throws(() => Tree.primitive(() => {}), new Error(`Invalid predicate-based atomic node: expected a primitive, got [object Function]`));
// label & identifier //
[["label", "Break"], ["identifier", "read"]].forEach(([type, constructor]) => {
  Tree[constructor]("foo");
  Assert.throws(() => Tree[constructor]("eval"), new Error(`Invalid predicate-based atomic node: expected a ${type}, got "eval"`));
  Assert.throws(() => Tree[constructor](" foo"), new Error(`Invalid predicate-based atomic node: expected a ${type}, got " foo"`));
  Assert.throws(() => Tree[constructor]("foo "), new Error(`Invalid predicate-based atomic node: expected a ${type}, got "foo "`));
  Assert.throws(() => Tree[constructor]("foo bar"), new Error(`Invalid predicate-based atomic node: expected a ${type}, got "foo bar"`));
  Assert.throws(() => Tree[constructor]("0foo"), new Error(`Invalid predicate-based atomic node: expected a ${type}, got "0foo"`));
  Assert.throws(() => Tree[constructor]("in"), new Error(`Invalid predicate-based atomic node: expected a ${type}, got "in"`));
  Assert.throws(() => Tree[constructor](123), new Error(`Invalid predicate-based atomic node: expected a ${type}, got 123`));
});
// source && specifier //
Tree._import(null, "*foobar*");
Tree._import("var", "*foobar*");
// enclave-read-identifier //
Tree.enclave_read("foo");
Tree.enclave_read("eval");
Tree.enclave_read("arguments");
Assert.throws(() => Tree.enclave_read("var"), new Error(`Invalid predicate-based atomic node: expected a enclave-read-identifier, got "var"`));
// enclave-write-identifier //
Tree.enclave_write(true, "foo", Tree.primitive(123));
Assert.throws(() => Tree.enclave_write(true, "eval", Tree.primitive(123)), new Error(`Invalid predicate-based atomic node: expected a enclave-write-identifier, got "eval"`));
Assert.throws(() => Tree.enclave_write(true, "arguments", Tree.primitive(123)), new Error(`Invalid predicate-based atomic node: expected a enclave-write-identifier, got "arguments"`));
Assert.throws(() => Tree.enclave_write(true, "var", Tree.primitive(123)), new Error(`Invalid predicate-based atomic node: expected a enclave-write-identifier, got "var"`));


////////////////////////
// Build (Debug Mode) //
////////////////////////
Tree._toggle_debug_mode();
// Bundle //
Assert.deepEqual(Tree.BLOCK(["x", "y"], [
  Tree.Bundle([
    Tree.Break("k"),
    Tree.Bundle([
      Tree.Break("l"),
      Tree.Break("m"),
      Tree.Bundle([])
    ])
  ]),
  Tree.Bundle([
    Tree.Break("n")
  ])
]), Tree.BLOCK(["x", "y"], [
  Tree.Break("k"),
  Tree.Break("l"),
  Tree.Break("m"),
  Tree.Break("n")
]));
// Wrong number of fields //
Assert.throws(() => Tree.Debugger("foo"), new Error(`Wrong number of fields for Debugger: expected [], got: ["foo"]`));
// Invalid node of predicate-based type //
Tree.primitive(123);
Tree.intrinsic("foo");
Assert.throws(() => Tree.primitive({__proto__:null}), new Error(`Invalid predicate-based atomic node: expected a primitive, got [object Object]`));
Assert.throws(() => Tree.intrinsic(123), new Error(`Invalid predicate-based atomic node: expected a intrinsic, got 123`));
// Invalid node of enumeration-based type //
Tree.unary("!", Tree.primitive(123));
Assert.throws(() => Tree.unary("foo", Tree.primitive(123)), new Error(`Invalid enumeration-based atomic node: expected a unary, got "foo"`));
// Invalid node of identity-based type //
Tree.unary("!", Tree.primitive(123));
Assert.throws(() => Tree.unary("!", ["primitive", 123]), new Error(`Invalid compound node: expected a expression, got [object Array]`));
// List Node & Tuple Node //
Tree.object(Tree.primitive(null), [[Tree.primitive("foo"), Tree.primitive(123)], [Tree.primitive("bar"), Tree.primitive(456)]]);
Assert.throws(() => Tree.object(Tree.primitive(null), [[Tree.primitive("foo"), Tree.primitive(123), Tree.primitive("bar")]]), new Error(`Length mismatch in array node: expected ["expression","expression"], got [[object Array],[object Array],[object Array]]`));
Assert.throws(() => Tree.object(Tree.primitive(null), [[Tree.primitive("foo"), Tree.primitive(123)], {__proto__:null, 0:Tree.primitive("bar"), 1:Tree.primitive(456)}]), new Error(`Invalid array node: expected a ["expression","expression"], got [object Object]`));
// Block //
Tree.Lone([], Tree.BLOCK([], []));
// Immutable //
Assert.throws(() => Reflect.defineProperty(Tree.primitive(123), 0, {__proto__:null, value:"foo"}), new Error("defineProperty on immutable node"));
Assert.throws(() => Reflect.setPrototypeOf(Tree.primitive(123), null), new Error("setPrototypeOf on immutable node"));

//////////////////////////////////////
// Build (Normale Mode) && Accessor //
//////////////////////////////////////

Tree._toggle_normal_mode();

// Dispatch && Extract //
{
  const context = "ctx";
  const result = "foobar";
  const test = (node, name, callback) => (
    Assert.deepEqual(
      Tree._dispatch(
        context,
        node,
        {
          __proto__: callbacks,
          [name]: callback }),
      result),
    Assert.deepEqual(
      Tree._extract(
        context,
        node,
        name,
        callback),
      result));
  // 1 //
  test(
    Tree.Debugger(),
    "Debugger",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.Debugger()]),
      result));
  // 2 && construct Bundle //
  test(
    Tree.Bundle(
      [
        Tree.Bundle(
          [
            Tree.Break("l")]),
        Tree.Break("m")]),
    "Bundle",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.Bundle(
            [
              Tree.Break("l"),
              Tree.Break("m")]),
          [
            Tree.Break("l"),
            Tree.Break("m")]]),
      result));
  // 3 //
  test(
    Tree.unary(
      "!",
      Tree.primitive(123)),
    "unary",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.unary(
            "!",
            Tree.primitive(123)),
          "!",
          Tree.primitive(123)]),
      result));
  // 4 //
  test(
    Tree.binary(
      "+",
      Tree.primitive(123),
      Tree.primitive(456)),
    "binary",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.binary(
            "+",
            Tree.primitive(123),
            Tree.primitive(456)),
          "+",
          Tree.primitive(123),
          Tree.primitive(456)]),
      result));
  // 5 //
  test(
    Tree.If(
      ["l"],
      Tree.primitive(123),
      Tree.BLOCK(["x"], []),
      Tree.BLOCK(["y"], [])),
    "If",
    (...args) => (
      Assert.deepEqual(
        args,
        [
          context,
          Tree.If(
            ["l"],
            Tree.primitive(123),
            Tree.BLOCK(["x"], []),
            Tree.BLOCK(["y"], [])),
          ["l"],
          Tree.primitive(123),
          Tree.BLOCK(["x"], []),
          Tree.BLOCK(["y"], [])]),
      result)); }
// 6 //
Assert.throws(
  () => Tree._extract(
    "ctx",
    ["dummy-type", 1, 2, 3, 4, 5],
    "dummy-type",
    () => Assert.fail()),
  new global.Error(`Invalid node length for extract`));
Assert.throws(
  () => Tree._dispatch(
    "ctx",
    ["dummy-type", 1, 2, 3, 4, 5],
    {"dummy-type": () => Assert.fail()}),
  new global.Error(`Invalid node length for dispatch`));

// _match //
Assert.deepEqual(
  Tree._match("ctx", "foo", (...args) => (
    Assert.deepEqual(args, ["ctx", "foo"]),
    true)),
  true);
Assert.deepEqual(
  Tree._match("ctx", "foo",  (...args) => (
    Assert.deepEqual(args, ["ctx", "foo"]),
    false)),
  false);
Assert.deepEqual(
  Tree._match("ctx", "foo", "foo"),
  true);
Assert.deepEqual(
  Tree._match("ctx", "foo", "bar"),
  false);
Assert.deepEqual(
  Tree._match(
    "ctx",
    "foo",
    Tree.primitive(123)),
  false);
Assert.deepEqual(
  Tree._match(
    "ctx",
    Tree.primitive(123),
    "foo"),
  false);
Assert.deepEqual(
  Tree._match(
    "ctx",
    Tree.primitive(123),
    Tree.read("x")),
  false);
Assert.deepEqual(
  Tree._match(
    "ctx",
    Tree.primitive(123),
    Tree.primitive(123)),
  true);

// _allign //
Assert.deepEqual(
  Tree._allign(
    "ctx",
    Tree.Break("l"),
    Tree.Continue("l"),
    {
      __proto__: callbacks,
      __type_mismatch__: (...args) => (
        Assert.deepEqual(
          args,
          [
            "ctx",
            Tree.Break("l"),
            Tree.Continue("l"),
            "Break",
            "Continue"]),
        "foo")}),
  "foo");
Assert.deepEqual(
  Tree._allign(
    "ctx",
    Tree.Break("k"),
    Tree.Break("l"),
    {
      __proto__: callbacks,
      __type_mismatch__: () => Assert.fail(),
      Break: (...args) => (
        Assert.deepEqual(
          args,
          [
            "ctx",
            Tree.Break("k"),
            Tree.Break("l"),
            "k",
            "l"]),
        "foo")}),
  "foo");

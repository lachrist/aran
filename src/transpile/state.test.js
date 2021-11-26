"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;

const Tree = require("../tree.js");
const State = require("./state.js");

const input = {
  type: "Program",
  body: [
    {type: "DebuggerStatement"}]};

const session = {
  serial: "script",
  counter: 0,
  annotations: new global.Map(
  [
    [input, "annotation"]]),
  locations: [],
  serials: new global.Map()};

const visitor1 = State.makeRootVisitor(
  "Program",
  (node, annotation, context) => (
    Assert.throws(
      () => visitor1(input, session, "context3"),
      new Error("Another script is already being normalized (two scripts cannot be normalized concurrently).")),
    Assert.deepEqual(
      State.increment(),
      1),
    Assert.equal(node, input),
    Assert.deepEqual(annotation, "annotation"),
    Assert.deepEqual(context, "context1"),
    State.registerNode(
      Tree.ScriptProgram(
        false,
        visitor2(node, ["body", 0], "context2")))));

const visitor2 = State.makeVisitor(
  "Statement",
  (node, annotation, context) => (
    Assert.equal(node, input.body[0]),
    Assert.deepEqual(annotation, {}),
    Assert.deepEqual(context, "context2"),
    State.registerNode(
      Tree.DebuggerStatement())));

const output = visitor1(input, session, "context1");

Assert.deepEqual(session.counter, 1);

Assert.deepEqual(
  session.locations,
  [
    {
      type: "Program",
      parent: "script",
      keys: [],
      annotation: "annotation"},
    {
      type: "Statement",
      parent: 0,
      keys: ["body", 0],
      annotation: {}}]);

Assert.deepEqual(session.locations[0].node, input);

Assert.deepEqual(session.locations[1].node, input.body[0]);

Assert.deepEqual(
  session.serials,
  new global.Map([
    [output, 0],
    [
      Tree.extract(null, output, "ScriptProgram", (context, node, enclave, statement) => statement),
      1]]));

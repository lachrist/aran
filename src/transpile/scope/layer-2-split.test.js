"use strict";
Error.stackTraceLimit = 1/0;
const Assert = require("assert").strict;
require("../../tree.js").toggleDebugMode();

const ArrayLite = require("array-lite");
const Tree = require("../../tree.js");
const Lang = require("../../lang");
const State = require("../state.js");
const Split = require("./layer-2-split.js");

const visitor = State.makeRootVisitor(
  "Program",
  () => ArrayLite.forEach(
    ["Base", "Meta"],
    (layer) => Lang.match(
      Split.makeBlock(
        Split.RootScope(),
        (scope) => (
          Split[`declare${layer}StaticVariable`](scope, "identifier", false, "data"),
          Assert.deepEqual(
            Split[`get${layer}StaticData`](scope, "identifier"),
            "data"),
          Tree.CompletionStatement(
            Tree.SequenceExpression(
              Split[`make${layer}StaticInitializeExpression`](
                scope,
                "identifier",
                Tree.PrimitiveExpression(123)),
              Split[`make${layer}LookupExpression`](
                scope,
                "identifier",
                {
                  onMiss: () => Assert.fail(),
                  onDynamicFrame: (frame, expression) => Assert.fail(), 
                  onStaticDeadHit: (data) => Assert.fail(),
                  onStaticLiveHit: (data, read, write) => Tree.PrimitiveExpression(456)}))))),
      Lang.parseBlock(`{
        let $identifier;
        completion (
          $identifier = 123,
          456); }`),
      Assert)));

visitor(
  {
    type: "Program",
    body: []},
  {
    counter: 0,
    locations: [],
    serials: new global.Map(),
    annotations: new global.Map()},
  "context");

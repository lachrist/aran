import {assertEqual, assertDeepEqual} from "./__fixture__.mjs";

import {
  isObjectNode,
  getObjectNodeType,
  isArrayNode,
  getArrayNodeType,
  getArrayNodeContent,
  dispatchObjectNode0,
  dispatchObjectNode1,
  dispatchObjectNode2,
} from "./node.mjs";

const {Error} = globalThis;

assertEqual(isObjectNode({type: 123}), false);

assertEqual(isObjectNode({type: "type"}), true);

assertEqual(getObjectNodeType({type: "type"}), "type");

assertEqual(isArrayNode([123]), false);

assertEqual(isArrayNode(["type"]), true);

assertEqual(getArrayNodeType(["type"]), "type");

assertDeepEqual(getArrayNodeContent(["type", 123, 456]), [123, 456]);

///////
// 0 //
///////

assertEqual(
  dispatchObjectNode0(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}]);
        return "result";
      },
    },
    () => {
      throw new Error("unreachable");
    },
    {type: "type"},
  ),
  "result",
);

assertEqual(
  dispatchObjectNode0(
    {
      TYPE: () => {
        throw new Error("unreachable");
      },
    },
    (...args) => {
      assertDeepEqual(args, [{type: "type"}]);
      return "result";
    },
    {type: "type"},
  ),
  "result",
);

///////
// 1 //
///////

assertEqual(
  dispatchObjectNode1(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}, "extra1"]);
        return "result";
      },
    },
    () => {
      throw new Error("unreachable");
    },
    {type: "type"},
    "extra1",
  ),
  "result",
);

assertEqual(
  dispatchObjectNode1(
    {
      TYPE: () => {
        throw new Error("unreachable");
      },
    },
    (...args) => {
      assertDeepEqual(args, [{type: "type"}, "extra1"]);
      return "result";
    },
    {type: "type"},
    "extra1",
  ),
  "result",
);

///////
// 2 //
///////

assertEqual(
  dispatchObjectNode2(
    {
      type: (...args) => {
        assertDeepEqual(args, [{type: "type"}, "extra1", "extra2"]);
        return "result";
      },
    },
    () => {
      throw new Error("unreachable");
    },
    {type: "type"},
    "extra1",
    "extra2",
  ),
  "result",
);

assertEqual(
  dispatchObjectNode2(
    {
      TYPE: () => {
        throw new Error("unreachable");
      },
    },
    (...args) => {
      assertDeepEqual(args, [{type: "type"}, "extra1", "extra2"]);
      return "result";
    },
    {type: "type"},
    "extra1",
    "extra2",
  ),
  "result",
);

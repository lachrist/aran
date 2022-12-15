import { assertEqual, assertDeepEqual } from "./__fixture__.mjs";

import {
  DEFAULT_CLAUSE,
  MISMATCH_CLAUSE,
  isObjectNode,
  getObjectNodeType,
  isArrayNode,
  getArrayNodeType,
  getArrayNodeContent,
  dispatchObjectNode0,
  dispatchObjectNode1,
  dispatchObjectNode2,
  allignObjectNode0,
  allignObjectNode1,
} from "./node.mjs";

assertEqual(isObjectNode({ type: 123 }), false);

assertEqual(isObjectNode({ type: "type" }), true);

assertEqual(getObjectNodeType({ type: "type" }), "type");

assertEqual(isArrayNode([123]), false);

assertEqual(isArrayNode(["type"]), true);

assertEqual(getArrayNodeType(["type"]), "type");

assertDeepEqual(getArrayNodeContent(["type", 123, 456]), [123, 456]);

// dispatch >> missing //
assertEqual(
  dispatchObjectNode0(
    {
      [DEFAULT_CLAUSE]: (...args) => {
        assertDeepEqual(args, [{ type: "type" }]);
        return "result";
      },
    },
    { type: "type" },
  ),
  "result",
);

// dispatch >> 0 //
assertEqual(
  dispatchObjectNode0(
    {
      type: (...args) => {
        assertDeepEqual(args, [{ type: "type" }]);
        return "result";
      },
    },
    { type: "type" },
  ),
  "result",
);

// dispatch1 //
assertEqual(
  dispatchObjectNode1(
    {
      type: (...args) => {
        assertDeepEqual(args, [{ type: "type" }, "extra1"]);
        return "result";
      },
    },
    { type: "type" },
    "extra1",
  ),
  "result",
);

// dispatch2 //
assertEqual(
  dispatchObjectNode2(
    {
      type: (...args) => {
        assertDeepEqual(args, [{ type: "type" }, "extra1", "extra2"]);
        return "result";
      },
    },
    { type: "type" },
    "extra1",
    "extra2",
  ),
  "result",
);

// allign >> missing //
assertEqual(
  allignObjectNode0(
    {
      [MISMATCH_CLAUSE]: (...args) => {
        assertDeepEqual(args, [{ type: "type1" }, { type: "type2" }]);
        return "result";
      },
    },
    { type: "type1" },
    { type: "type2" },
  ),
  "result",
);

// allign0 //
assertEqual(
  allignObjectNode0(
    {
      type: (...args) => {
        assertDeepEqual(args, [
          { type: "type", foo: 123 },
          { type: "type", foo: 456 },
        ]);
        return "result";
      },
    },
    { type: "type", foo: 123 },
    { type: "type", foo: 456 },
  ),
  "result",
);

// allign1 //
assertEqual(
  allignObjectNode1(
    {
      type: (...args) => {
        assertDeepEqual(args, [
          { type: "type", foo: 123 },
          { type: "type", foo: 456 },
          "extra",
        ]);
        return "result";
      },
    },
    { type: "type", foo: 123 },
    { type: "type", foo: 456 },
    "extra",
  ),
  "result",
);

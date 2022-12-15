import { assertThrow, assertEqual, assertDeepEqual } from "./__fixture__.mjs";

import {
  isObjectNode,
  getObjectNodeType,
  isArrayNode,
  throwUnexpectedArrayNodeType,
  throwUnexpectedObjectNodeType,
  getArrayNodeType,
  getArrayNodeContent,
  dispatchObjectNode0,
  dispatchObjectNode1,
  dispatchObjectNode2,
  allignObjectNode0,
} from "./node.mjs";

const { Error } = globalThis;

assertEqual(isObjectNode({ type: 123 }), false);

assertEqual(isObjectNode({ type: "type" }), true);

assertEqual(getObjectNodeType({ type: "type" }), "type");

assertEqual(isArrayNode([123]), false);

assertEqual(isArrayNode(["type"]), true);

assertEqual(getArrayNodeType(["type"]), "type");

assertDeepEqual(getArrayNodeContent(["type", 123, 456]), [123, 456]);

assertThrow(
  () => throwUnexpectedArrayNodeType(["TYPE"]),
  /^Error: unexpected array node type TYPE$/u,
);

assertThrow(
  () => throwUnexpectedObjectNodeType({ type: "TYPE" }),
  /^Error: unexpected object node type TYPE$/u,
);

///////////////////
// dispatchNode0 //
///////////////////

assertEqual(
  dispatchObjectNode0(
    {
      type: (...args) => {
        assertDeepEqual(args, [{ type: "type" }]);
        return "result";
      },
    },
    () => {
      throw new Error("unreachable");
    },
    { type: "type" },
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
      assertDeepEqual(args, [{ type: "type" }]);
      return "result";
    },
    { type: "type" },
  ),
  "result",
);

///////////////////
// dispatchNode1 //
///////////////////

assertEqual(
  dispatchObjectNode1(
    {
      type: (...args) => {
        assertDeepEqual(args, [{ type: "type" }, "extra1"]);
        return "result";
      },
    },
    () => {
      throw new Error("unreachable");
    },
    { type: "type" },
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
      assertDeepEqual(args, [{ type: "type" }, "extra1"]);
      return "result";
    },
    { type: "type" },
    "extra1",
  ),
  "result",
);

///////////////////
// dispatchNode2 //
///////////////////

assertEqual(
  dispatchObjectNode2(
    {
      type: (...args) => {
        assertDeepEqual(args, [{ type: "type" }, "extra1", "extra2"]);
        return "result";
      },
    },
    () => {
      throw new Error("unreachable");
    },
    { type: "type" },
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
      assertDeepEqual(args, [{ type: "type" }, "extra1", "extra2"]);
      return "result";
    },
    { type: "type" },
    "extra1",
    "extra2",
  ),
  "result",
);

/////////////////
// allignNode0 //
/////////////////

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
    () => {
      throw new Error("unreachable");
    },
    { type: "type", foo: 123 },
    { type: "type", foo: 456 },
  ),
  "result",
);

assertEqual(
  allignObjectNode0(
    {
      type: () => {
        throw new Error("unreachable");
      },
    },
    (...args) => {
      assertDeepEqual(args, [
        { type: "type", foo: 123 },
        { type: "TYPE", foo: 456 },
      ]);
      return "result";
    },
    { type: "type", foo: 123 },
    { type: "TYPE", foo: 456 },
  ),
  "result",
);

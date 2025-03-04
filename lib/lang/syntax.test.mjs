import { assertEqual } from "../test.fixture.mjs";

import {
  packPrimitive,
  unpackPrimitive,
  isProgramNode,
  isStatementNode,
  isEffectNode,
  isExpressionNode,
  getNodeTag,
  setNodeTag,
} from "./syntax.mjs";

// Primitive //
for (const primitive of [123, 123n, "foo", null]) {
  assertEqual(unpackPrimitive(packPrimitive(primitive)), primitive);
}

// Tag //
assertEqual(
  getNodeTag(
    setNodeTag(
      {
        type: "PrimitiveExpression",
        primitive: 123,
        tag: null,
      },
      "bar",
    ),
  ),
  "bar",
);

// Program //
assertEqual(
  isProgramNode({
    type: "Program",
    kind: "module",
    situ: "global",
    head: [],
    body: {
      type: "RoutineBlock",
      bindings: [],
      head: null,
      body: [],
      tail: {
        type: "PrimitiveExpression",
        primitive: 123,
        tag: null,
      },
      tag: null,
    },
    tag: null,
  }),
  true,
);
assertEqual(
  isProgramNode({
    type: "PrimitiveExpression",
    primitive: 123,
    tag: null,
  }),
  false,
);

// Statement //
assertEqual(isStatementNode({ type: "DebuggerStatement", tag: null }), true);
assertEqual(
  isStatementNode({
    type: "PrimitiveExpression",
    primitive: 123,
    tag: null,
  }),
  false,
);

// Effect //
assertEqual(
  isEffectNode({
    type: "ExpressionEffect",
    discard: {
      type: "PrimitiveExpression",
      primitive: 123,
      tag: null,
    },
    tag: null,
  }),
  true,
);
assertEqual(
  isEffectNode({
    type: "PrimitiveExpression",
    primitive: 123,
    tag: null,
  }),
  false,
);

// Expression //
assertEqual(
  isExpressionNode({
    type: "PrimitiveExpression",
    primitive: 123,
    tag: null,
  }),
  true,
);
assertEqual(isExpressionNode({ type: "DebuggerStatement", tag: null }), false);

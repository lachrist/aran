import { assertEqual } from "./test.fixture.mjs";

import {
  packPrimitive,
  unpackPrimitive,
  isProgramNode,
  isLinkNode,
  isClosureBlockNode,
  isControlBlockNode,
  isPseudoBlockNode,
  isStatementNode,
  isEffectNode,
  isExpressionNode,
  getNodeTag,
  setNodeTag,
} from "./lang.mjs";

const { undefined } = globalThis;

// Primitive //
for (const primitive of [undefined, 123, 123n, "foo", null]) {
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
    type: "ScriptProgram",
    body: {
      type: "PseudoBlock",
      statements: [],
      completion: {
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

// Link //
assertEqual(
  {
    type: "ExportLink",
    export: /** @type {estree.Specifier} */ ("export"),
    tag: null,
  },
  true,
);
assertEqual(
  isLinkNode({
    type: "PrimitiveExpression",
    primitive: 123,
    tag: null,
  }),
  false,
);

// PseudoBlock //
assertEqual(
  isPseudoBlockNode({
    type: "PseudoBlock",
    statements: [],
    completion: {
      type: "PrimitiveExpression",
      primitive: 123,
      tag: null,
    },
    tag: null,
  }),
  true,
);
assertEqual(
  isPseudoBlockNode({
    type: "PrimitiveExpression",
    primitive: 123,
    tag: null,
  }),
  false,
);

// ClosureBlock //
assertEqual(
  isClosureBlockNode({
    type: "ClosureBlock",
    variables: [],
    statements: [],
    completion: {
      type: "PrimitiveExpression",
      primitive: 123,
      tag: null,
    },
    tag: null,
  }),
  true,
);
assertEqual(
  isClosureBlockNode({
    type: "PrimitiveExpression",
    primitive: 123,
    tag: null,
  }),
  false,
);

// ControlBlock //
assertEqual(
  isControlBlockNode({
    type: "ControlBlock",
    labels: [],
    variables: [],
    statements: [],
    tag: null,
  }),
  true,
);
assertEqual(
  isControlBlockNode({
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

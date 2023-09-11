import { assertEqual } from "../fixture.mjs";
import {
  packPrimitive,
  unpackPrimitive,
  isProgramNode,
  makeScriptProgram,
  isLinkNode,
  makeExportLink,
  isClosureBlockNode,
  makeClosureBlock,
  isControlBlockNode,
  makeControlBlock,
  isPseudoBlockNode,
  makePseudoBlock,
  isStatementNode,
  makeDebuggerStatement,
  isEffectNode,
  makeExpressionEffect,
  isExpressionNode,
  makePrimitiveExpression,
  getNodeTag,
  setNodeTag,
} from "../../lib/node.mjs";

const { undefined } = globalThis;

// Primitive //
for (const primitive of [undefined, 123, 123n, "foo", null]) {
  assertEqual(unpackPrimitive(packPrimitive(primitive)), primitive);
}

// Tag //
assertEqual(
  getNodeTag(setNodeTag(makePrimitiveExpression(123, "foo"), "bar")),
  "bar",
);

// Program //
assertEqual(
  isProgramNode(
    makeScriptProgram(
      makePseudoBlock([], makePrimitiveExpression(123, null), null),
      null,
    ),
  ),
  true,
);
assertEqual(isProgramNode(makePrimitiveExpression(123, null)), false);

// Link //
assertEqual(
  isLinkNode(makeExportLink(/** @type {Specifier} */ ("export"), null)),
  true,
);
assertEqual(isLinkNode(makePrimitiveExpression(123, null)), false);

// PseudoBlock //
assertEqual(
  isPseudoBlockNode(
    makePseudoBlock([], makePrimitiveExpression(123, null), null),
  ),
  true,
);
assertEqual(isPseudoBlockNode(makePrimitiveExpression(123, null)), false);

// ClosureBlock //
assertEqual(
  isClosureBlockNode(
    makeClosureBlock([], [], makePrimitiveExpression(123, null), null),
  ),
  true,
);
assertEqual(isClosureBlockNode(makePrimitiveExpression(123, null)), false);

// ControlBlock //
assertEqual(isControlBlockNode(makeControlBlock([], [], [], null)), true);
assertEqual(isControlBlockNode(makePrimitiveExpression(123, null)), false);

// Statement //
assertEqual(isStatementNode(makeDebuggerStatement(null)), true);
assertEqual(isStatementNode(makePrimitiveExpression(123, null)), false);

// Effect //
assertEqual(
  isEffectNode(makeExpressionEffect(makePrimitiveExpression(123, null), null)),
  true,
);
assertEqual(isEffectNode(makePrimitiveExpression(123, null)), false);

// Expression //
assertEqual(isExpressionNode(makePrimitiveExpression(123, null)), true);
assertEqual(isExpressionNode(makeDebuggerStatement(null)), false);

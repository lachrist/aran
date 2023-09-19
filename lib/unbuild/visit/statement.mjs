import { TypeSyntaxAranError } from "../../error.mjs";
import { DynamicError, includes, map } from "../../util/index.mjs";
import { makeLayerControlBlock } from "../layer/build.mjs";
import {
  mangleBreakLabel,
  mangleContinueLabel,
  mangleMetaVariable,
} from "../mangle.mjs";
import {
  makeApplyExpression,
  makeBlockStatement,
  makeBreakStatement,
  makeControlBlock,
  makeDebuggerStatement,
  makeEffectStatement,
  makeExpressionEffect,
  makeIfStatement,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeReturnStatement,
  makeTryStatement,
  makeWriteEffect,
} from "../node.mjs";
import { unbuildControlBlock } from "./block.mjs";
import { unbuildExpression } from "./expression.mjs";

/**
 * @type {<S>(
 *   node: estree.Statement,
 *   context: import("./context.js").Context<S>,
 *   labels: estree.Label[],
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildStatement = (node, context, labels) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "DebuggerStatement":
      return [makeDebuggerStatement(serial)];
    case "ReturnStatement":
      return [
        makeReturnStatement(
          node.argument == null
            ? makePrimitiveExpression({ undefined: null }, serial)
            : unbuildExpression(node.argument, context, null),
          serial,
        ),
      ];
    case "BreakStatement": {
      if (node.label == null) {
        if (context.break === null) {
          throw new DynamicError("Illegal break statement", node);
        } else {
          return [makeBreakStatement(context.break, serial)];
        }
      } else if (includes(labels, node.label.name)) {
        return [];
      } else {
        return [
          makeBreakStatement(
            mangleBreakLabel(/** @type {estree.Label} */ (node.label.name)),
            serial,
          ),
        ];
      }
    }
    case "ContinueStatement":
      if (node.label == null) {
        if (context.continue === null) {
          throw new DynamicError("Illegal continue statement", node);
        } else {
          return [makeBreakStatement(context.continue, serial)];
        }
      } else if (includes(labels, node.label.name)) {
        return [];
      } else {
        return [
          makeBreakStatement(
            mangleContinueLabel(/** @type {estree.Label} */ (node.label.name)),
            serial,
          ),
        ];
      }
    case "BlockStatement":
      return [
        makeBlockStatement(
          unbuildControlBlock(node, context, {
            labels: map(labels, mangleBreakLabel),
            with: null,
          }),
          serial,
        ),
      ];
    case "WithStatement": {
      const frame = {
        var: mangleMetaVariable(hash, "statement", "with"),
        val: unbuildExpression(node.object, context, null),
      };
      return [
        makeEffectStatement(
          makeWriteEffect(frame.var, frame.val, serial),
          serial,
        ),
        makeBlockStatement(
          unbuildControlBlock(node.body, context, {
            labels: map(labels, mangleBreakLabel),
            with: frame.var,
          }),
          serial,
        ),
      ];
    }
    case "IfStatement":
      return [
        makeIfStatement(
          unbuildExpression(node.test, context, null),
          unbuildControlBlock(node.consequent, context, {
            labels: map(labels, mangleBreakLabel),
            with: null,
          }),
          node.alternate == null
            ? makeControlBlock(map(labels, mangleBreakLabel), [], [], serial)
            : unbuildControlBlock(node.alternate, context, {
                labels: map(labels, mangleBreakLabel),
                with: null,
              }),
          serial,
        ),
      ];
    case "TryStatement":
      return [
        makeTryStatement(
          unbuildControlBlock(node.block, context, {
            labels: map(labels, mangleBreakLabel),
            with: null,
          }),
          node.handler == null
            ? makeControlBlock(
                map(labels, mangleBreakLabel),
                [],
                [
                  makeEffectStatement(
                    makeExpressionEffect(
                      makeApplyExpression(
                        makeIntrinsicExpression("aran.throw", serial),
                        makePrimitiveExpression({ undefined: null }, serial),
                        [makeReadExpression("catch.error", serial)],
                        serial,
                      ),
                      serial,
                    ),
                    serial,
                  ),
                ],
                serial,
              )
            : // TODO
              makeLayerControlBlock(
                map(labels, mangleBreakLabel),
                [],
                [],
                [],
                serial,
              ),
          node.finalizer == null
            ? makeControlBlock(map(labels, mangleBreakLabel), [], [], serial)
            : unbuildControlBlock(node.finalizer, context, {
                labels: map(labels, mangleBreakLabel),
                with: null,
              }),
          serial,
        ),
      ];
    default:
      throw new TypeSyntaxAranError("statement", node);
  }
};

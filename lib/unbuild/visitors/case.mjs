import { makeBinaryExpression } from "../intrinsic.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeConditionalExpression,
  makeEffectStatement,
  makeIfStatement,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
} from "../node.mjs";
import { makeScopeControlBlock } from "../scope/block.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildAllStatement } from "./statement.mjs";

/**
 * @type {<S>(
 *   node: estree.SwitchCase,
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     discriminant: unbuild.Variable,
 *     matched: unbuild.Variable,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *     completion: import("./statement.mjs").Completion,
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildCase = (
  node,
  context,
  { discriminant, matched, completion, loop },
) => {
  const { serialize } = context;
  const serial = serialize(node);
  if (node.test == null) {
    return [
      makeEffectStatement(
        makeWriteEffect(
          matched,
          makePrimitiveExpression(true, serial),
          serial,
          false,
        ),
        serial,
      ),
      ...unbuildAllStatement(node.consequent, context, {
        labels: [],
        completion,
        loop,
      }),
    ];
  } else {
    return [
      makeIfStatement(
        makeConditionalExpression(
          makeReadExpression(matched, serial),
          makePrimitiveExpression(true, serial),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadExpression(discriminant, serial),
              unbuildExpression(node.test, context, { name: ANONYMOUS }),
              serial,
            ),
            makeSequenceExpression(
              makeWriteEffect(
                matched,
                makePrimitiveExpression(true, serial),
                serial,
                false,
              ),
              makePrimitiveExpression(true, serial),
              serial,
            ),
            makePrimitiveExpression(false, serial),
            serial,
          ),
          serial,
        ),
        makeScopeControlBlock(
          context,
          {
            type: "block",
            kinds: {},
          },
          [],
          // eslint-disable-next-line no-shadow
          (context) =>
            unbuildAllStatement(node.consequent, context, {
              labels: [],
              completion,
              loop,
            }),
          serial,
        ),
        makeScopeControlBlock(
          context,
          {
            type: "block",
            kinds: {},
          },
          [],
          (_context) => [],
          serial,
        ),
        serial,
      ),
    ];
  }
};
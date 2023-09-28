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
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     discriminant: unbuild.Variable,
 *     matched: unbuild.Variable,
 *     completion: import("./statement.mjs").Completion,
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildCase = (
  node,
  context,
  { discriminant, matched, completion },
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
            with: null,
          },
          [],
          // eslint-disable-next-line no-shadow
          (context) =>
            unbuildAllStatement(node.consequent, context, {
              labels: [],
              completion,
            }),
          serial,
        ),
        makeScopeControlBlock(
          context,
          {
            type: "block",
            kinds: {},
            with: null,
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

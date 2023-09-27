import { flatMap } from "../../util/index.mjs";
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
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {<S>(
 *   node: estree.SwitchCase,
 *   context: import("./context.d.ts").Context<S>,
 *   options: {
 *     discriminant: unbuild.Variable,
 *     matched: unbuild.Variable,
 *   },
 * ) => aran.Statement<unbuild.Atom<S>>[]}
 */
export const unbuildCase = (node, context, { discriminant, matched }) => {
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
      ...flatMap(node.consequent, (child) =>
        unbuildStatement(child, context, { labels: [] }),
      ),
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
            flatMap(node.consequent, (child) =>
              unbuildStatement(child, context, { labels: [] }),
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
          (_context) => [],
          serial,
        ),
        serial,
      ),
    ];
  }
};

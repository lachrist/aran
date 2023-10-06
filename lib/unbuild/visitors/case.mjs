import { drill, drillAll, drillArray } from "../../drill.mjs";
import { filterOut } from "../../util/index.mjs";
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
import { hasTestSwitchCase } from "../predicate.mjs";
import { makeScopeControlBlock } from "../scope/block.mjs";
import { unbuildExpression } from "./expression.mjs";
import { isPairHoisted, unbuildAllStatement } from "./statement.mjs";

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.SwitchCase,
 *     path: unbuild.Path,
 *   },
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
  { node, path },
  context,
  { discriminant, matched, completion, loop },
) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  if (hasTestSwitchCase(node)) {
    return [
      makeIfStatement(
        makeConditionalExpression(
          makeReadExpression(matched, serial),
          makePrimitiveExpression(true, serial),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadExpression(discriminant, serial),
              unbuildExpression(drill({ node, path }, "test"), context, {
                name: ANONYMOUS,
              }),
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
          (context) =>
            unbuildAllStatement(
              filterOut(
                drillAll(drillArray({ node, path }, "consequent")),
                isPairHoisted,
              ),
              context,
              {
                labels: [],
                completion,
                loop,
              },
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
          (_context) => [],
          serial,
        ),
        serial,
      ),
    ];
  } else {
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
      ...unbuildAllStatement(
        drillAll(drillArray({ node, path }, "consequent")),
        context,
        {
          labels: [],
          completion,
          loop,
        },
      ),
    ];
  }
};

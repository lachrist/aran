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
import { isPairHoisted, listBodyStatement } from "./statement.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.SwitchCase,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     discriminant: unbuild.Variable,
 *     matched: unbuild.Variable,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *     completion: import("./statement.mjs").Completion,
 *   },
 * ) => (aran.Statement<unbuild.Atom>)[]}
 */
export const unbuildCase = (
  { node, path },
  context,
  { discriminant, matched, completion, loop },
) => {
  if (hasTestSwitchCase(node)) {
    return [
      makeIfStatement(
        makeConditionalExpression(
          makeReadExpression(matched, path),
          makePrimitiveExpression(true, path),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeReadExpression(discriminant, path),
              unbuildExpression(drill({ node, path }, "test"), context, {
                name: ANONYMOUS,
              }),
              path,
            ),
            makeSequenceExpression(
              makeWriteEffect(
                matched,
                makePrimitiveExpression(true, path),
                false,
                path,
              ),
              makePrimitiveExpression(true, path),
              path,
            ),
            makePrimitiveExpression(false, path),
            path,
          ),
          path,
        ),
        makeScopeControlBlock(
          context,
          {
            type: "block",
            kinds: {},
          },
          [],
          (context) =>
            listBodyStatement(
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
          path,
        ),
        makeScopeControlBlock(
          context,
          {
            type: "block",
            kinds: {},
          },
          [],
          (_context) => [],
          path,
        ),
        path,
      ),
    ];
  } else {
    return [
      makeEffectStatement(
        makeWriteEffect(
          matched,
          makePrimitiveExpression(true, path),
          false,
          path,
        ),
        path,
      ),
      ...listBodyStatement(
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

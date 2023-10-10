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
import { wrapOriginArray } from "../origin.mjs";
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
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildCase = wrapOriginArray(
  ({ node, path }, context, { discriminant, matched, completion, loop }) => {
    if (hasTestSwitchCase(node)) {
      return [
        makeIfStatement(
          makeConditionalExpression(
            makeReadExpression(matched),
            makePrimitiveExpression(true),
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeReadExpression(discriminant),
                unbuildExpression(drill({ node, path }, "test"), context, {
                  name: ANONYMOUS,
                }),
              ),
              makeSequenceExpression(
                makeWriteEffect(matched, makePrimitiveExpression(true), false),
                makePrimitiveExpression(true),
              ),
              makePrimitiveExpression(false),
            ),
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
          ),
          makeScopeControlBlock(
            context,
            {
              type: "block",
              kinds: {},
            },
            [],
            (_context) => [],
          ),
        ),
      ];
    } else {
      return [
        makeEffectStatement(
          makeWriteEffect(matched, makePrimitiveExpression(true), false),
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
  },
);

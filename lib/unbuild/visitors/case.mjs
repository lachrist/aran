import { drill, drillAll, drillArray } from "../../drill.mjs";
import { flatMap } from "../../util/index.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { splitMeta, zipMeta } from "../mangle.mjs";
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
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.SwitchCase,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.Meta,
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
  { meta, discriminant, matched, completion, loop },
) => {
  if (hasTestSwitchCase(node)) {
    const metas = splitMeta(meta, ["test", "consequent"]);
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
                meta: metas.test,
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
            this: null,
            catch: false,
            kinds: {},
          },
          [],
          (context) =>
            flatMap(
              zipMeta(
                metas.consequent,
                drillAll(drillArray({ node, path }, "consequent")),
              ),
              ([meta, pair]) =>
                unbuildStatement(pair, context, {
                  meta,
                  labels: [],
                  completion,
                  loop,
                }),
            ),
          path,
        ),
        makeScopeControlBlock(
          context,
          {
            type: "block",
            this: null,
            catch: false,
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
      ...flatMap(
        zipMeta(meta, drillAll(drillArray({ node, path }, "consequent"))),
        ([meta, pair]) =>
          unbuildStatement(pair, context, {
            meta,
            labels: [],
            completion,
            loop,
          }),
      ),
    ];
  }
};

import { listPatternVariable } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { makeBlockStatement, makeReadExpression } from "../node.mjs";
import { unbuildControlBlock } from "./block.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill } from "../../drill.mjs";
import { hasParam } from "../predicate.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(variable: estree.Variable) => [estree.Variable, estree.VariableKind]} */
const makeLetEntry = (variable) => [variable, "let"];

/**
 * @type {(
 *   pair: {
 *     node: estree.CatchClause,
 *     path: unbuild.Path,
 *   },
 *   context1: import("../context.js").Context,
 *   options: {
 *     labels: unbuild.Label[],
 *     completion: import("./statement.mjs").Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildCatch = (
  { node, path },
  context1,
  { labels, completion, loop },
) => {
  if (hasParam(node)) {
    return makeScopeControlBlock(
      context1,
      {
        type: "block",
        kinds: reduceEntry(map(listPatternVariable(node.param), makeLetEntry)),
      },
      labels,
      (context2) => [
        ...unbuildPatternStatement(drill({ node, path }, "param"), context2, {
          right: { var: null, val: makeReadExpression("catch.error", path) },
        }),
        makeBlockStatement(
          unbuildControlBlock(drill({ node, path }, "body"), context2, {
            labels,
            loop,
            completion,
            kinds: {},
          }),
          path,
        ),
      ],
      path,
    );
  } else {
    return unbuildControlBlock(drill({ node, path }, "body"), context1, {
      labels,
      completion,
      loop,
      kinds: {},
    });
  }
};

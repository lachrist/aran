import { listPatternVariable } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { makeBlockStatement } from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill } from "../site.mjs";
import { isNotNullishSite } from "../predicate.mjs";
import { makeReadCatchErrorExpression } from "../param/index.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(variable: estree.Variable) => [estree.Variable, estree.VariableKind]} */
const makeLetEntry = (variable) => [variable, "let"];

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.CatchClause>,
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
  { node, path, meta },
  context,
  { labels, completion, loop },
) => {
  const sites = drill({ node, path, meta }, ["param", "body"]);
  if (isNotNullishSite(sites.param)) {
    const TS_NARROW = sites.param;
    return makeScopeControlBlock(
      { ...context, catch: true },
      {
        link: null,
        kinds: reduceEntry(
          map(listPatternVariable(sites.param.node), makeLetEntry),
        ),
      },
      labels,
      (context) => [
        ...unbuildPatternStatement(TS_NARROW, context, {
          right: makeReadCatchErrorExpression(context, {
            path,
          }),
        }),
        makeBlockStatement(
          unbuildControlBody(sites.body, context, {
            labels,
            loop,
            completion,
          }),
          path,
        ),
      ],
      path,
    );
  } else {
    return unbuildControlBody(sites.body, context, {
      labels,
      completion,
      loop,
    });
  }
};

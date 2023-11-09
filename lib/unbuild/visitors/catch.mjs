import { listPatternVariable } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { makeParamExpression } from "../param-index.mjs";
import { makeBlockStatement } from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill } from "../site.mjs";
import { isNotNullishSite } from "../predicate.mjs";

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
  context1,
  { labels, completion, loop },
) => {
  const sites = drill({ node, path, meta }, ["param", "body"]);
  if (isNotNullishSite(sites.param)) {
    const TS_NARROW = sites.param;
    return makeScopeControlBlock(
      {
        ...context1,
        params: [
          ...context1.params,
          { type: "block", this: null, catch: true },
        ],
      },
      {
        type: "block",
        kinds: reduceEntry(
          map(listPatternVariable(sites.param.node), makeLetEntry),
        ),
      },
      labels,
      (context2) => [
        ...unbuildPatternStatement(TS_NARROW, context2, {
          right: makeParamExpression(context2, "catch.error", path),
        }),
        makeBlockStatement(
          unbuildControlBody(sites.body, context2, {
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
    return unbuildControlBody(sites.body, context1, {
      labels,
      completion,
      loop,
    });
  }
};

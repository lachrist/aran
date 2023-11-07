import { listPatternVariable } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import {
  makeScopeControlBlock,
  makeScopeParameterExpression,
} from "../scope/index.mjs";
import { makeBlockStatement } from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill } from "../site.mjs";
import { hasParam } from "../predicate.mjs";

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
  if (hasParam(node)) {
    const sites = drill({ node, path, meta }, ["param", "body"]);
    return makeScopeControlBlock(
      context1,
      {
        type: "block",
        this: null,
        catch: true,
        kinds: reduceEntry(map(listPatternVariable(node.param), makeLetEntry)),
      },
      labels,
      (context2) => [
        ...unbuildPatternStatement(sites.param, context2, {
          right: makeScopeParameterExpression(context2, "catch.error", path),
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
    return unbuildControlBody(
      drill({ node, path, meta }, ["body"]).body,
      context1,
      { labels, completion, loop },
    );
  }
};

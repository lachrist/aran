import { listPatternVariable } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import {
  makeScopeControlBlock,
  makeScopeParameterExpression,
} from "../scope/index.mjs";
import { makeBlockStatement } from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";
import { drill } from "../../drill.mjs";
import { hasParam } from "../predicate.mjs";
import { splitMeta } from "../mangle.mjs";

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
 *     meta: unbuild.Meta,
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
  { meta, labels, completion, loop },
) => {
  if (hasParam(node)) {
    const metas = splitMeta(meta, ["param", "body"]);
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
        ...unbuildPatternStatement(drill({ node, path }, "param"), context2, {
          meta: metas.param,
          right: makeScopeParameterExpression(context2, "catch.error", path),
        }),
        makeBlockStatement(
          unbuildControlBody(drill({ node, path }, "body"), context2, {
            meta: metas.body,
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
    return unbuildControlBody(drill({ node, path }, "body"), context1, {
      meta,
      labels,
      completion,
      loop,
    });
  }
};

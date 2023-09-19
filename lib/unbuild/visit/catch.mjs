import { TypeSyntaxAranError } from "../../error.mjs";
import { listPatternVariable } from "../../estree/hoist.mjs";
import { map } from "../../util/index.mjs";
import { makeLayerControlBlock } from "../layer/build.mjs";
import { makeBlockStatement } from "../node.mjs";
import {
  extendScope,
  listScopeDeclareStatement,
  listScopeVariable,
} from "../scope/index.mjs";
import { unbuildControlBlock } from "./block.mjs";
import { unbuildPatternStatement } from "./pattern.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(variable: estree.Variable) => [estree.Variable, estree.VariableKind]} */
const makeLetEntry = (variable) => [variable, "let"];

/**
 * @type {<S>(
 *   node: estree.CatchClause,
 *   context1: import("./context.js").Context<S>,
 *   labels: unbuild.Label[],
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const unbuildCatch = (node, context1, labels) => {
  const { serialize } = context1;
  const serial = serialize(node);
  switch (node.type) {
    case "CatchClause":
      if (node.param === null) {
        return unbuildControlBlock(node.body, context1, { labels, with: null });
      } else {
        const context2 = {
          ...context1,
          scope: extendScope(
            context1.strict,
            context1.scope,
            reduceEntry(map(listPatternVariable(node.param), makeLetEntry)),
            {
              type: "block",
              with: null,
            },
          ),
        };
        return makeLayerControlBlock(
          labels,
          context2.free_meta_variable_array,
          listScopeVariable(context2.strict, context2.scope),
          [
            ...listScopeDeclareStatement(
              context2.strict,
              context2.scope,
              serial,
            ),
            ...unbuildPatternStatement(node.param, context2, "catch.error"),
            makeBlockStatement(
              unbuildControlBlock(node.body, context2, { labels, with: null }),
              serial,
            ),
          ],
          serial,
        );
      }
    default:
      throw new TypeSyntaxAranError("catch", node);
  }
};
